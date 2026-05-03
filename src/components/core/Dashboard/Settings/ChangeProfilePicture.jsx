import { useEffect, useRef, useState } from "react"
import { FiUpload } from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux"

import { updateDisplayPicture } from "../../../../services/operations/SettingsAPI"

export default function ChangeProfilePicture() {
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)
  const dispatch = useDispatch()

  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [previewSource, setPreviewSource] = useState(null)

  const fileInputRef = useRef(null)

  const handleClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    console.log("File selected:", file)
    if (file) {
      setImageFile(file)
      previewFile(file)
    }
  }

  const previewFile = (file) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => {
      setPreviewSource(reader.result)
    }
  }

  const handleFileUpload = () => {
    console.log("Upload button clicked")
    console.log("imageFile:", imageFile)
    
    if (!imageFile) {
      console.log("No file selected")
      return
    }
    
    setLoading(true)
    const formData = new FormData()
    formData.append("profilePicture", imageFile)
    
    for (let pair of formData.entries()) {
      console.log("FormData entry:", pair[0], pair[1])
    }
    
    dispatch(updateDisplayPicture(token, formData)).finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    if (imageFile) {
      previewFile(imageFile)
    }
  }, [imageFile])
  
  return (
    <div className="flex items-center justify-between rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-8 px-12 text-richblack-5">
      <div className="flex items-center gap-x-4">
        <img
          src={previewSource || user?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${user?.firstName}`}
          alt={`profile-${user?.firstName}`}
          className="aspect-square w-[78px] rounded-full object-cover"
        />
        <div className="space-y-2">
          <p>Change Profile Picture</p>
          <div className="flex flex-row gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/gif, image/jpeg"
            />
            <button
              onClick={handleClick}
              disabled={loading}
              className="cursor-pointer rounded-md bg-richblack-700 py-2 px-5 font-semibold text-richblack-50"
            >
              Select
            </button>
            <button
              onClick={handleFileUpload}
              disabled={!imageFile || loading}
              className="flex items-center gap-2 rounded-md bg-yellow-50 py-2 px-5 font-semibold text-black hover:bg-yellow-100 disabled:opacity-50"
            >
              <FiUpload className="text-lg" />
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
          {imageFile && (
            <p className="text-xs text-richblack-300">Selected: {imageFile.name}</p>
          )}
        </div>
      </div>
    </div>
  )
}