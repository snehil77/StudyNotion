// ══════════════════════════════════════════════════════════
//  server/controllers/LiveClass.js
// ══════════════════════════════════════════════════════════
require("dotenv").config()
const LiveClassRoom = require("../models/LiveClassRoom")
const Course        = require("../models/Course")
const User          = require("../models/User")  
const generateZegoToken = require("../utils/generateZegoToken")

/**
 * POST /api/v1/liveclass/create
 */
exports.createRoom = async (req, res) => {
  try {
    const { courseId, title } = req.body
    const instructorId = req.user.id

    const course = await Course.findOne({ courseName: courseId })
    if (!course)
      return res.status(404).json({ success: false, message: "Course not found. Check course name." })

    if (course.instructor.toString() !== instructorId)
      return res.status(403).json({ success: false, message: "You are not the instructor of this course" })

    // End any existing active room for this course
    await LiveClassRoom.updateMany(
      { course: course._id, status: "active" },
      { status: "ended", endedAt: new Date() }
    )

    const roomId = `room-${course._id}-${Date.now()}`
    const room = await LiveClassRoom.create({
      roomId,
      course: course._id,
      instructor: instructorId,
      title: title || "Live Class",
      status: "active",
    })

    return res.status(201).json({ success: true, data: { roomId: room.roomId } })
  } catch (err) {
    console.error("createRoom error:", err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * POST /api/v1/liveclass/token
 */
exports.getZegoToken = async (req, res) => {
  try {
    const { roomId, userId, userName } = req.body

    console.log("getZegoToken called:", { roomId, userId, userName })
    console.log("ZEGO_APP_ID:", process.env.ZEGO_APP_ID)
    console.log("ZEGO_SERVER_SECRET length:", process.env.ZEGO_SERVER_SECRET?.length)

    if (!process.env.ZEGO_APP_ID || !process.env.ZEGO_SERVER_SECRET) {
      return res.status(500).json({ success: false, message: "Zego credentials not configured in .env" })
    }

    // Verify room exists
    const room = await LiveClassRoom.findOne({ roomId, status: "active" })
    if (!room)
      return res.status(404).json({ success: false, message: "Live class not found or has ended" })

    const appID = Number(process.env.ZEGO_APP_ID)

    const kitToken = generateZegoToken({
      appID,
      serverSecret: process.env.ZEGO_SERVER_SECRET,
      roomID: roomId,
      userID: String(userId),
      userName: String(userName),
    })

    console.log("Token generated successfully, length:", kitToken.length)

 return res.status(200).json({ 
  success: true, 
  data: { 
    kitToken,      // existing
    appID,         // existing  
    serverSecret: process.env.ZEGO_SERVER_SECRET  // ← YEH ADD KARO
  } 
})
  } catch (err) {
    console.error("getZegoToken error:", err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * POST /api/v1/liveclass/end
 */
exports.endRoom = async (req, res) => {
  try {
    const { roomId } = req.body
    const instructorId = req.user.id

    const room = await LiveClassRoom.findOne({ roomId })
    if (!room)
      return res.status(404).json({ success: false, message: "Room not found" })
    if (room.instructor.toString() !== instructorId)
      return res.status(403).json({ success: false, message: "Unauthorized" })

    room.status  = "ended"
    room.endedAt = new Date()
    await room.save()

    return res.status(200).json({ success: true, message: "Live class ended" })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/v1/liveclass/rooms?courseId=xxx
 */
exports.getActiveRooms = async (req, res) => {
  try {
    const { courseId } = req.query
    
    if (!courseId) {
      return res.status(200).json({ success: true, data: [] })
    }

    const rooms = await LiveClassRoom.find({ course: courseId, status: "active" }).lean()

    // Manual instructor lookup instead of populate
    const data = await Promise.all(rooms.map(async (r) => {
      const instructor = await User.findById(r.instructor).select("firstName lastName image").lean()
      return {
        roomId:          r.roomId,
        title:           r.title,
        instructorName:  instructor ? `${instructor.firstName} ${instructor.lastName}` : "Instructor",
        instructorImage: instructor?.image,
        startedAt:       r.createdAt,
      }
    }))

    return res.status(200).json({ success: true, data })
  } catch (err) {
    console.error("getActiveRooms error:", err)
    return res.status(500).json({ success: false, message: err.message })
  }
}