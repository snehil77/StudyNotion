const CourseProgress = require("../models/CourseProgress")
const Course = require("../models/Course")
const User = require("../models/User")
const ExamResult = require("../models/ExamResult")
const WatchTime = require("../models/WatchTime")
const DoubtTimestamp = require("../models/DoubtTimestamp")
const Groq = require("groq-sdk")

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

exports.getStudentProgress = async (req, res) => {
  try {
    const { courseId } = req.params
    const studentId = req.user.id

    // ── Course & total lectures ──────────────────────────────
    const course = await Course.findById(courseId).populate({
      path: "courseContent",
      populate: { path: "subSection" },
    })

    const totalLectures = course?.courseContent?.reduce(
      (acc, sec) => acc + (sec.subSection?.length || 0), 0
    ) || 0

    // ── Course Progress ──────────────────────────────────────
    const progress = await CourseProgress.findOne({ courseID: courseId, userId: studentId })
    const completedVideos = progress?.completedVideos || []
    const completedLectures = completedVideos.length
    const progressPercent = totalLectures > 0
      ? Math.round((completedLectures / totalLectures) * 100) : 0

    // ── Last watched lecture title ───────────────────────────
    let lastWatchedTitle = "—"
    if (completedVideos.length > 0) {
      const lastId = completedVideos[completedVideos.length - 1]
      for (const section of course?.courseContent || []) {
        const found = section.subSection?.find(
          (ss) => ss._id.toString() === lastId.toString()
        )
        if (found) { lastWatchedTitle = found.title; break }
      }
    }

    // ── Exam Results ─────────────────────────────────────────
    const examResultDocs = await ExamResult.find({ student: studentId, course: courseId })
      .populate("exam", "title")
      .sort({ createdAt: 1 })

    const examResults = examResultDocs.map((r) => ({
      exam: { title: r.exam?.title || "Exam" },
      percentage: r.percentage,
      score: r.score,
      totalQuestions: r.totalQuestions,
      passed: r.passed,
      cancelled: r.cancelled || false,
      timeTaken: r.timeTaken || 0,
      violations: r.violations || [],
      createdAt: r.createdAt,
    }))

    const avgQuizScore = examResults.length > 0
      ? Math.round(examResults.reduce((acc, r) => acc + r.percentage, 0) / examResults.length)
      : null

    // ── Watch Time Data ──────────────────────────────────────
    const watchRecords = await WatchTime.find({ student: studentId, course: courseId })
      .populate("subSection", "title")

    const totalWatchSeconds = watchRecords.reduce((sum, r) => sum + (r.totalWatchSeconds || 0), 0)
    const totalWatchMinutes = Math.round(totalWatchSeconds / 60)

    // Per-lecture watch time
    const lectureWatchTime = watchRecords.map((r) => ({
      title: r.subSection?.title || "Lecture",
      totalMinutes: Math.round((r.totalWatchSeconds || 0) / 60),
      lastWatchedAt: r.lastWatchedAt,
      lastTimestamp: r.lastVideoTimestamp || 0,
      sessionCount: r.sessions?.length || 0,
    }))

    // ── Doubt Timestamps ─────────────────────────────────────
    const doubtTimestampDocs = await DoubtTimestamp.find({ student: studentId, course: courseId })
      .populate("subSection", "title")
      .sort({ createdAt: -1 })

    const doubtTimestamps = doubtTimestampDocs.map((d) => ({
      lectureTitle: d.subSection?.title || "Lecture",
      videoTimestamp: d.videoTimestamp || 0,
      videoTimestampFormatted: formatSeconds(d.videoTimestamp || 0),
      question: d.question,
      answer: d.answer || "",
      askedAt: d.createdAt,
    }))

    // ── Proctoring Summary ───────────────────────────────────
    const allViolations = []
    let totalCancelled = 0
    let totalPassed = 0

    for (const r of examResultDocs) {
      if (r.cancelled) totalCancelled++
      if (r.passed) totalPassed++
      if (r.violations?.length > 0) {
        allViolations.push({
          examTitle: r.exam?.title || "Exam",
          attemptedAt: r.createdAt,
          violations: r.violations,
          cancelled: r.cancelled || false,
        })
      }
    }

    // Violation type counts
    const violationCounts = { tabSwitch: 0, noFace: 0, multipleFaces: 0, noise: 0, fullscreenExit: 0 }
    for (const examViol of allViolations) {
      for (const v of examViol.violations) {
        const msg = (v.message || "").toLowerCase()
        if (msg.includes("tab")) violationCounts.tabSwitch++
        else if (msg.includes("no face")) violationCounts.noFace++
        else if (msg.includes("multiple")) violationCounts.multipleFaces++
        else if (msg.includes("noise") || msg.includes("audio")) violationCounts.noise++
        else if (msg.includes("fullscreen")) violationCounts.fullscreenExit++
      }
    }

    // ── Activity Heatmap ─────────────────────────────────────
    const activityMap = {}

    // From exam attempts
    for (const r of examResultDocs) {
      const d = new Date(r.createdAt).toISOString().split("T")[0]
      activityMap[d] = (activityMap[d] || 0) + 1
    }

    // From watch sessions
    for (const wr of watchRecords) {
      for (const s of wr.sessions || []) {
        if (s.startedAt) {
          const d = new Date(s.startedAt).toISOString().split("T")[0]
          activityMap[d] = (activityMap[d] || 0) + 1
        }
      }
    }

    // From doubt asks
    for (const dt of doubtTimestampDocs) {
      const d = new Date(dt.createdAt).toISOString().split("T")[0]
      activityMap[d] = (activityMap[d] || 0) + 1
    }

    const activityData = Object.entries(activityMap).map(([date, count]) => ({ date, count }))

    // ── Streak ───────────────────────────────────────────────
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split("T")[0]
      if (activityMap[dateStr]) streak++
      else if (i > 0) break
    }

    // ── Weekly activity ──────────────────────────────────────
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weeklyLectures = watchRecords.filter(
      (r) => r.lastWatchedAt && new Date(r.lastWatchedAt) >= weekAgo
    ).length

    // ── Time spent (real from watch + estimate) ──────────────
    const timeSpentMinutes = totalWatchMinutes > 0
      ? totalWatchMinutes
      : completedLectures * 10 // fallback estimate

    res.json({
      success: true,
      // Legacy shape for StudentProgressDashboard
      progress: {
        progressPercent,
        completedLectures,
        totalLectures,
        quizAttempts: examResults.length,
        avgQuizScore,
        recentQuizzes: examResults.slice(-5).map((r) => ({
          examTitle: r.exam?.title || "Exam",
          score: r.percentage,
          passed: r.passed,
        })),
      },
      // Full data for ProgressReport component
      courseProgress: { completedVideos },
      totalLectures,
      examResults,
      quizResults: [],
      streak,
      weeklyLectures,
      activityData,
      timeSpentMinutes,
      lastWatchedTitle,
      // New fields
      watchTime: {
        totalMinutes: timeSpentMinutes,
        lectureWatchTime,
      },
      doubtTimestamps,
      proctoringReport: {
        totalExams: examResults.length,
        totalPassed,
        totalCancelled,
        violationCounts,
        examViolations: allViolations,
      },
    })
  } catch (error) {
    console.log("getStudentProgress error:", error)
    res.status(500).json({ success: false, message: "Could not fetch progress" })
  }
}

