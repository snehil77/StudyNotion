import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { apiConnector } from "../../services/apiConnector"
import { AI_ENDPOINTS } from "../../services/apis"
import { IoMic, IoMicOff, IoClose } from "react-icons/io5"
import { MdFaceUnlock } from "react-icons/md"
import * as faceapi from "@vladmandic/face-api"

export default function EmotionAIAssistant({
  videoTitle,
  subSectionId,
  courseContext,
  onPauseVideo,
  onResumeVideo,
}) {
  const { token } = useSelector((state) => state.auth)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [confusedCount, setConfusedCount] = useState(0)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [statusMsg, setStatusMsg] = useState("")

  const videoRef = useRef(null)
  const intervalRef = useRef(null)
  const recognitionRef = useRef(null)
  const streamRef = useRef(null)
  const confusedCountRef = useRef(0)

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model/"
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ])
        setModelsLoaded(true)
        console.log("✅ Face API models loaded")
      } catch (err) {
        console.log("⚠️ Face API model load failed:", err)
      }
    }
    loadModels()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEverything()
    }
  }, [])

  const stopEverything = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const handleEnable = async () => {
    if (!modelsLoaded) {
      setStatusMsg("Models still loading, please wait...")
      return
    }
    setIsLoading(true)
    setStatusMsg("Starting webcam...")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => resolve()
          videoRef.current.play().catch(() => {})
        })
        // Wait for video to stabilize
        await new Promise((r) => setTimeout(r, 1000))
      }

      setIsEnabled(true)
      setStatusMsg("Emotion detection active 👀")
      startDetection()
    } catch (err) {
      setStatusMsg("Webcam access denied.")
      console.log("Webcam error:", err)
    }
    setIsLoading(false)
  }

  const handleDisable = () => {
    stopEverything()
    setIsEnabled(false)
    setShowPopup(false)
    setConfusedCount(0)
    confusedCountRef.current = 0
    setStatusMsg("")
    onResumeVideo?.()
  }

  const startDetection = () => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !videoRef.current.srcObject) return
      try {
        const detections = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.1 })
          )
          .withFaceExpressions()

        if (detections) {
          const expressions = detections.expressions
          console.log("😐 Expressions:", {
            sad: expressions.sad?.toFixed(3),
            fearful: expressions.fearful?.toFixed(3),
            disgusted: expressions.disgusted?.toFixed(3),
            angry: expressions.angry?.toFixed(3),
            happy: expressions.happy?.toFixed(3),
            neutral: expressions.neutral?.toFixed(3),
          })

          const confused =
            expressions.sad > 0.05 ||
            expressions.fearful > 0.05 ||
            expressions.disgusted > 0.05 ||
            expressions.angry > 0.05

          // Only reset count if clearly happy or neutral (not on "no face")
          if (confused) {
            confusedCountRef.current += 1
            console.log("😕 Confused count:", confusedCountRef.current)
            setConfusedCount(confusedCountRef.current)

            if (confusedCountRef.current >= 3) {
              confusedCountRef.current = 0
              setConfusedCount(0)
              onPauseVideo?.()
              setShowPopup(true)
            }
          } else if (expressions.happy > 0.3 || expressions.neutral > 0.7) {
            // Only reset when clearly NOT confused
            confusedCountRef.current = 0
            setConfusedCount(0)
          }
          // if neutral/no expression — keep existing count, don't reset
        } else {
          // No face — don't reset count, just log
          console.log("❌ No face detected — keeping count:", confusedCountRef.current)
        }
      } catch (err) {
        console.log("Detection error:", err)
      }
    }, 2000)
  }

  // Voice recognition
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setTranscript("Voice not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript
      setTranscript(text)
      await getAIAnswer(text)
    }

    recognition.onerror = (e) => {
      setIsListening(false)
      setTranscript("Could not hear clearly. Try again.")
    }

    recognition.start()
  }

  const getAIAnswer = async (question) => {
    if (!question.trim()) return
    setAiLoading(true)
    setAiResponse("")

    try {
      const res = await apiConnector(
        "POST",
        AI_ENDPOINTS.ASK_DOUBT,
        { question, courseContext, videoTitle, subSectionId },
        { Authorization: `Bearer ${token}` }
      )

      if (res?.data?.success) {
        const answer = res.data.answer
        setAiResponse(answer)
        speakAnswer(answer)
      }
    } catch (e) {
      setAiResponse("Could not get answer. Please try again.")
    }
    setAiLoading(false)
  }

  const speakAnswer = (text) => {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    synth.speak(utterance)
  }

  const handleResume = () => {
    setShowPopup(false)
    setTranscript("")
    setAiResponse("")
    setConfusedCount(0)
    confusedCountRef.current = 0
    onResumeVideo?.()
  }

  return (
    <>
      {/* Hidden webcam video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
        width={320}
        height={240}
      />

      {/* Enable/Disable Button */}
      <button
        onClick={isEnabled ? handleDisable : handleEnable}
        disabled={isLoading}
        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
          isEnabled
            ? "bg-pink-200 text-richblack-900 hover:bg-pink-100"
            : "bg-richblack-600 text-richblack-100 hover:bg-richblack-500"
        }`}
      >
        <MdFaceUnlock size={18} />
        {isLoading
          ? "Starting..."
          : isEnabled
          ? "🟢 Emotion AI On"
          : "🎭 Enable Emotion AI"}
      </button>

      {isEnabled && statusMsg && (
        <p className="text-xs text-richblack-400">{statusMsg}</p>
      )}

      {/* Confusion Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-[2000] grid place-items-center bg-richblack-900 bg-opacity-80 backdrop-blur-sm px-4">
          <div className="w-full max-w-[550px] rounded-xl border border-richblack-600 bg-richblack-800 overflow-hidden">

            {/* Header */}
            <div className="bg-yellow-50 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-richblack-900 text-base">
                  😕 Looks like you're confused!
                </p>
                <p className="text-xs text-richblack-700">
                  The lecture has been paused. Ask your doubt!
                </p>
              </div>
              <button onClick={handleResume}>
                <IoClose size={22} className="text-richblack-900" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">

              {/* Voice Button */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={startListening}
                  disabled={isListening || aiLoading}
                  className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                    isListening
                      ? "bg-pink-200 text-richblack-900 animate-pulse"
                      : "bg-yellow-50 text-richblack-900 hover:bg-yellow-25"
                  }`}
                >
                  {isListening ? (
                    <><IoMic size={18} /> Listening...</>
                  ) : (
                    <><IoMicOff size={18} /> Tap to Speak</>
                  )}
                </button>
                <p className="text-xs text-richblack-400">
                  Or type your doubt below
                </p>
              </div>

              {/* Type doubt */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Type your doubt here..."
                  className="flex-1 bg-richblack-700 text-richblack-5 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-50"
                  onKeyDown={(e) => e.key === "Enter" && getAIAnswer(transcript)}
                />
                <button
                  onClick={() => getAIAnswer(transcript)}
                  disabled={aiLoading || !transcript.trim()}
                  className="bg-yellow-50 text-richblack-900 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  Ask
                </button>
              </div>

              {/* AI Response */}
              {aiLoading && (
                <div className="flex items-center gap-2 text-richblack-300 text-sm">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-50 border-t-transparent" />
                  AI is thinking...
                </div>
              )}

              {aiResponse && (
                <div className="rounded-lg bg-richblack-700 p-4">
                  <p className="text-xs text-richblack-400 mb-2">🤖 AI Answer:</p>
                  <p className="text-richblack-5 text-sm leading-relaxed whitespace-pre-wrap">
                    {aiResponse}
                  </p>
                  <button
                    onClick={() => speakAnswer(aiResponse)}
                    className="mt-2 text-xs text-yellow-50 hover:text-yellow-25"
                  >
                    🔊 Read aloud again
                  </button>
                </div>
              )}

              {/* Resume Button */}
              <button
                onClick={handleResume}
                className="w-full rounded-lg bg-caribbeangreen-100 text-richblack-900 py-2 text-sm font-semibold hover:bg-caribbeangreen-50 transition-all"
              >
                ▶ Resume Lecture
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
