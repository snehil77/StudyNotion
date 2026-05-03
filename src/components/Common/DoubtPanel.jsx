import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { apiConnector } from "../../services/apiConnector"
import { FEATURE_ENDPOINTS } from "../../services/apis"
import { FiMessageCircle, FiX, FiSend, FiCheckCircle } from "react-icons/fi"

export default function DoubtPanel({ courseId }) {
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)
  const isInstructor = user?.accountType === "Instructor"

  const [doubts, setDoubts] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newDoubt, setNewDoubt] = useState({ title: "", message: "" })
  const [replyText, setReplyText] = useState({})

  useEffect(() => {
    if (isOpen) fetchDoubts()
  }, [isOpen])

  const fetchDoubts = async () => {
    setLoading(true)
    try {
      const res = await apiConnector(
        "GET",
        `${FEATURE_ENDPOINTS.GET_COURSE_DOUBTS}/${courseId}`,
        null,
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) setDoubts(res.data.doubts)
    } catch (e) {
      console.log("fetchDoubts error", e)
    }
    setLoading(false)
  }

  const handleCreateDoubt = async () => {
    if (!newDoubt.title.trim() || !newDoubt.message.trim()) return
    try {
      const res = await apiConnector(
        "POST",
        FEATURE_ENDPOINTS.CREATE_DOUBT,
        { courseId, ...newDoubt },
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) {
        setDoubts([res.data.doubt, ...doubts])
        setNewDoubt({ title: "", message: "" })
      }
    } catch (e) {
      console.log(e)
    }
  }

  const handleReply = async (doubtId) => {
    if (!replyText[doubtId]?.trim()) return
    try {
      const res = await apiConnector(
        "POST",
        FEATURE_ENDPOINTS.REPLY_DOUBT,
        { doubtId, message: replyText[doubtId] },
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) {
        setDoubts(doubts.map((d) => (d._id === doubtId ? res.data.doubt : d)))
        setReplyText({ ...replyText, [doubtId]: "" })
      }
    } catch (e) {
      console.log(e)
    }
  }

  const handleResolve = async (doubtId) => {
    try {
      await apiConnector(
        "POST",
        FEATURE_ENDPOINTS.RESOLVE_DOUBT,
        { doubtId },
        { Authorization: `Bearer ${token}` }
      )
      setDoubts(doubts.map((d) => (d._id === doubtId ? { ...d, isResolved: true } : d)))
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md bg-richblack-700 px-4 py-2 text-sm font-semibold text-richblack-5 hover:bg-richblack-600 transition-all"
      >
        <FiMessageCircle size={16} />
        Doubts {doubts.length > 0 && `(${doubts.length})`}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex bg-richblack-900 bg-opacity-75 backdrop-blur-sm">
          <div className="ml-auto w-full max-w-[480px] h-full bg-richblack-800 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between bg-richblack-700 p-4">
              <p className="font-semibold text-richblack-5">💬 Course Doubts</p>
              <button onClick={() => setIsOpen(false)}>
                <FiX className="text-xl text-richblack-5" />
              </button>
            </div>

            {/* Ask doubt form (students only) */}
            {!isInstructor && (
              <div className="p-4 border-b border-richblack-700">
                <p className="text-sm font-medium text-richblack-200 mb-2">Ask a Doubt</p>
                <input
                  value={newDoubt.title}
                  onChange={(e) => setNewDoubt({ ...newDoubt, title: e.target.value })}
                  placeholder="Doubt title..."
                  className="w-full bg-richblack-700 text-richblack-5 text-sm rounded-md px-3 py-2 mb-2 outline-none"
                />
                <textarea
                  value={newDoubt.message}
                  onChange={(e) => setNewDoubt({ ...newDoubt, message: e.target.value })}
                  placeholder="Describe your doubt..."
                  rows={2}
                  className="w-full bg-richblack-700 text-richblack-5 text-sm rounded-md px-3 py-2 mb-2 outline-none resize-none"
                />
                <button
                  onClick={handleCreateDoubt}
                  className="bg-yellow-50 text-richblack-900 text-sm font-semibold px-4 py-2 rounded-md hover:bg-yellow-25 transition-all"
                >
                  Submit Doubt
                </button>
              </div>
            )}

            {/* Doubts list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-yellow-50 border-t-transparent" />
                </div>
              ) : doubts.length === 0 ? (
                <p className="text-richblack-400 text-sm text-center py-8">No doubts yet.</p>
              ) : (
                doubts.map((doubt) => (
                  <div
                    key={doubt._id}
                    className={`rounded-lg border p-3 ${
                      doubt.isResolved
                        ? "border-green-500/30 bg-green-900/10"
                        : "border-richblack-600 bg-richblack-700"
                    }`}
                  >
                    {/* Doubt header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            doubt.student?.image ||
                            `https://api.dicebear.com/5.x/initials/svg?seed=${doubt.student?.firstName}`
                          }
                          alt=""
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs text-richblack-300">
                            {doubt.student?.firstName} {doubt.student?.lastName}
                          </p>
                          <p className="text-sm font-semibold text-richblack-5">{doubt.title}</p>
                        </div>
                      </div>
                      {doubt.isResolved && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <FiCheckCircle size={12} /> Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-richblack-200 mt-2 mb-2">{doubt.message}</p>

                    {/* Replies */}
                    {doubt.replies?.length > 0 && (
                      <div className="space-y-2 mb-3 ml-4 border-l border-richblack-600 pl-3">
                        {doubt.replies.map((reply, i) => (
                          <div key={i}>
                            <p className="text-xs text-richblack-400">
                              {reply.author?.firstName} {reply.author?.lastName}
                            </p>
                            <p className="text-sm text-richblack-200">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply input */}
                    {!doubt.isResolved && (
                      <div className="flex gap-2 mt-2">
                        <input
                          value={replyText[doubt._id] || ""}
                          onChange={(e) =>
                            setReplyText({ ...replyText, [doubt._id]: e.target.value })
                          }
                          placeholder="Reply..."
                          onKeyDown={(e) => e.key === "Enter" && handleReply(doubt._id)}
                          className="flex-1 bg-richblack-600 text-richblack-5 text-xs rounded px-2 py-1 outline-none"
                        />
                        <button onClick={() => handleReply(doubt._id)} className="text-yellow-50">
                          <FiSend size={14} />
                        </button>
                        {isInstructor && (
                          <button
                            onClick={() => handleResolve(doubt._id)}
                            className="text-xs text-green-400 hover:text-green-300"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
