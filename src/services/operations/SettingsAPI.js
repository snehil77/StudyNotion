import { toast } from "react-hot-toast"

import { setUser } from "../../slices/profileSlice"
import { apiConnector } from "../apiConnector"
import { settingsEndpoints } from "../apis"
import { logout } from "./authAPI"

const {
  UPDATE_DISPLAY_PICTURE_API,
  UPDATE_PROFILE_API,
  CHANGE_PASSWORD_API,
  DELETE_PROFILE_API,
} = settingsEndpoints

export function updateDisplayPicture(token, formData) {
  return async (dispatch) => {
    const toastId = toast.loading("Uploading...")
    try {
      console.log("📤 SettingsAPI: updateDisplayPicture called")
      console.log("Token:", token ? "Present" : "Missing")
      
      // Debug: Check formData
      for (let pair of formData.entries()) {
        console.log("FormData entry:", pair[0], pair[1])
      }

      const response = await apiConnector(
        "PUT",
        UPDATE_DISPLAY_PICTURE_API,
        formData,
        {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        }
      )
      console.log("API Response:", response)

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Upload failed")
      }

      toast.success("Display Picture Updated Successfully")
      
      // Update user data in Redux
      const userData = response?.data?.data || response?.data?.user
      if (userData) {
        dispatch(setUser(userData))
        localStorage.setItem("user", JSON.stringify(userData))
      }
      
    } catch (error) {
      console.log("Upload Error:", error)
      toast.error(error?.message || "Could Not Update Display Picture")
    }
    toast.dismiss(toastId)
  }
}

export function updateProfile(token, formData) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...")
    try {
      const response = await apiConnector("PUT", UPDATE_PROFILE_API, formData, {
        Authorization: `Bearer ${token}`,
      })
      console.log("UPDATE_PROFILE_API API RESPONSE............", response)

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Could not update profile")
      }
      
      const userData = response?.data?.updatedUserDetails || response?.data?.data || response?.data?.user
      
      if (userData) {
        const userImage = userData?.image || 
          `https://api.dicebear.com/5.x/initials/svg?seed=${userData?.firstName || 'User'} ${userData?.lastName || ''}`
        
        dispatch(setUser({ ...userData, image: userImage }))
        localStorage.setItem("user", JSON.stringify({ ...userData, image: userImage }))
      }
      
      toast.success("Profile Updated Successfully")
    } catch (error) {
      console.log("UPDATE_PROFILE_API API ERROR............", error)
      toast.error(error?.message || "Could Not Update Profile")
    }
    toast.dismiss(toastId)
  }
}

export async function changePassword(token, formData) {
  const toastId = toast.loading("Loading...")
  try {
    const response = await apiConnector("POST", CHANGE_PASSWORD_API, formData, {
      Authorization: `Bearer ${token}`,
    })
    console.log("CHANGE_PASSWORD_API API RESPONSE............", response)

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not change password")
    }
    toast.success("Password Changed Successfully")
  } catch (error) {
    console.log("CHANGE_PASSWORD_API API ERROR............", error)
    toast.error(error?.response?.data?.message || error?.message || "Could Not Change Password")
  }
  toast.dismiss(toastId)
}

export function deleteProfile(token, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...")
    try {
      const response = await apiConnector("DELETE", DELETE_PROFILE_API, null, {
        Authorization: `Bearer ${token}`,
      })
      console.log("DELETE_PROFILE_API API RESPONSE............", response)

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Could not delete profile")
      }
      toast.success("Profile Deleted Successfully")
      dispatch(logout(navigate))
    } catch (error) {
      console.log("DELETE_PROFILE_API API ERROR............", error)
      toast.error(error?.message || "Could Not Delete Profile")
    }
    toast.dismiss(toastId)
  }
}