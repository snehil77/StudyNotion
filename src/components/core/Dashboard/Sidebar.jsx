import { useState } from "react"
import { VscSignOut } from "react-icons/vsc"
import { MdVideoCall, MdClose } from "react-icons/md"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"

import { sidebarLinks } from "../../../data/dashboard-links"
import { logout } from "../../../services/operations/authAPI"
import { liveClassService } from "../../../services/liveClassService"
import ConfirmationModal from "../../Common/ConfirmationModal"
import SidebarLink from "./SidebarLink"

export default function Sidebar() {
  const { user, loading: profileLoading } = useSelector((state) => state.profile)
  const { loading: authLoading, token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [confirmationModal, setConfirmationModal] = useState(null)
  const [showLiveModal, setShowLiveModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [callType, setCallType] = useState("all")
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  const isInstructor = user?.accountType === "Instructor"

  const handleStartLive = async () => {
    if (!selectedCourse) {
      toast.error("Please enter Course Name")
      return
    }
    setLoading(true)
    try {
      const { roomId } = await liveClassService.createRoom({
        courseId: selectedCourse,
        title: title || "Live Class",
        token,
      })
      setShowLiveModal(false)
      navigate(`/live/${roomId}`)
    } catch (err) {
      // handled in service
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading || authLoading) {
    return (
      <div className="grid h-[calc(100vh-3.5rem)] min-w-[220px] items-center border-r-[1px] border-r-richblack-700 bg-richblack-800">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem)] min-w-[220px] flex-col border-r-[1px] border-r-richblack-700 bg-richblack-800 py-10">
        <div className="flex flex-col">
          {sidebarLinks.map((link) => {
            if (link.type && user?.accountType !== link.type) return null
            return <SidebarLink key={link.id} link={link} iconName={link.icon} />
          })}
        </div>

        {isInstructor && (
          <div className="px-4 mt-2">
            <button
              onClick={() => setShowLiveModal(true)}
              className="flex w-full items-center gap-x-2 rounded-lg bg-yellow-50 px-4 py-2.5 text-sm font-semibold text-richblack-900 hover:bg-yellow-25 transition-all"
            >
              <MdVideoCall className="text-xl" />
              <span>Start Live Class</span>
              <span className="ml-auto flex h-2 w-2 animate-pulse rounded-full bg-pink-500" />
            </button>
          </div>
        )}

        <div className="mx-auto mt-6 mb-6 h-[1px] w-10/12 bg-richblack-700" />

        <div className="flex flex-col">
          <SidebarLink
            link={{ name: "Settings", path: "/dashboard/settings" }}
            iconName="VscSettingsGear"
          />
          <button
            onClick={() =>
              setConfirmationModal({
                text1: "Are you sure?",
                text2: "You will be logged out of your account.",
                btn1Text: "Logout",
                btn2Text: "Cancel",
                btn1Handler: () => dispatch(logout(navigate)),
                btn2Handler: () => setConfirmationModal(null),
              })
            }
            className="px-8 py-2 text-sm font-medium text-richblack-300"
          >
            <div className="flex items-center gap-x-2">
              <VscSignOut className="text-lg" />
              <span>Logout</span>
            </div>
          </button>
        </div>
      </div>

      {showLiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="w-full max-w-md rounded-2xl bg-richblack-800 p-6 shadow-2xl border border-richblack-700">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-richblack-5">🎥 Start Live Class</h2>
                <p className="text-xs text-richblack-400 mt-0.5">Students will get notified instantly</p>
              </div>
              <button
                onClick={() => setShowLiveModal(false)}
                className="rounded-full p-1.5 text-richblack-400 hover:bg-richblack-700"
              >
                <MdClose size={20} />
              </button>
            </div>

            <label className="mb-1 block text-xs font-semibold text-richblack-300">
              Session Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Doubt Session - Chapter 3"
              className="mb-4 w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none focus:border-yellow-50"
            />

            <label className="mb-1 block text-xs font-semibold text-richblack-300">
              Course Name <span className="text-pink-200">*</span>
            </label>
            <input
              type="text"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              placeholder="Enter exact course name"
              className="mb-4 w-full rounded-lg border border-richblack-600 bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none focus:border-yellow-50"
            />

            <label className="mb-2 block text-xs font-semibold text-richblack-300">
              Who can join?
            </label>
            <div className="mb-5 flex gap-3">
              <button
                onClick={() => setCallType("all")}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all
                  ${callType === "all"
                    ? "border-yellow-50 bg-yellow-50 bg-opacity-10 text-yellow-50"
                    : "border-richblack-600 text-richblack-400 hover:border-richblack-400"
                  }`}
              >
                👥 All Enrolled Students
              </button>
              <button
                onClick={() => setCallType("selected")}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all
                  ${callType === "selected"
                    ? "border-yellow-50 bg-yellow-50 bg-opacity-10 text-yellow-50"
                    : "border-richblack-600 text-richblack-400 hover:border-richblack-400"
                  }`}
              >
                🎯 Selected Students
              </button>
            </div>

            {callType === "selected" && (
              <div className="mb-4 rounded-lg bg-richblack-700 px-3 py-2 text-xs text-richblack-400">
                💡 After starting, share the room link with specific students from inside the call.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowLiveModal(false)}
                className="flex-1 rounded-lg border border-richblack-600 py-2.5 text-sm text-richblack-300 hover:bg-richblack-700"
              >
                Cancel
              </button>
              <button
                onClick={handleStartLive}
                disabled={loading || !selectedCourse}
                className="flex-1 rounded-lg bg-yellow-50 py-2.5 text-sm font-bold text-richblack-900 hover:bg-yellow-25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Starting..." : "🚀 Go Live"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </>
  )
}
