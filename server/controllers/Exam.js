const Exam = require("../models/Exam")
const ExamResult = require("../models/ExamResult")
const Course = require("../models/Course")

const PASS_PERCENTAGE = 40

// Instructor creates exam
exports.createExam = async (req, res) => {
  try {
    const { courseId, title, description, questions, duration } = req.body
    const instructorId = req.user.id

    const exam = await Exam.create({
      course: courseId,
      instructor: instructorId,
      title,
      description,
      questions,
      duration: duration || 30,
    })

    res.json({ success: true, exam })
  } catch (error) {
    console.log("createExam error:", error)
    res.status(500).json({ success: false, message: "Could not create exam" })
  }
}

// Get exams for a course (student view - includes their result)
exports.getCourseExams = async (req, res) => {
  try {
    const { courseId } = req.params
    const studentId = req.user.id

    const exams = await Exam.find({ course: courseId, isActive: true })
      .select("-questions.correctOption")
      .sort({ createdAt: -1 })

    // Attach student's latest result to each exam
    const examsWithResults = await Promise.all(
      exams.map(async (exam) => {
        const result = await ExamResult.findOne({
          exam: exam._id,
          student: studentId,
        }).sort({ createdAt: -1 })

        return {
          ...exam.toObject(),
          studentResult: result
            ? {
                percentage: result.percentage,
                score: result.score,
                passed: result.passed,
                cancelled: result.cancelled,
                attemptedAt: result.createdAt,
              }
            : null,
        }
      })
    )

    res.json({ success: true, exams: examsWithResults })
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not fetch exams" })
  }
}

// Get exam with answers (instructor only)
exports.getExamForInstructor = async (req, res) => {
  try {
    const { examId } = req.params
    const exam = await Exam.findById(examId)
    res.json({ success: true, exam })
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not fetch exam" })
  }
}

// Student submits exam
exports.submitExam = async (req, res) => {
  try {
    const { examId, answers, timeTaken, forceCancel, violations } = req.body
    const studentId = req.user.id

    const exam = await Exam.findById(examId)
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" })

    // Check if student already passed
    const existingPass = await ExamResult.findOne({
      exam: examId,
      student: studentId,
      passed: true,
    })
    if (existingPass) {
      return res.json({
        success: false,
        message: "You have already passed this exam and cannot retake it.",
      })
    }

    // Force cancel — cheating detected
    if (forceCancel) {
      await ExamResult.create({
        exam: examId,
        student: studentId,
        course: exam.course,
        answers: [],
        score: 0,
        totalQuestions: exam.questions.length,
        percentage: 0,
        passed: false,
        cancelled: true,
        timeTaken: timeTaken || 0,
        violations: violations || [],
      })

      return res.json({
        success: true,
        score: 0,
        totalQuestions: exam.questions.length,
        percentage: 0,
        passed: false,
        cancelled: true,
        results: [],
        message: "Exam cancelled due to cheating. Score: 0",
      })
    }

    // Normal submission — calculate score
    let score = 0
    const results = exam.questions.map((q, i) => {
      const isCorrect = answers[i] === q.correctOption
      if (isCorrect) score++
      return {
        questionText: q.questionText,
        options: q.options,
        selectedOption: answers[i],
        correctOption: q.correctOption,
        explanation: q.explanation,
        isCorrect,
      }
    })

    const percentage = Math.round((score / exam.questions.length) * 100)
    const passed = percentage >= PASS_PERCENTAGE

    await ExamResult.create({
      exam: examId,
      student: studentId,
      course: exam.course,
      answers,
      score,
      totalQuestions: exam.questions.length,
      percentage,
      passed,
      cancelled: false,
      timeTaken,
      violations: violations || [],
    })

    res.json({
      success: true,
      score,
      totalQuestions: exam.questions.length,
      percentage,
      passed,
      cancelled: false,
      results,
    })
  } catch (error) {
    console.log("submitExam error:", error)
    res.status(500).json({ success: false, message: "Could not submit exam" })
  }
}

// Delete exam
exports.deleteExam = async (req, res) => {
  try {
    const { examId } = req.body
    await Exam.findByIdAndDelete(examId)
    res.json({ success: true, message: "Exam deleted" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete exam" })
  }
}
