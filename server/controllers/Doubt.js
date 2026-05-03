const Doubt = require("../models/Doubt")
const Course = require("../models/Course")

// Student creates a doubt
exports.createDoubt = async (req, res) => {
  try {
    const { courseId, title, message } = req.body
    const studentId = req.user.id

    const doubt = await Doubt.create({
      course: courseId,
      student: studentId,
      title,
      message,
    })

    const populated = await doubt.populate("student", "firstName lastName image")

    res.json({ success: true, doubt: populated })
  } catch (error) {
    console.log("createDoubt error:", error)
    res.status(500).json({ success: false, message: "Could not create doubt" })
  }
}

// Get all doubts for a course
exports.getCourseDoubts = async (req, res) => {
  try {
    const { courseId } = req.params

    const doubts = await Doubt.find({ course: courseId })
      .populate("student", "firstName lastName image")
      .populate("replies.author", "firstName lastName image")
      .sort({ createdAt: -1 })

    res.json({ success: true, doubts })
  } catch (error) {
    console.log("getCourseDoubts error:", error)
    res.status(500).json({ success: false, message: "Could not fetch doubts" })
  }
}

// Reply to a doubt (instructor or student)
exports.replyToDoubt = async (req, res) => {
  try {
    const { doubtId, message } = req.body
    const userId = req.user.id

    const doubt = await Doubt.findByIdAndUpdate(
      doubtId,
      {
        $push: {
          replies: { author: userId, message },
        },
      },
      { new: true }
    )
      .populate("student", "firstName lastName image")
      .populate("replies.author", "firstName lastName image")

    res.json({ success: true, doubt })
  } catch (error) {
    console.log("replyToDoubt error:", error)
    res.status(500).json({ success: false, message: "Could not reply" })
  }
}

// Mark doubt as resolved
exports.resolveDoubt = async (req, res) => {
  try {
    const { doubtId } = req.body

    const doubt = await Doubt.findByIdAndUpdate(
      doubtId,
      { isResolved: true },
      { new: true }
    )

    res.json({ success: true, doubt })
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not resolve doubt" })
  }
}

// Get doubts for instructor (all their courses)
exports.getInstructorDoubts = async (req, res) => {
  try {
    const instructorId = req.user.id

    // Find courses by this instructor
    const courses = await Course.find({ instructor: instructorId }).select("_id courseName")
    const courseIds = courses.map((c) => c._id)

    const doubts = await Doubt.find({ course: { $in: courseIds } })
      .populate("student", "firstName lastName image")
      .populate("course", "courseName")
      .populate("replies.author", "firstName lastName image")
      .sort({ createdAt: -1 })

    res.json({ success: true, doubts })
  } catch (error) {
    console.log("getInstructorDoubts error:", error)
    res.status(500).json({ success: false, message: "Could not fetch doubts" })
  }
}
