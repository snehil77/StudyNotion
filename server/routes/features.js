const express = require("express")
const router = express.Router()
const { auth, isInstructor } = require("../middleware/auth")

const { createDoubt, getCourseDoubts, replyToDoubt, resolveDoubt, getInstructorDoubts } = require("../controllers/Doubt")
const { createAnnouncement, getCourseAnnouncements, deleteAnnouncement } = require("../controllers/Announcement")
const { createExam, getCourseExams, submitExam, getExamForInstructor } = require("../controllers/Exam")
const { getStudentProgress, getCourseStudentsProgress, generateProgressReport } = require("../controllers/Progress")
const { startWatchSession, endWatchSession, saveDoubtTimestamp, getCourseWatchTime } = require("../controllers/WatchTime")
const { getDiscussions, createDiscussion, replyDiscussion, toggleLike, deleteDiscussion } = require("../controllers/Discussion")

// ── DOUBT ROUTES ──────────────────────────────────────────────
router.post("/doubt/create", auth, createDoubt)
router.get("/doubt/course/:courseId", auth, getCourseDoubts)
router.post("/doubt/reply", auth, replyToDoubt)
router.post("/doubt/resolve", auth, resolveDoubt)
router.get("/doubt/instructor", auth, isInstructor, getInstructorDoubts)

// ── ANNOUNCEMENT ROUTES ───────────────────────────────────────
router.post("/announcement/create", auth, isInstructor, createAnnouncement)
router.get("/announcement/course/:courseId", auth, getCourseAnnouncements)
router.delete("/announcement/delete", auth, isInstructor, deleteAnnouncement)

// ── EXAM ROUTES ───────────────────────────────────────────────
router.post("/exam/create", auth, isInstructor, createExam)
router.get("/exam/course/:courseId", auth, getCourseExams)
router.post("/exam/submit", auth, submitExam)
router.get("/exam/instructor/:examId", auth, isInstructor, getExamForInstructor)

// ── PROGRESS ROUTES ───────────────────────────────────────────
router.get("/progress/student/:courseId", auth, getStudentProgress)
router.get("/progress/course/:courseId", auth, isInstructor, getCourseStudentsProgress)
router.post("/progress/report", auth, generateProgressReport)

// ── WATCH TIME ROUTES ─────────────────────────────────────────
router.post("/watchtime/start", auth, startWatchSession)
router.post("/watchtime/end", auth, endWatchSession)
router.post("/watchtime/doubt", auth, saveDoubtTimestamp)
router.get("/watchtime/course/:courseId", auth, getCourseWatchTime)

// ── DISCUSSION ROUTES ─────────────────────────────────────────
router.get("/discussion/:courseId/:subSectionId", auth, getDiscussions)
router.post("/discussion/create", auth, createDiscussion)
router.post("/discussion/reply", auth, replyDiscussion)
router.post("/discussion/like", auth, toggleLike)
router.delete("/discussion/:discussionId", auth, deleteDiscussion)

module.exports = router
