const mongoose = require("mongoose")

const quizResultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    subSection: { type: mongoose.Schema.Types.ObjectId, ref: "SubSection", required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model("QuizResult", quizResultSchema)
