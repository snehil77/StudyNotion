import { useState } from "react"
import { HiOutlineDocumentText } from "react-icons/hi"
import { useSelector } from "react-redux"
import ReactMarkdown from "react-markdown"
import { RxCross2 } from "react-icons/rx"
import { apiConnector } from "../../services/apiConnector"
import { AI_ENDPOINTS } from "../../services/apis"

export default function AINotesButton({ videoTitle, videoDescription, subSectionId }) {
  const { token } = useSelector((state) => state.auth)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleGenerateNotes = async () => {
    if (notes) { setIsOpen(true); return }
    setLoading(true)
    setIsOpen(true)
    try {
      const res = await apiConnector(
        "POST",
        AI_ENDPOINTS.GENERATE_NOTES,
        { videoTitle, videoDescription, subSectionId },
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) setNotes(res.data.notes)
      else setNotes("Could not generate notes. Please try again.")
    } catch (e) {
      setNotes("Error generating notes. Please try again.")
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={handleGenerateNotes}
        className="flex items-center gap-2 rounded-md bg-yellow-50 px-4 py-2 text-sm font-semibold text-richblack-900 hover:bg-yellow-100 transition-all"
      >
        <HiOutlineDocumentText size={18} />
        {loading ? "Generating..." : "Generate AI Notes"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-richblack-900 bg-opacity-75 backdrop-blur-sm">
          <div className="relative w-11/12 max-w-[700px] max-h-[80vh] rounded-lg border border-richblack-600 bg-richblack-800 flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between rounded-t-lg bg-richblack-700 p-4">
              <p className="font-semibold text-richblack-5">
                📄 AI Notes — {videoTitle}
              </p>
              <button onClick={() => setIsOpen(false)}>
                <RxCross2 className="text-xl text-richblack-5" />
              </button>
            </div>

            {/* Notes Content */}
            <div className="overflow-y-auto p-6 text-richblack-5 prose prose-invert max-w-none">
              {loading ? (
                <div className="flex items-center gap-3 text-richblack-300">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-50 border-t-transparent" />
                  Generating notes from video transcript...
                </div>
              ) : (
                <ReactMarkdown>{notes}</ReactMarkdown>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-richblack-700 text-center text-xs text-richblack-400">
              Powered by Groq AI
            </div>

          </div>
        </div>
      )}
    </>
  )
}

