const mongoose = require("mongoose")

const doubtTimestampSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    subSection: { type: mongoose.Schema.Types.ObjectId, ref: "SubSection", required: true },
    videoTimestamp: { type: Number, default: 0 }, // seconds into video when doubt asked
    question: { type: String, required: true },
    answer: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.model("DoubtTimestamp", doubtTimestampSchema)
