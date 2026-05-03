import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { apiConnector } from "../../../services/apiConnector"
import { FEATURE_ENDPOINTS } from "../../../services/apis"
import { VscChevronDown, VscChevronUp } from "react-icons/vsc"
import { FiSend, FiPlus } from "react-icons/fi"

export default function StudentDoubtsPanel() {
  const { token } = useSelector((s) => s.auth)
  const { user } = useSelector((s) => s.profile)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [doubts, setDoubts] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [replyText, setReplyText] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [newDoubt, setNewDoubt] = useState({ title: "", message: "" })
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    // Get enrolled courses from profile
    if (user?.courses) {
      setEnrolledCourses(user.courses)
      if (user.courses.length > 0) setSelectedCourse(user.courses[0]._id || user.courses[0])
    }
  }, [user])

  useEffect(() => {
    if (selectedCourse) fetchDoubts()
  }, [selectedCourse])

  const fetchDoubts = async () => {
    setLoading(true)
    try {
      const res = await apiConnector(
        "GET",
        `${FEATURE_ENDPOINTS.GET_COURSE_DOUBTS}/${selectedCourse}`,
        null,
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) setDoubts(res.data.doubts)
    } catch (e) { console.log(e) }
    setLoading(false)
  }

  const handlePostDoubt = async () => {
    if (!newDoubt.title.trim() || !newDoubt.message.trim()) return alert("Fill all fields")
    setPosting(true)
    try {
      const res = await apiConnector("POST", FEATURE_ENDPOINTS.CREATE_DOUBT, {
        courseId: selectedCourse,
        ...newDoubt,
      }, { Authorization: `Bearer ${token}` })
      if (res?.data?.success) {
        setDoubts((prev) => [res.data.doubt, ...prev])
        setNewDoubt({ title: "", message: "" })
        setShowForm(false)
      }
    } catch (e) { console.log(e) }
    setPosting(false)
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-richblack-5">💬 My Doubts</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-2 text-sm font-semibold text-richblack-900 hover:bg-yellow-25 transition-all"
        >
          <FiPlus size={15} /> Ask a Doubt
        </button>
      </div>

      {/* Course selector */}
      <div>
        <label className="text-sm text-richblack-300">Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="mt-1 w-full rounded-lg bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none border border-richblack-600"
        >
          {enrolledCourses.map((c) => (
            <option key={c._id || c} value={c._id || c}>{c.courseName || c}</option>
          ))}
        </select>
      </div>

      {/* New doubt form */}
      {showForm && (
        <div className="rounded-xl border border-yellow-200 bg-richblack-800 p-5 space-y-3">
          <p className="text-sm font-semibold text-richblack-5">New Doubt</p>
          <input
            value={newDoubt.title}
            onChange={(e) => setNewDoubt({ ...newDoubt, title: e.target.value })}
            placeholder="Doubt title (e.g. Confusion about useState hook)"
            className="w-full rounded-lg bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none border border-richblack-600 placeholder:text-richblack-400"
          />
          <textarea
            value={newDoubt.message}
            onChange={(e) => setNewDoubt({ ...newDoubt, message: e.target.value })}
            placeholder="Describe your doubt in detail..."
            rows={3}
            className="w-full resize-none rounded-lg bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none border border-richblack-600 placeholder:text-richblack-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handlePostDoubt}
              disabled={posting}
              className="rounded-lg bg-yellow-50 px-5 py-2 text-sm font-semibold text-richblack-900 hover:bg-yellow-25 disabled:opacity-50 transition-all"
            >
              {posting ? "Posting..." : "Submit Doubt"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg bg-richblack-700 px-4 py-2 text-sm text-richblack-300 hover:bg-richblack-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Doubts list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-yellow-50 border-t-transparent" />
        </div>
      ) : doubts.length === 0 ? (
        <div className="rounded-xl bg-richblack-800 p-10 text-center text-richblack-400">
          No doubts yet — click "Ask a Doubt" to post your first one!
        </div>
      ) : (
        <div className="space-y-3">
          {doubts.map((doubt) => (
            <div key={doubt._id} className={`rounded-xl border ${doubt.isResolved ? "border-green-700" : "border-richblack-600"} bg-richblack-800`}>
              <div
                className="flex cursor-pointer items-center justify-between p-4"
                onClick={() => setExpanded(expanded === doubt._id ? null : doubt._id)}
              >
                <div>
                  <p className="text-sm font-semibold text-richblack-5">{doubt.title}</p>
                  <p className="text-xs text-richblack-400 mt-0.5">
                    {new Date(doubt.createdAt).toLocaleDateString()} • {doubt.replies?.length || 0} replies
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {doubt.isResolved && (
                    <span className="rounded-full bg-green-700 px-2 py-0.5 text-xs text-green-100">Resolved</span>
                  )}
                  {expanded === doubt._id ? <VscChevronUp className="text-richblack-400" /> : <VscChevronDown className="text-richblack-400" />}
                </div>
              </div>

              {expanded === doubt._id && (
                <div className="border-t border-richblack-700 px-4 pb-4 pt-3 space-y-4">
                  <div className="rounded-lg bg-richblack-700 p-3">
                    <p className="text-sm text-richblack-100">{doubt.message}</p>
                  </div>

                  {doubt.replies?.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-richblack-700">
                      {doubt.replies.map((reply, i) => (
                        <div key={i} className="flex gap-2">
                          <img
                            src={reply.author?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${reply.author?.firstName}`}
                            alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                          />
                          <div>
                            <p className="text-xs font-semibold text-yellow-50">
                              {reply.author?.firstName} {reply.author?.lastName}
                            </p>
                            <p className="text-sm text-richblack-200 mt-0.5">{reply.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!doubt.isResolved && (
                    <div className="flex gap-2">
                      <input
                        value={replyText[doubt._id] || ""}
                        onChange={(e) => setReplyText((p) => ({ ...p, [doubt._id]: e.target.value }))}
                        placeholder="Add a follow-up..."
                        className="flex-1 rounded-lg bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none placeholder:text-richblack-400"
                      />
                      <button
                        onClick={() => handleReply(doubt._id)}
                        className="rounded-lg bg-yellow-50 p-2.5 text-richblack-900 hover:bg-yellow-25 transition-all"
                      >
                        <FiSend size={15} />
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
