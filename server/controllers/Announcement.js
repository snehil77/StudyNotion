const Announcement = require("../models/Announcement")
const Course = require("../models/Course")

// Instructor creates announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { courseId, title, message } = req.body
    const instructorId = req.user.id

    const announcement = await Announcement.create({
      course: courseId,
      instructor: instructorId,
      title,
      message,
    })

    res.json({ success: true, announcement })
  } catch (error) {
    console.log("createAnnouncement error:", error)
    res.status(500).json({ success: false, message: "Could not create announcement" })
  }
}

// Get announcements for a course
exports.getCourseAnnouncements = async (req, res) => {
  try {
    const { courseId } = req.params

    const announcements = await Announcement.find({ course: courseId })
      .populate("instructor", "firstName lastName image")
      .sort({ createdAt: -1 })

    res.json({ success: true, announcements })
  } catch (error) {
    console.log("getCourseAnnouncements error:", error)
    res.status(500).json({ success: false, message: "Could not fetch announcements" })
  }
}

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.body
    await Announcement.findByIdAndDelete(announcementId)
    res.json({ success: true, message: "Announcement deleted" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete announcement" })
  }
}
