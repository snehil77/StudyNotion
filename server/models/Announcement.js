const mongoose = require("mongoose")

const announcementSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Announcement", announcementSchema)
