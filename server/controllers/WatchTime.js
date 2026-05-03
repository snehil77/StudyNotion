const WatchTime = require("../models/WatchTime")
const DoubtTimestamp = require("../models/DoubtTimestamp")

// Called when student starts watching a video
exports.startWatchSession = async (req, res) => {
  try {
    const { courseId, subSectionId, videoTimestamp = 0 } = req.body
    const studentId = req.user.id

    // Find or create watch record
    let record = await WatchTime.findOne({
      student: studentId,
      course: courseId,
      subSection: subSectionId,
    })

    if (!record) {
      record = new WatchTime({
        student: studentId,
        course: courseId,
        subSection: subSectionId,
      })
    }

    // Add new session
    record.sessions.push({
      startedAt: new Date(),
      videoTimestampStart: videoTimestamp,
      durationSeconds: 0,
    })

    record.lastWatchedAt = new Date()
    await record.save()

    res.json({ success: true, sessionIndex: record.sessions.length - 1 })
  } catch (error) {
    console.log("startWatchSession error:", error)
    res.status(500).json({ success: false, message: "Could not start session" })
  }
}

// Called when student pauses/leaves video
exports.endWatchSession = async (req, res) => {
  try {
    const { courseId, subSectionId, durationSeconds, videoTimestampEnd } = req.body
    const studentId = req.user.id

    const record = await WatchTime.findOne({
      student: studentId,
      course: courseId,
      subSection: subSectionId,
    })

    if (!record || record.sessions.length === 0) {
      return res.json({ success: false, message: "No active session" })
    }

    // Update last session
    const lastSession = record.sessions[record.sessions.length - 1]
    lastSession.endedAt = new Date()
    lastSession.durationSeconds = durationSeconds || 0
    lastSession.videoTimestampEnd = videoTimestampEnd || 0

    // Update totals
    record.totalWatchSeconds = (record.totalWatchSeconds || 0) + (durationSeconds || 0)
    record.lastVideoTimestamp = videoTimestampEnd || 0
    record.lastWatchedAt = new Date()

    await record.save()
    res.json({ success: true })
  } catch (error) {
    console.log("endWatchSession error:", error)
    res.status(500).json({ success: false, message: "Could not end session" })
  }
}

// Save doubt with video timestamp
exports.saveDoubtTimestamp = async (req, res) => {
  try {
    const { courseId, subSectionId, videoTimestamp, question, answer } = req.body
    const studentId = req.user.id

    const record = await DoubtTimestamp.create({
      student: studentId,
      course: courseId,
      subSection: subSectionId,
      videoTimestamp: videoTimestamp || 0,
      question,
      answer: answer || "",
    })

    res.json({ success: true, record })
  } catch (error) {
    console.log("saveDoubtTimestamp error:", error)
    res.status(500).json({ success: false, message: "Could not save doubt timestamp" })
  }
}

// Get watch time data for a student in a course
exports.getCourseWatchTime = async (req, res) => {
  try {
    const { courseId } = req.params
    const studentId = req.user.id

    const records = await WatchTime.find({ student: studentId, course: courseId })
      .populate("subSection", "title")

    const doubtTimestamps = await DoubtTimestamp.find({ student: studentId, course: courseId })
      .populate("subSection", "title")

    const totalWatchSeconds = records.reduce((sum, r) => sum + (r.totalWatchSeconds || 0), 0)

    res.json({
      success: true,
      watchRecords: records,
      doubtTimestamps,
      totalWatchSeconds,
      totalWatchMinutes: Math.round(totalWatchSeconds / 60),
    })
  } catch (error) {
    console.log("getCourseWatchTime error:", error)
    res.status(500).json({ success: false, message: "Could not fetch watch time" })
  }
}
