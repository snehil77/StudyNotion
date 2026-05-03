// src/services/liveClassService.js
import { apiConnector } from "./apiConnector"
import { toast } from "react-hot-toast"

const LIVE_CLASS_API = {
  CREATE_ROOM: "http://localhost:4000/api/v1/liveclass/create",
  GET_TOKEN:   "http://localhost:4000/api/v1/liveclass/token",
  END_ROOM:    "http://localhost:4000/api/v1/liveclass/end",
  GET_ROOMS:   "http://localhost:4000/api/v1/liveclass/rooms",
}

export const liveClassService = {
  /**
   * Instructor creates a new live class room
   * @param {{ courseId: string, title: string, token: string }} params
   * @returns {{ roomId: string }}
   */
  createRoom: async ({ courseId, title, token }) => {
    const toastId = toast.loading("Creating live class...")
    try {
      const res = await apiConnector("POST", LIVE_CLASS_API.CREATE_ROOM, { courseId, title }, {
        Authorization: `Bearer ${token}`,
      })
      toast.dismiss(toastId)
      toast.success("Live class created!")
      return res.data.data  // { roomId }
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err?.response?.data?.message || "Failed to create live class")
      throw err
    }
  },

  /**
   * Get ZegoCloud kit token for joining a room
   * Called by both instructor and student before joining
   * @param {{ roomId: string, userId: string, userName: string, token: string }} params
   * @returns {{ kitToken: string, appID: number }}
   */
  getZegoToken: async ({ roomId, userId, userName, token }) => {
    try {
      const res = await apiConnector("POST", LIVE_CLASS_API.GET_TOKEN, { roomId, userId, userName }, {
        Authorization: `Bearer ${token}`,
      })
      return res.data.data  // { kitToken, appID }
    } catch (err) {
      toast.error("Authentication failed for live class")
      throw err
    }
  },

  /**
   * Instructor ends the live class room
   * @param {{ roomId: string, token: string }} params
   */
  endRoom: async ({ roomId, token }) => {
    try {
      await apiConnector("POST", LIVE_CLASS_API.END_ROOM, { roomId }, {
        Authorization: `Bearer ${token}`,
      })
      toast.success("Live class ended")
    } catch (err) {
      toast.error("Failed to end live class")
      throw err
    }
  },

  /**
   * Get active live class rooms for a course (student view)
   * @param {{ courseId: string, token: string }} params
   * @returns {Array<{ roomId, title, instructorName, participantCount, startedAt }>}
   */
  getActiveRooms: async ({ courseId, token }) => {
    try {
      const res = await apiConnector("GET", `${LIVE_CLASS_API.GET_ROOMS}?courseId=${courseId}`, null, {
        Authorization: `Bearer ${token}`,
      })
      return res.data.data
    } catch (err) {
      toast.error("Could not fetch live classes")
      return []
    }
  },
}
