const express = require("express")
const router = express.Router()
const { auth, isInstructor } = require("../middleware/auth")
const {
  createRoom,
  endRoom,
  getZegoToken,
  getActiveRooms,
} = require("../controllers/liveClass")

router.post("/create", auth, isInstructor, createRoom)
router.post("/end", auth, isInstructor, endRoom)
router.post("/token", auth, getZegoToken)
router.get("/rooms", auth, getActiveRooms)

module.exports = router