const mongoose = require("mongoose")

const ExamResultSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    answers: [{ type: Number }],
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    cancelled: { type: Boolean, default: false },
    timeTaken: { type: Number, default: 0 },
    violations: [
      {
        count: Number,
        message: String,
        time: String,
      },
    ],
  },
  { timestamps: true }
)

module.exports = mongoose.model("ExamResult", ExamResultSchema)
