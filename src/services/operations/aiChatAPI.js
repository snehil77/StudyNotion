import { apiConnector } from "../apiConnector"
import { AI_ENDPOINTS, FEATURE_ENDPOINTS } from "../apis"

export const askDoubt = async (question, courseContext, videoTitle, subSectionId, token, courseId, videoTimestamp = 0) => {
  try {
    const response = await apiConnector(
      "POST",
      AI_ENDPOINTS.ASK_DOUBT,
      { question, courseContext, videoTitle, subSectionId },
      { Authorization: `Bearer ${token}` }
    )

    const answer = response?.data?.answer || ""

    // Save doubt with video timestamp (fire and forget)
    if (subSectionId && courseId) {
      apiConnector("POST", FEATURE_ENDPOINTS.WATCHTIME_DOUBT, {
        courseId,
        subSectionId,
        videoTimestamp: Math.round(videoTimestamp),
        question,
        answer,
      }, { Authorization: `Bearer ${token}` }).catch(() => {})
    }

    // ← Yahan change kiya — object return karo
    return { success: true, answer }
  } catch (error) {
    console.log("ASK_DOUBT API ERROR:", error)
    return { success: false, answer: null }
  }
}

export const generateNotes = async (videoTitle, videoDescription, subSectionId, token) => {
  try {
    const response = await apiConnector(
      "POST",
      AI_ENDPOINTS.GENERATE_NOTES,
      { videoTitle, videoDescription, subSectionId },
      { Authorization: `Bearer ${token}` }
    )
    return response?.data?.notes || ""
  } catch (error) {
    console.log("GENERATE_NOTES API ERROR:", error)
    return null
  }
}