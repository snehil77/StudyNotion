import { apiConnector } from "./apiConnector"
import { toast } from "react-hot-toast"

const BASE = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api/v1"

const LIVE_CLASS_API = {
  CREATE_ROOM: `${BASE}/liveclass/create`,
  GET_TOKEN:   `${BASE}/liveclass/token`,
  END_ROOM:    `${BASE}/liveclass/end`,
  GET_ROOMS:   `${BASE}/liveclass/rooms`,
}

export const liveClassService = {
  createRoom: async ({ courseId, title, token }) => {
    const toastId = toast.loading("Creating live class...")
    try {
      const res = await apiConnector("POST", LIVE_CLASS_API.CREATE_ROOM, { courseId, title }, {
        Authorization: `Bearer ${token}`,
      })
      toast.dismiss(toastId)
      toast.success("Live class created!")
      return res.data.data
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err?.response?.data?.message || "Failed to create live class")
      throw err
    }
  },

  getZegoToken: async ({ roomId, userId, userName, token }) => {
    try {
      const res = await apiConnector("POST", LIVE_CLASS_API.GET_TOKEN, { roomId, userId, userName }, {
        Authorization: `Bearer ${token}`,
      })
      return res.data.data
    } catch (err) {
      toast.error("Authentication failed for live class")
      throw err
    }
  },

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
