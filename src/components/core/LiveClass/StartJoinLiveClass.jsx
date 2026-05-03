// ══════════════════════════════════════════════════════════
//  src/components/core/LiveClass/StartLiveClass.jsx
//  Used inside Instructor Dashboard → Course section
// ══════════════════════════════════════════════════════════
import { useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { MdVideoCall } from "react-icons/md"
import { liveClassService } from "../../../services/liveClassService"

export default function StartLiveClass({ courseId, courseName }) {
  const { token } = useSelector((s) => s.auth)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [showModal, setShowModal] = useState(false)

  const handleStart = async () => {
    if (loading) return
    setLoading(true)
    try {
      const { roomId } = await liveClassService.createRoom({
        courseId,
        title: title || `${courseName} - Live Class`,
        token,
      })
      // Navigate to the room
      navigate(`/live/${roomId}`)
    } catch (err) {
      // Error handled in service
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-2 text-sm font-semibold text-richblack-900 transition-all hover:bg-yellow-25 hover:scale-105"
      >
        <MdVideoCall size={20} />
        Start Live Class
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="w-full max-w-md rounded-2xl bg-richblack-800 p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-bold text-richblack-5">Start a Live Class</h2>
            <p className="mb-5 text-sm text-richblack-400">
              Students enrolled in <strong className="text-richblack-100">{courseName}</strong> will be able to join.
            </p>

            <label className="mb-1 block text-xs font-semibold text-richblack-300">
              Session Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${courseName} - Live Class`}
              className="mb-5 w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none focus:border-yellow-50"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-richblack-600 py-2 text-sm text-richblack-300 hover:bg-richblack-700"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={loading}
                className="flex-1 rounded-lg bg-yellow-50 py-2 text-sm font-semibold text-richblack-900 hover:bg-yellow-25 disabled:opacity-50"
              >
                {loading ? "Starting..." : "🎥 Go Live"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


// ══════════════════════════════════════════════════════════
//  src/components/core/LiveClass/JoinLiveClass.jsx
//  Shown to students on their course page when a class is live
// ══════════════════════════════════════════════════════════
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { MdLiveTv, MdPeople } from "react-icons/md"
import { liveClassService } from "../../../services/liveClassService"

export function JoinLiveClass({ courseId }) {
  const { token } = useSelector((s) => s.auth)
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const poll = async () => {
      const data = await liveClassService.getActiveRooms({ courseId, token })
      setRooms(data)
      setLoading(false)
    }
    poll()
    // Poll every 20 seconds to detect new live classes
    const interval = setInterval(poll, 20000)
    return () => clearInterval(interval)
  }, [courseId, token])

  if (loading || rooms.length === 0) return null

  return (
    <div className="space-y-3">
      {rooms.map((room) => (
        <div
          key={room.roomId}
          className="flex items-center justify-between rounded-xl border border-caribbeangreen-600 border-opacity-40 bg-caribbeangreen-900 bg-opacity-30 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            {/* Live badge */}
            <span className="flex items-center gap-1 rounded-full bg-pink-200 px-2 py-0.5 text-xs font-bold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </span>
            <div>
              <p className="text-sm font-semibold text-richblack-5">{room.title}</p>
              <p className="text-xs text-richblack-400">
                by {room.instructorName}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/live/${room.roomId}`)}
            className="flex items-center gap-2 rounded-lg bg-caribbeangreen-100 px-3 py-1.5 text-sm font-semibold text-richblack-900 hover:bg-caribbeangreen-50 transition-all"
          >
            <MdLiveTv size={16} />
            Join
          </button>
        </div>
      ))}
    </div>
  )
}
