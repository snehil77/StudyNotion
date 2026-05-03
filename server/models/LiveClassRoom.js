// ══════════════════════════════════════════════════════════
//  server/models/LiveClassRoom.js
// ══════════════════════════════════════════════════════════
const mongoose = require("mongoose")

const liveClassRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },
    course: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Course",
      required: true,
    },
    instructor: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    title: {
      type:    String,
      default: "Live Class",
    },
    status: {
      type:    String,
      enum:    ["active", "ended"],
      default: "active",
    },
    endedAt: {
      type: Date,
    },
    recordingUrl: {
      type: String, // ZegoCloud cloud recording URL (populated after class ends)
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("LiveClassRoom", liveClassRoomSchema)