exports.getCourseStudentsProgress = async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await Course.findById(courseId)
      .populate("studentsEnroled", "firstName lastName email image")
      .populate({ path: "courseContent", populate: { path: "subSection" } })

    const totalLectures = course?.courseContent?.reduce(
      (acc, sec) => acc + (sec.subSection?.length || 0), 0
    ) || 0

    const students = await Promise.all(
      (course.studentsEnroled || []).map(async (student) => {
        const progress = await CourseProgress.findOne({ courseID: courseId, userId: student._id })
        const completedLectures = progress?.completedVideos?.length || 0
        const progressPercent = totalLectures > 0
          ? Math.round((completedLectures / totalLectures) * 100) : 0

        const examResults = await ExamResult.find({ student: student._id, course: courseId })
          .populate("exam", "title")
          .sort({ createdAt: -1 })

        const avgExamScore = examResults.length > 0
          ? Math.round(examResults.reduce((acc, r) => acc + r.percentage, 0) / examResults.length)
          : null

        // Watch time
        const watchRecords = await WatchTime.find({ student: student._id, course: courseId })
        const totalWatchSeconds = watchRecords.reduce((sum, r) => sum + (r.totalWatchSeconds || 0), 0)

        // Violations summary
        const allViolations = examResults.flatMap((r) => r.violations || [])
        const cancelledExams = examResults.filter((r) => r.cancelled).length

        return {
          studentId: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          image: student.image,
          progressPercent,
          completedLectures,
          totalLectures,
          avgExamScore,
          totalWatchMinutes: Math.round(totalWatchSeconds / 60),
          totalViolations: allViolations.length,
          cancelledExams,
          examScores: examResults.map((r) => ({
            examTitle: r.exam?.title || "Exam",
            score: r.percentage,
            passed: r.passed,
            cancelled: r.cancelled || false,
            violations: r.violations || [],
            attemptedAt: r.createdAt,
          })),
        }
      })
    )

    res.json({ success: true, students })
  } catch (error) {
    console.log("getCourseStudentsProgress error:", error)
    res.status(500).json({ success: false, message: "Could not fetch students progress" })
  }
}

