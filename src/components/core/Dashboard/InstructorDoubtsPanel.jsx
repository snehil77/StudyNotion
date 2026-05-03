import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { apiConnector } from "../../../services/apiConnector"
import { FEATURE_ENDPOINTS } from "../../../services/apis"
import { VscChevronDown, VscChevronUp, VscCheck } from "react-icons/vsc"
import { FiSend } from "react-icons/fi"

export default function InstructorDoubtsPanel() {
  const { token } = useSelector((s) => s.auth)
  const { user } = useSelector((s) => s.profile)
  const [doubts, setDoubts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [replyText, setReplyText] = useState({})
  const [filter, setFilter] = useState("all") // all | unresolved | resolved

  useEffect(() => {
    fetchDoubts()
  }, [])

  const fetchDoubts = async () => {
    setLoading(true)
    try {
      const res = await apiConnector("GET", FEATURE_ENDPOINTS.GET_INSTRUCTOR_DOUBTS, null, {
        Authorization: `Bearer ${token}`,
      })
      if (res?.data?.success) setDoubts(res.data.doubts)
    } catch (e) { console.log(e) }
    setLoading(false)
  }

  const handleReply = async (doubtId) => {
    const msg = replyText[doubtId]?.trim()
    if (!msg) return
    try {
      const res = await apiConnector("POST", FEATURE_ENDPOINTS.REPLY_DOUBT, { doubtId, message: msg }, {
        Authorization: `Bearer ${token}`,
      })
      if (res?.data?.success) {
        setDoubts((prev) => prev.map((d) => d._id === doubtId ? res.data.doubt : d))
        setReplyText((prev) => ({ ...prev, [doubtId]: "" }))
      }
    } catch (e) { console.log(e) }
  }

  const handleResolve = async (doubtId) => {
    try {
      const res = await apiConnector("POST", FEATURE_ENDPOINTS.RESOLVE_DOUBT, { doubtId }, {
        Authorization: `Bearer ${token}`,
      })
      if (res?.data?.success) setDoubts((prev) => prev.map((d) => d._id === doubtId ? res.data.doubt : d))
    } catch (e) { console.log(e) }
  }

  const filtered = doubts.filter((d) => {
    if (filter === "unresolved") return !d.isResolved
    if (filter === "resolved") return d.isResolved
    return true
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-richblack-5">💬 Student Doubts</h2>
        <div className="flex gap-2">
          {["all", "unresolved", "resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1 text-xs font-semibold capitalize transition-all ${
                filter === f ? "bg-yellow-50 text-richblack-900" : "bg-richblack-700 text-richblack-300 hover:bg-richblack-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-50 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-richblack-800 p-12 text-center text-richblack-400">
          No doubts found
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doubt) => (
            <div key={doubt._id} className={`rounded-xl border ${doubt.isResolved ? "border-green-700 bg-richblack-800" : "border-richblack-600 bg-richblack-800"}`}>
              {/* Header */}
              <div
                className="flex cursor-pointer items-center justify-between p-4"
                onClick={() => setExpanded(expanded === doubt._id ? null : doubt._id)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={doubt.student?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${doubt.student?.firstName}`}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-richblack-5">{doubt.title}</p>
                    <p className="text-xs text-richblack-400">
                      {doubt.student?.firstName} {doubt.student?.lastName} •{" "}
                      {doubt.course?.courseName} •{" "}
                      {new Date(doubt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {doubt.isResolved && (
                    <span className="rounded-full bg-green-700 px-2 py-0.5 text-xs text-green-100">Resolved</span>
                  )}
                  <span className="text-xs text-richblack-400">{doubt.replies?.length || 0} replies</span>
                  {expanded === doubt._id ? <VscChevronUp className="text-richblack-400" /> : <VscChevronDown className="text-richblack-400" />}
                </div>
              </div>

              {/* Expanded */}
              {expanded === doubt._id && (
                <div className="border-t border-richblack-700 px-4 pb-4 pt-3 space-y-4">
                  {/* Original message */}
                  <div className="rounded-lg bg-richblack-700 p-3">
                    <p className="text-sm text-richblack-100">{doubt.message}</p>
                  </div>

                  {/* Replies */}
                  {doubt.replies?.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-richblack-700">
                      {doubt.replies.map((reply, i) => (
                        <div key={i} className="flex gap-2">
                          <img
                            src={reply.author?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${reply.author?.firstName}`}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                          />
                          <div>
                            <p className="text-xs font-semibold text-yellow-50">
                              {reply.author?.firstName} {reply.author?.lastName}
                              {reply.author?._id === user?._id && " (You)"}
                            </p>
                            <p className="text-sm text-richblack-200 mt-0.5">{reply.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  {!doubt.isResolved && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <textarea
                          value={replyText[doubt._id] || ""}
                          onChange={(e) => setReplyText((p) => ({ ...p, [doubt._id]: e.target.value }))}
                          placeholder="Write your reply..."
                          rows={2}
                          className="flex-1 resize-none rounded-lg bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none placeholder:text-richblack-400"
                        />
                        <button
                          onClick={() => handleReply(doubt._id)}
                          className="self-end rounded-lg bg-yellow-50 p-2.5 text-richblack-900 hover:bg-yellow-25 transition-all"
                        >
                          <FiSend size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleResolve(doubt._id)}
                        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-all"
                      >
                        <VscCheck size={14} /> Mark as Resolved
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
