import { useState } from "react"
import { HiOutlineClipboardList } from "react-icons/hi"
import { RxCross2 } from "react-icons/rx"
import { useSelector } from "react-redux"
import { apiConnector } from "../../services/apiConnector"
import { AI_ENDPOINTS } from "../../services/apis"

export default function AIQuizButton({ videoTitle, subSectionId }) {
  const { token } = useSelector((state) => state.auth)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [selected, setSelected] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [error, setError] = useState("")

  const handleGenerateQuiz = async () => {
    setIsOpen(true)
    if (questions.length > 0) return
    setLoading(true)
    setError("")
    setSelected({})
    setSubmitted(false)

    try {
      const res = await apiConnector(
        "POST",
        AI_ENDPOINTS.GENERATE_QUIZ,
        { videoTitle, subSectionId },
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) {
        setQuestions(res.data.questions)
      } else {
        setError("Could not generate quiz. Please try again.")
      }
    } catch (e) {
      setError("Error generating quiz. Please try again.")
    }
    setLoading(false)
  }

  const handleSelect = (qIndex, optIndex) => {
    if (submitted) return
    setSelected((prev) => ({ ...prev, [qIndex]: optIndex }))
  }

  const handleSubmit = () => {
    let correct = 0
    questions.forEach((q, i) => {
      if (selected[i] === q.correct) correct++
    })
    setScore(correct)
    setSubmitted(true)
  }

  const handleRetry = () => {
    setSelected({})
    setSubmitted(false)
    setScore(0)
  }

  const handleClose = () => {
    setIsOpen(false)
    setQuestions([])
    setSelected({})
    setSubmitted(false)
    setScore(0)
    setError("")
  }

  const allAnswered = questions.length > 0 && Object.keys(selected).length === questions.length

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleGenerateQuiz}
        className="flex items-center gap-2 rounded-md bg-pink-200 px-4 py-2 text-sm font-semibold text-richblack-900 hover:bg-pink-100 transition-all"
      >
        <HiOutlineClipboardList size={18} />
        Take AI Quiz
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-richblack-900 bg-opacity-80 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-[750px] max-h-[85vh] rounded-xl border border-richblack-600 bg-richblack-800 flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between rounded-t-xl bg-pink-200 px-5 py-4">
              <div>
                <p className="font-bold text-richblack-900 text-base">🧠 AI Quiz</p>
                <p className="text-xs text-richblack-700">{videoTitle}</p>
              </div>
              <button onClick={handleClose}>
                <RxCross2 className="text-xl text-richblack-900" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-5 flex flex-col gap-5">

              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-transparent" />
                  <p className="text-richblack-300 text-sm">Generating quiz from lecture...</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-center text-pink-200 text-sm">{error}</p>
              )}

              {/* Score Result */}
              {submitted && (
                <div className={`rounded-lg p-4 text-center ${score >= 3 ? "bg-caribbeangreen-700" : "bg-pink-700"}`}>
                  <p className="text-2xl font-bold text-white">
                    {score} / {questions.length}
                  </p>
                  <p className="text-white text-sm mt-1">
                    {score === questions.length
                      ? "🎉 Perfect Score!"
                      : score >= 3
                      ? "✅ Good Job!"
                      : "📖 Review the lecture and try again!"}
                  </p>
                </div>
              )}

              {/* Questions */}
              {!loading && questions.map((q, qIdx) => (
                <div key={qIdx} className="rounded-lg border border-richblack-600 p-4 flex flex-col gap-3">
                  <p className="text-richblack-5 font-semibold text-sm">
                    Q{qIdx + 1}. {q.question}
                  </p>

                  <div className="flex flex-col gap-2">
                    {q.options.map((opt, oIdx) => {
                      let optStyle = "border-richblack-600 bg-richblack-700 text-richblack-100"

                      if (submitted) {
                        if (oIdx === q.correct) {
                          optStyle = "border-caribbeangreen-200 bg-caribbeangreen-700 text-white"
                        } else if (selected[qIdx] === oIdx && oIdx !== q.correct) {
                          optStyle = "border-pink-200 bg-pink-700 text-white"
                        }
                      } else if (selected[qIdx] === oIdx) {
                        optStyle = "border-yellow-50 bg-richblack-600 text-yellow-50"
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelect(qIdx, oIdx)}
                          className={`text-left px-4 py-2 rounded-lg border text-sm transition-all ${optStyle}`}
                        >
                          <span className="font-bold mr-2">
                            {["A", "B", "C", "D"][oIdx]}.
                          </span>
                          {opt}
                        </button>
                      )
                    })}
                  </div>

                  {/* Explanation after submit */}
                  {submitted && (
                    <div className="mt-1 rounded-md bg-richblack-700 px-3 py-2">
                      <p className="text-xs text-richblack-300">
                        💡 <span className="text-richblack-100">{q.explanation}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            {!loading && questions.length > 0 && (
              <div className="px-5 py-4 border-t border-richblack-700 flex items-center justify-between">
                <p className="text-xs text-richblack-400">Powered by Groq AI</p>
                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    className="rounded-md bg-yellow-50 px-5 py-2 text-sm font-semibold text-richblack-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-25 transition-all"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={handleRetry}
                    className="rounded-md bg-richblack-600 px-5 py-2 text-sm font-semibold text-richblack-5 hover:bg-richblack-500 transition-all"
                  >
                    Retry Quiz
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}
