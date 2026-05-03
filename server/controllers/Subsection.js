const Section = require("../models/Section")
const SubSection = require("../models/Subsection")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const Groq = require("groq-sdk")
const axios = require("axios")
const fs = require("fs")
const path = require("path")

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Helper: Generate transcript from video URL using Groq Whisper
const generateTranscript = async (videoUrl) => {
  try {
    console.log("🎙️ Generating transcript for:", videoUrl)

    const tempPath = path.join(__dirname, `../utils/temp_${Date.now()}.mp4`)

    // Download video to temp file
    const response = await axios({ url: videoUrl, responseType: "stream" })
    const writer = fs.createWriteStream(tempPath)
    await new Promise((resolve, reject) => {
      response.data.pipe(writer)
      writer.on("finish", resolve)
      writer.on("error", reject)
    })

    // Send to Groq Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-large-v3-turbo",
      response_format: "text",
    })

    // Delete temp file
    fs.unlinkSync(tempPath)

    console.log("✅ Transcript generated successfully")
    return transcription || ""
  } catch (error) {
    console.log("⚠️ Transcript generation failed:", error.message)
    return ""
  }
}

// Create a new sub-section for a given section
exports.createSubSection = async (req, res) => {
  try {
    const { sectionId, title, description } = req.body
    const video = req.files.video

    if (!sectionId || !title || !description || !video) {
      return res
        .status(404)
        .json({ success: false, message: "All Fields are Required" })
    }

    console.log(video)

    // Upload video to Cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    )
    console.log(uploadDetails)

    // Generate transcript from uploaded video
    const transcript = await generateTranscript(uploadDetails.secure_url)

    // Create SubSection with transcript
    const SubSectionDetails = await SubSection.create({
      title: title,
      timeDuration: `${uploadDetails.duration}`,
      description: description,
      videoUrl: uploadDetails.secure_url,
      transcript: transcript,
    })

    // Update section
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      { $push: { subSection: SubSectionDetails._id } },
      { new: true }
    ).populate("subSection")

    return res.status(200).json({ success: true, data: updatedSection })
  } catch (error) {
    console.error("Error creating new sub-section:", error)
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

exports.updateSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId, title, description } = req.body
    const subSection = await SubSection.findById(subSectionId)

    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      })
    }

    if (title !== undefined) subSection.title = title
    if (description !== undefined) subSection.description = description

    if (req.files && req.files.video !== undefined) {
      const video = req.files.video
      const uploadDetails = await uploadImageToCloudinary(
        video,
        process.env.FOLDER_NAME
      )
      subSection.videoUrl = uploadDetails.secure_url
      subSection.timeDuration = `${uploadDetails.duration}`

      // Re-generate transcript when video is updated
      const transcript = await generateTranscript(uploadDetails.secure_url)
      subSection.transcript = transcript
    }

    await subSection.save()

    const updatedSection = await Section.findById(sectionId).populate("subSection")
    console.log("updated section", updatedSection)

    return res.json({
      success: true,
      message: "Section updated successfully",
      data: updatedSection,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the section",
    })
  }
}

exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body
    await Section.findByIdAndUpdate(
      { _id: sectionId },
      { $pull: { subSection: subSectionId } }
    )
    const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

    if (!subSection) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" })
    }

    const updatedSection = await Section.findById(sectionId).populate("subSection")

    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      data: updatedSection,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the SubSection",
    })
  }
}
