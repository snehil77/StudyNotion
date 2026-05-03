import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import { liveClassService } from "../../../services/liveClassService"

export default function LiveClassRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.profile)
  const { token } = useSelector((s) => s.auth)

  const containerRef = useRef(null)
  const hasJoined = useRef(false)
  const zpRef = useRef(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?._id || !user?.firstName) return
    if (hasJoined.current) return
    hasJoined.current = true

    const initZego = async () => {
      try {
        setIsLoading(true)

        const { appID, serverSecret } = await liveClassService.getZegoToken({
          roomId,
          userId: user._id,
          userName: `${user.firstName} ${user.lastName || ""}`.trim(),
          token,
        })

        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt")

        const userName = `${user.firstName} ${user.lastName || ""}`.trim()

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          Number(appID),
          serverSecret,
          roomId,
          user._id,
          userName
        )

        const zp = ZegoUIKitPrebuilt.create(kitToken)
        zpRef.current = zp

        zp.joinRoom({
          container: containerRef.current,
          sharedLinks: [],
          scenario: {
            mode: ZegoUIKitPrebuilt.VideoConference,
          },
          turnOnCameraWhenJoining: true,
          turnOnMicrophoneWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: true,
          showTextChat: true,
          showUserList: true,
          maxUsers: 10,
          layout: "Auto",
          showLayoutButton: true,
          onJoinRoom: () => {
            setIsLoading(false)
            toast.success("Joined live class!")
          },
          onLeaveRoom: () => {
            // ← Role ke hisaab se redirect
            if (user?.accountType === "Instructor") {
              window.location.href = "/dashboard/my-courses"
            } else {
              window.location.href = "/dashboard/enrolled-courses"
            }
          },
        })

        setTimeout(() => setIsLoading(false), 8000)

      } catch (err) {
        console.error("Zego init error:", err)
        setError(err.message)
        setIsLoading(false)
        toast.error("Could not join the live class.")
      }
    }

    initZego()

  }, [user?._id])

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-richblack-900">
        <div className="text-center">
          <p className="text-pink-200 text-lg font-semibold mb-4">Failed to join live class</p>
          <p className="text-richblack-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.href = "/dashboard/my-courses"}
            className="rounded-lg bg-yellow-50 px-6 py-2 text-richblack-900 font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full bg-richblack-900">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-richblack-900">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-richblack-600 border-t-yellow-50" />
          <p className="text-richblack-300 text-sm">Joining live class...</p>
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />
    </div>
  )
}