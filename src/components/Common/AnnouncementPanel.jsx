import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { apiConnector } from "../../services/apiConnector"
import { FEATURE_ENDPOINTS } from "../../services/apis"
import { FiBell, FiX, FiTrash2 } from "react-icons/fi"

export default function AnnouncementPanel({ courseId }) {
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)
  const isInstructor = user?.accountType === "Instructor"

  const [announcements, setAnnouncements] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: "", message: "" })

  useEffect(() => {
    if (isOpen) fetchAnnouncements()
  }, [isOpen])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
    const res = await apiConnector("GET", `${FEATURE_ENDPOINTS.GET_COURSE_ANNOUNCEMENTS}/${courseId}`, null, {
        Authorization: `Bearer ${token}`,
      })
      if (res?.data?.success) setAnnouncements(res.data.announcements)
    } catch (e) {
      console.log(e)
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.title.trim() || !form.message.trim()) return
    try {
      const res = await apiConnector("POST", FEATURE_ENDPOINTS.CREATE_ANNOUNCEMENT, {
        courseId, ...form,
      }, { Authorization: `Bearer ${token}` })
      if (res?.data?.success) {
        setAnnouncements([res.data.announcement, ...announcements])
        setForm({ title: "", message: "" })
      }
    } catch (e) {
      console.log(e)
    }
  }

  const handleDelete = async (announcementId) => {
    try {
      await apiConnector("DELETE", FEATURE_ENDPOINTS.DELETE_ANNOUNCEMENT, { announcementId }, {
        Authorization: `Bearer ${token}`,
      })
      setAnnouncements(announcements.filter((a) => a._id !== announcementId))
    } catch (e) {
      console.log(e)
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md bg-richblack-700 px-4 py-2 text-sm font-semibold text-richblack-5 hover:bg-richblack-600 transition-all"
      >
        <FiBell size={16} />
        Announcements {announcements.length > 0 && `(${announcements.length})`}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-richblack-900 bg-opacity-75 backdrop-blur-sm">
          <div className="w-11/12 max-w-[600px] max-h-[85vh] rounded-xl border border-richblack-600 bg-richblack-800 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between bg-richblack-700 rounded-t-xl p-4">
              <p className="font-semibold text-richblack-5">📢 Announcements</p>
              <button onClick={() => setIsOpen(false)}>
                <FiX className="text-xl text-richblack-5" />
              </button>
            </div>

            {/* Create form (instructor only) */}
            {isInstructor && (
              <div className="p-4 border-b border-richblack-700">
                <p className="text-sm font-medium text-richblack-200 mb-2">New Announcement</p>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Title..."
                  className="w-full bg-richblack-700 text-richblack-5 text-sm rounded-md px-3 py-2 mb-2 outline-none"
                />
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Write your announcement..."
                  rows={3}
                  className="w-full bg-richblack-700 text-richblack-5 text-sm rounded-md px-3 py-2 mb-2 outline-none resize-none"
                />
                <button
                  onClick={handleCreate}
                  className="bg-yellow-50 text-richblack-900 text-sm font-semibold px-4 py-2 rounded-md hover:bg-yellow-25 transition-all"
                >
                  Post Announcement
                </button>
              </div>
            )}

            {/* Announcements list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <p className="text-richblack-400 text-sm text-center">Loading...</p>
              ) : announcements.length === 0 ? (
                <p className="text-richblack-400 text-sm text-center">No announcements yet.</p>
              ) : (
                announcements.map((ann) => (
                  <div key={ann._id} className="rounded-lg border border-richblack-600 bg-richblack-700 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-richblack-5">{ann.title}</p>
                        <p className="text-xs text-richblack-400 mt-0.5">
                          {ann.instructor?.firstName} {ann.instructor?.lastName} · {formatDate(ann.createdAt)}
                        </p>
                      </div>
                      {isInstructor && (
                        <button onClick={() => handleDelete(ann._id)} className="text-pink-300 hover:text-pink-200">
                          <FiTrash2 size={15} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-richblack-200 mt-2">{ann.message}</p>
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