exports.generateProgressReport = async (req, res) => {
  try {
    const { courseId } = req.body
    const studentId = req.user.id

    const course = await Course.findById(courseId).populate({
      path: "courseContent",
      populate: { path: "subSection" },
    })
    const student = await User.findById(studentId).select("firstName lastName email")

    const totalLectures = course?.courseContent?.reduce(
      (acc, sec) => acc + (sec.subSection?.length || 0), 0
    ) || 0

    const progress = await CourseProgress.findOne({ courseID: courseId, userId: studentId })
    const completedLectures = progress?.completedVideos?.length || 0
    const progressPercent = totalLectures > 0
      ? Math.round((completedLectures / totalLectures) * 100) : 0

    const examResults = await ExamResult.find({ student: studentId, course: courseId })
      .populate("exam", "title")
    const avgExamScore = examResults.length > 0
      ? Math.round(examResults.reduce((acc, r) => acc + r.percentage, 0) / examResults.length)
      : null

    // Watch time
    const watchRecords = await WatchTime.find({ student: studentId, course: courseId })
    const totalWatchSeconds = watchRecords.reduce((sum, r) => sum + (r.totalWatchSeconds || 0), 0)
    const totalWatchMinutes = Math.round(totalWatchSeconds / 60)

    // Doubts
    const doubtCount = await DoubtTimestamp.countDocuments({ student: studentId, course: courseId })

    // Violations
    const allViolations = examResults.flatMap((r) => r.violations || [])
    const cancelledExams = examResults.filter((r) => r.cancelled).length

    const examSummary = examResults.map(
      (r) => `- ${r.exam?.title || "Exam"}: ${r.percentage}% (${r.passed ? "Pass" : r.cancelled ? "Cancelled" : "Fail"})${r.violations?.length > 0 ? ` [${r.violations.length} violations]` : ""}`
    ).join("\n") || "No exams attempted yet."

    const prompt = `Generate a detailed student progress report.

Student: ${student.firstName} ${student.lastName}
Course: ${course.courseName}
Progress: ${progressPercent}% (${completedLectures}/${totalLectures} lectures completed)
Total Watch Time: ${totalWatchMinutes} minutes
Doubts Asked: ${doubtCount}
Exams Attempted: ${examResults.length}
Average Score: ${avgExamScore !== null ? avgExamScore + "%" : "N/A"}
Cancelled Exams (due to violations): ${cancelledExams}
Total Proctoring Violations: ${allViolations.length}

Exam Details:
${examSummary}

Write a personalized, encouraging yet honest report with these sections:
## 📊 Progress Summary
## ✅ Strengths  
## ⚠️ Areas for Improvement
## 🔒 Academic Integrity Note (only if violations > 0, otherwise omit)
## 🎯 Recommendations
## 🔮 Predicted Outcome

Be concise, data-driven, and constructive.`

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 900,
    })

    res.json({
      success: true,
      report: completion.choices[0]?.message?.content || "Could not generate report",
    })
  } catch (error) {
    console.log("generateProgressReport error:", error)
    res.status(500).json({ success: false, message: "Could not generate report" })
  }
}

// Helper
function formatSeconds(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}
