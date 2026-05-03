// ─── useWatchTime hook ────────────────────────────────────────
// Add this import in VideoDetails.jsx:
// import { useWatchTime } from "./useWatchTime"
// Then call: useWatchTime(courseId, subSectionId, playerRef, token)

import { useEffect, useRef } from "react"
import { apiConnector } from "../../../services/apiConnector"
import { FEATURE_ENDPOINTS } from "../../../services/apis"

export function useWatchTime(courseId, subSectionId, playerRef, token) {
  const sessionStartRef = useRef(null)
  const startTimestampRef = useRef(0)
  const isTrackingRef = useRef(false)

  const startSession = async (videoTimestamp = 0) => {
    if (isTrackingRef.current || !courseId || !subSectionId) return
    isTrackingRef.current = true
    sessionStartRef.current = Date.now()
    startTimestampRef.current = videoTimestamp

    try {
      await apiConnector("POST", FEATURE_ENDPOINTS.WATCHTIME_START, {
        courseId,
        subSectionId,
        videoTimestamp,
      }, { Authorization: `Bearer ${token}` })
    } catch (e) {
      console.log("WatchTime start error:", e)
    }
  }

  const endSession = async () => {
    if (!isTrackingRef.current || !courseId || !subSectionId) return
    isTrackingRef.current = false

    const durationSeconds = Math.round((Date.now() - (sessionStartRef.current || Date.now())) / 1000)
    const currentTimestamp = playerRef?.current?.getState?.()?.player?.currentTime || 0

    try {
      await apiConnector("POST", FEATURE_ENDPOINTS.WATCHTIME_END, {
        courseId,
        subSectionId,
        durationSeconds,
        videoTimestampEnd: Math.round(currentTimestamp),
      }, { Authorization: `Bearer ${token}` })
    } catch (e) {
      console.log("WatchTime end error:", e)
    }
  }

  // Start on mount, end on unmount
  useEffect(() => {
    if (!courseId || !subSectionId || !token) return
    startSession(0)

    const handleBeforeUnload = () => endSession()
    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) endSession()
      else startSession()
    })

    return () => {
      endSession()
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [courseId, subSectionId])

  return { startSession, endSession }
}
