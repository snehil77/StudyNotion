import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { apiConnector } from "../../../services/apiConnector"
import { FEATURE_ENDPOINTS, courseEndpoints } from "../../../services/apis"
import { fetchInstructorCourses } from "../../../services/operations/courseDetailsAPI"
import { VscTrash, VscBell } from "react-icons/vsc"

export default function InstructorAnnouncementsPanel() {
  const { token } = useSelector((s) => s.auth)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [announcements, setAnnouncements] = useState([])
  const [form, setForm] = useState({ title: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    ;(async () => {
      const result = await fetchInstructorCourses(token)
      if (result) {
        setCourses(result)
        if (result.length > 0) setSelectedCourse(result[0]._id)
      }
    })()
  }, [])

  useEffect(() => {
    if (selectedCourse) fetchAnnouncements()
  }, [selectedCourse])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await apiConnector(
        "GET",
        `${FEATURE_ENDPOINTS.GET_COURSE_ANNOUNCEMENTS}/${selectedCourse}`,
        null,
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) setAnnouncements(res.data.announcements)
    } catch (e) { console.log(e) }
    setLoading(false)
  }

  const handlePost = async () => {
    if (!form.title.trim() || !form.message.trim()) return alert("Fill all fields")
    setPosting(true)
    try {
      const res = await apiConnector("POST", FEATURE_ENDPOINTS.CREATE_ANNOUNCEMENT, {
        courseId: selectedCourse,
        ...form,
      }, { Authorization: `Bearer ${token}` })
      if (res?.data?.success) {
        setAnnouncements((prev) => [res.data.announcement, ...prev])
        setForm({ title: "", message: "" })
      }
    } catch (e) { console.log(e) }
    setPosting(false)
  }

  const handleDelete = async (id) => {
    try {
      await apiConnector("DELETE", FEATURE_ENDPOINTS.DELETE_ANNOUNCEMENT, { announcementId: id }, {
        Authorization: `Bearer ${token}`,
      })
      setAnnouncements((prev) => prev.filter((a) => a._id !== id))
    } catch (e) { console.log(e) }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-richblack-5">📢 Announcements</h2>

      {/* Course selector */}
      <div>
        <label className="text-sm text-richblack-300">Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="mt-1 w-full rounded-lg bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none border border-richblack-600"
        >
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.courseName}</option>
          ))}
        </select>
      </div>

      {/* Create form */}
      <div className="rounded-xl border border-richblack-600 bg-richblack-800 p-5 space-y-3">
        <p className="text-sm font-semibold text-richblack-5">Post New Announcement</p>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Announcement title..."
          className="w-full rounded-lg bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none border border-richblack-600 placeholder:text-richblack-400"
        />
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Write your announcement here..."
          rows={4}
          className="w-full resize-none rounded-lg bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none border border-richblack-600 placeholder:text-richblack-400"
        />
        <button
          onClick={handlePost}
          disabled={posting}
          className="flex items-center gap-2 rounded-lg bg-yellow-50 px-5 py-2 text-sm font-semibold text-richblack-900 hover:bg-yellow-25 disabled:opacity-50 transition-all"
        >
          <VscBell size={16} />
          {posting ? "Posting..." : "Post Announcement"}
        </button>
      </div>

      {/* Announcements list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-yellow-50 border-t-transparent" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-xl bg-richblack-800 p-10 text-center text-richblack-400">
            No announcements yet for this course
          </div>
        ) : (
          announcements.map((a) => (
            <div key={a._id} className="rounded-xl border border-richblack-600 bg-richblack-800 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-richblack-5">{a.title}</p>
                  <p className="text-xs text-richblack-400 mt-0.5">
                    {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a._id)}
                  className="text-pink-400 hover:text-pink-300 transition-all p-1"
                >
                  <VscTrash size={16} />
                </button>
              </div>
              <p className="mt-2 text-sm text-richblack-200 leading-relaxed">{a.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
