const mongoose = require("mongoose")

const watchTimeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    subSection: { type: mongoose.Schema.Types.ObjectId, ref: "SubSection", required: true },
    sessions: [
      {
        startedAt: { type: Date },
        endedAt: { type: Date },
        durationSeconds: { type: Number, default: 0 },
        videoTimestampStart: { type: Number, default: 0 }, // where in video they started (secs)
        videoTimestampEnd: { type: Number, default: 0 },   // where they stopped
      },
    ],
    totalWatchSeconds: { type: Number, default: 0 },
    lastWatchedAt: { type: Date },
    lastVideoTimestamp: { type: Number, default: 0 }, // resume from here
  },
  { timestamps: true }
)

module.exports = mongoose.model("WatchTime", watchTimeSchema)
