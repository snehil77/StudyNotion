import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { apiConnector } from "../../services/apiConnector"
import { FEATURE_ENDPOINTS } from "../../services/apis"
import { FiX, FiClock, FiAward, FiCamera, FiMic } from "react-icons/fi"
import * as faceapi from "@vladmandic/face-api"

const PASS_PERCENTAGE = 40
const MAX_WARNINGS = 3

export default function ExamPanel({ courseId }) {
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)

  const [exams, setExams] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeExam, setActiveExam] = useState(null)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  // Anti-cheat state
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [permissionLoading, setPermissionLoading] = useState(false)
  const [warnings, setWarnings] = useState(0)
  const [warningMsg, setWarningMsg] = useState("")
  const [showWarningBanner, setShowWarningBanner] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [violations, setViolations] = useState([])
  const [showFullscreenPopup, setShowFullscreenPopup] = useState(false)

  // Already passed/submitted state
  const [alreadyPassed, setAlreadyPassed] = useState(false)
  const [previousResult, setPreviousResult] = useState(null)

  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const faceIntervalRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const audioIntervalRef = useRef(null)
  const warningsRef = useRef(0)
  const cancelledRef = useRef(false)
  const violationsRef = useRef([])
  const submittedRef = useRef(false)

  // Load face-api models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model/"
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ])
        setModelsLoaded(true)
      } catch (err) {
        console.log("Face API load error:", err)
      }
    }
    loadModels()
    return () => stopAntiCheat()
  }, [])

  useEffect(() => {
    if (isOpen) fetchExams()
  }, [isOpen])

  useEffect(() => {
    if (activeExam && permissionGranted && !submitted && !cancelled) {
      setTimeLeft(activeExam.duration * 60)
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleSubmit(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      startAntiCheat()
    }
    return () => {
      clearInterval(timerRef.current)
    }
  }, [activeExam, permissionGranted])

  const fetchExams = async () => {
    try {
      const res = await apiConnector(
        "GET",
        `${FEATURE_ENDPOINTS.GET_COURSE_EXAMS}/${courseId}`,
        null,
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) {
        setExams(res.data.exams)
        const passed = res.data.exams.find((e) => e.studentResult?.passed)
        if (passed) {
          setAlreadyPassed(true)
          setPreviousResult(passed.studentResult)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  // ── Request camera + mic permission ──────────────────────
  const requestPermissions = async () => {
    setPermissionLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.width = 320
        videoRef.current.height = 240
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => resolve()
          videoRef.current.play().catch(() => {})
        })
        await new Promise((r) => setTimeout(r, 1000))
      }
      setPermissionGranted(true)

      // Setup audio analyser
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analyserRef.current = analyser
    } catch (err) {
      alert("Camera and microphone access is required to take the exam. Please allow access and try again.")
    }
    setPermissionLoading(false)
  }

  // Start anti-cheat monitoring
  const startAntiCheat = () => {
    // Fullscreen attempt - catch promise rejection silently
    document.documentElement.requestFullscreen?.().catch(() => {})

    // Wait 5s before starting face detection (let video stabilize)
    setTimeout(() => {
      faceIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || cancelledRef.current || submittedRef.current) return
        if (!videoRef.current.srcObject) return
        try {
          const detections = await faceapi
            .detectAllFaces(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.05 })
            )
          console.log("Face detection count:", detections.length)
          if (detections.length === 0) {
            triggerWarning("No face detected! Please stay in front of the camera.")
          } else if (detections.length > 1) {
            triggerWarning("Multiple faces detected! Only you should be in frame.")
          }
        } catch (e) {
          console.log("Face detection error:", e)
        }
      }, 8000)
    }, 5000)


    // Audio monitoring every 3 seconds
    audioIntervalRef.current = setInterval(() => {
      if (!analyserRef.current || cancelledRef.current) return
      const data = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      if (avg > 35) {
        triggerWarning("⚠️ Background noise detected! Please ensure a quiet environment.")
      }
    }, 3000)

    // Tab visibility change
    document.addEventListener("visibilitychange", handleVisibilityChange)
    // Fullscreen exit
    document.addEventListener("fullscreenchange", handleFullscreenChange)
  }

  const stopAntiCheat = () => {
    clearInterval(faceIntervalRef.current)
    clearInterval(audioIntervalRef.current)
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    document.removeEventListener("fullscreenchange", handleFullscreenChange)
    // Safe fullscreen exit
    try {
      if (document.fullscreenElement) document.exitFullscreen?.()
    } catch (e) {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close() } catch (e) {}
      audioContextRef.current = null
    }
  }

  const handleVisibilityChange = () => {
    if (document.hidden && !cancelledRef.current && !submittedRef.current) {
      triggerWarning("⚠️ Tab switch detected! Do not leave the exam tab.")
    }
  }

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement && !cancelledRef.current && !submittedRef.current) {
      triggerWarning("⚠️ Fullscreen exited! Please return to fullscreen mode.")
      setShowFullscreenPopup(true)
      // Pause exam timer while fullscreen popup shown
      clearInterval(timerRef.current)
    }
  }

  const handleReenterFullscreen = () => {
    document.documentElement.requestFullscreen?.()
      .then(() => {
        setShowFullscreenPopup(false)
        // Resume timer after going back to fullscreen
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current)
              handleSubmit(false)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      })
      .catch(() => {
        setShowFullscreenPopup(false)
      })
  }

  // ── Warning system ────────────────────────────────────────
  const triggerWarning = (msg) => {
    if (cancelledRef.current || submittedRef.current) return

    const newCount = warningsRef.current + 1
    warningsRef.current = newCount

    const violation = {
      count: newCount,
      message: msg,
      time: new Date().toLocaleTimeString(),
    }
    violationsRef.current = [...violationsRef.current, violation]
    setViolations([...violationsRef.current])
    setWarnings(newCount)
    setWarningMsg(msg)
    setShowWarningBanner(true)

    setTimeout(() => setShowWarningBanner(false), 4000)

    if (newCount > MAX_WARNINGS) {
      cancelledRef.current = true
      setCancelled(true)
      stopAntiCheat()
      clearInterval(timerRef.current)
      handleSubmit(true)
    }
  }

  // ── Submit exam ───────────────────────────────────────────
  const handleSubmit = async (forceCancel = false) => {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitted(true)
    clearInterval(timerRef.current)
    stopAntiCheat()

    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000)

    try {
      const res = await apiConnector(
        "POST",
        FEATURE_ENDPOINTS.SUBMIT_EXAM,
        {
          examId: activeExam._id,
          answers: forceCancel ? new Array(activeExam.questions.length).fill(-1) : answers,
          timeTaken,
          forceCancel,
          violations: violationsRef.current,
        },
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) setResult(res.data)
    } catch (e) {
      console.log(e)
    }
  }

  const startExam = async (exam) => {
    setActiveExam(exam)
    setAnswers(new Array(exam.questions.length).fill(null))
    setResult(null)
    setSubmitted(false)
    submittedRef.current = false
    setCancelled(false)
    setWarnings(0)
    setViolations([])
    warningsRef.current = 0
    cancelledRef.current = false
    violationsRef.current = []
    setPermissionGranted(false)
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0")
    const s = (secs % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const handleClose = () => {
    stopAntiCheat()
    clearInterval(timerRef.current)
    submittedRef.current = false
    setIsOpen(false)
    setActiveExam(null)
    setResult(null)
    setPermissionGranted(false)
    setCancelled(false)
    setWarnings(0)
    warningsRef.current = 0
    cancelledRef.current = false
  }

  return (
    <>
      {/* Hidden webcam */}
      <video ref={videoRef} autoPlay muted playsInline style={{position:"fixed",bottom:"110px",right:"16px",width:"120px",height:"90px",borderRadius:"8px",border:"2px solid #16a34a",objectFit:"cover",zIndex:9999,display: permissionGranted && activeExam && !result ? "block" : "none"}} />

      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md bg-richblack-700 px-4 py-2 text-sm font-semibold text-richblack-5 hover:bg-richblack-600 transition-all"
      >
        <FiAward size={16} />
        Exams {exams.length > 0 && `(${exams.length})`}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-richblack-900 bg-opacity-90 backdrop-blur-sm">
          <div className="w-11/12 max-w-[700px] max-h-[90vh] rounded-xl border border-richblack-600 bg-richblack-800 flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between bg-richblack-700 p-4 flex-shrink-0">
              <p className="font-semibold text-richblack-5">
                {activeExam
                  ? result
                    ? "📊 Results"
                    : `📝 ${activeExam.title}`
                  : "🎓 Exams"}
              </p>
              <div className="flex items-center gap-3">
                {activeExam && !result && permissionGranted && (
                  <span className={`flex items-center gap-1 text-sm font-mono font-bold ${timeLeft < 60 ? "text-pink-400" : "text-yellow-50"}`}>
                    <FiClock size={14} /> {formatTime(timeLeft)}
                  </span>
                )}
                {activeExam && !result && permissionGranted && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    warnings === 0 ? "bg-green-800 text-green-300" :
                    warnings <= 2 ? "bg-yellow-800 text-yellow-300" : "bg-red-800 text-red-300"
                  }`}>
                    ⚠️ {warnings}/{MAX_WARNINGS} warnings
                  </span>
                )}
                {!activeExam && (
                  <button onClick={handleClose}>
                    <FiX className="text-xl text-richblack-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Warning banner */}
            {showWarningBanner && (
              <div className="bg-red-900 border-b border-red-700 px-4 py-2 flex-shrink-0">
                <p className="text-sm font-semibold text-red-200">{warningMsg}</p>
                <p className="text-xs text-red-400 mt-0.5">
                  Warning {warnings}/{MAX_WARNINGS} — {MAX_WARNINGS - warnings > 0 ? `${MAX_WARNINGS - warnings} more will cancel the exam` : "Next violation will cancel exam"}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5">

              {/* ── Exam list ── */}
              {!activeExam && (
                <div className="space-y-3">
                  {exams.length === 0 ? (
                    <p className="text-richblack-400 text-sm text-center py-8">No exams available yet.</p>
                  ) : (
                    exams.map((exam) => {
                      const studentResult = exam.studentResult
                      const hasPassed = studentResult?.passed
                      const hasAttempted = !!studentResult

                      return (
                        <div key={exam._id} className="rounded-lg border border-richblack-600 bg-richblack-700 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-richblack-5">{exam.title}</p>
                              {exam.description && (
                                <p className="text-sm text-richblack-300 mt-0.5">{exam.description}</p>
                              )}
                              <p className="text-xs text-richblack-400 mt-1">
                                {exam.questions?.length} questions · {exam.duration} min · Pass: {PASS_PERCENTAGE}%
                              </p>
                              {hasAttempted && (
                                <p className={`text-xs font-semibold mt-1 ${hasPassed ? "text-green-400" : "text-red-400"}`}>
                                  {hasPassed
                                    ? `✅ Passed — Score: ${studentResult.percentage}%`
                                    : `❌ Failed — Score: ${studentResult.percentage}% — You can retake`}
                                </p>
                              )}
                            </div>
                            {hasPassed ? (
                              <div className="text-center">
                                <p className="text-xs text-green-400 font-semibold">✅ Completed</p>
                                <p className="text-xs text-richblack-400 mt-0.5">Already passed</p>
                              </div>
                            ) : (
                              <button
                                onClick={() => startExam(exam)}
                                className="bg-yellow-50 text-richblack-900 text-sm font-semibold px-4 py-2 rounded-md hover:bg-yellow-25 transition-all"
                              >
                                {hasAttempted ? "Retake" : "Start"}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* ── Permission screen ── */}
              {activeExam && !permissionGranted && !result && (
                <div className="flex flex-col items-center gap-5 py-6 text-center">
                  <div className="text-5xl">📷</div>
                  <div>
                    <p className="text-lg font-bold text-richblack-5">Camera & Mic Required</p>
                    <p className="text-sm text-richblack-300 mt-2 max-w-sm">
                      This exam requires your camera and microphone to be active throughout.
                      The exam will be monitored for:
                    </p>
                  </div>
                  <div className="w-full max-w-sm space-y-2 text-left">
                    {[
                      "👤 Face must be visible at all times",
                      "👥 Only one person should be in frame",
                      "🔇 No background voices allowed",
                      "🖥️ Do not switch tabs or exit fullscreen",
                      `⚠️ ${MAX_WARNINGS} warnings = exam cancelled with 0 marks`,
                    ].map((rule, i) => (
                      <div key={i} className="rounded-lg bg-richblack-700 px-4 py-2 text-sm text-richblack-200">
                        {rule}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveExam(null)}
                      className="rounded-lg bg-richblack-700 px-5 py-2 text-sm text-richblack-300 hover:bg-richblack-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={requestPermissions}
                      disabled={permissionLoading || !modelsLoaded}
                      className="flex items-center gap-2 rounded-lg bg-yellow-50 px-6 py-2 text-sm font-semibold text-richblack-900 hover:bg-yellow-25 disabled:opacity-50 transition-all"
                    >
                      <FiCamera size={16} />
                      <FiMic size={16} />
                      {permissionLoading ? "Starting..." : !modelsLoaded ? "Loading AI..." : "Allow & Start Exam"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Cancelled screen ── */}
              {cancelled && !result && (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="text-5xl">🚫</div>
                  <p className="text-xl font-bold text-red-400">Exam Cancelled</p>
                  <p className="text-sm text-richblack-300 max-w-sm">
                    Your exam has been cancelled due to repeated violations. You have been awarded 0 marks.
                    The instructor has been notified.
                  </p>
                  <div className="w-full max-w-sm space-y-2">
                    {violations.map((v, i) => (
                      <div key={i} className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-xs text-red-300 text-left">
                        [{v.time}] {v.message}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleClose}
                    className="rounded-lg bg-richblack-700 px-6 py-2 text-sm text-richblack-200 hover:bg-richblack-600 transition-all"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* ── Active exam questions ── */}
              {activeExam && permissionGranted && !result && !cancelled && (
                <div className="space-y-5">
                  {/* Camera monitoring indicator */}
                  <div className="flex items-center gap-3 rounded-lg bg-richblack-700 p-3">
                    <div className="h-16 w-24 rounded-md bg-richblack-600 border border-green-700 flex flex-col items-center justify-center gap-1">
                      <FiCamera size={18} className="text-green-400" />
                      <span className="text-xs text-green-400 font-semibold">Live</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-400">🟢 Monitoring Active</p>
                      <p className="text-xs text-richblack-400 mt-0.5">Camera and microphone are being monitored</p>
                      <p className="text-xs text-richblack-400">Warnings: {warnings}/{MAX_WARNINGS}</p>
                    </div>
                  </div>

                  {activeExam.questions.map((q, qi) => (
                    <div key={qi} className="rounded-lg border border-richblack-600 bg-richblack-700 p-4">
                      <p className="font-medium text-richblack-5 mb-3">
                        Q{qi + 1}. {q.questionText}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => {
                              const a = [...answers]
                              a[qi] = oi
                              setAnswers(a)
                            }}
                            className={`w-full text-left text-sm px-4 py-2 rounded-md border transition-all ${
                              answers[qi] === oi
                                ? "border-yellow-50 bg-yellow-50/10 text-yellow-50"
                                : "border-richblack-500 text-richblack-200 hover:border-richblack-400"
                            }`}
                          >
                            {String.fromCharCode(65 + oi)}. {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={answers.includes(null)}
                    className="w-full bg-yellow-50 text-richblack-900 font-semibold py-3 rounded-md hover:bg-yellow-25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Submit Exam ({answers.filter((a) => a !== null).length}/{activeExam.questions.length} answered)
                  </button>
                </div>
              )}

              {/* ── Results ── */}
              {result && (
                <div className="space-y-4">
                  <div className={`rounded-xl border p-6 text-center ${
                    result.cancelled
                      ? "border-red-700 bg-red-900/20"
                      : result.percentage >= PASS_PERCENTAGE
                      ? "border-green-700 bg-green-900/10"
                      : "border-yellow-700 bg-yellow-900/10"
                  }`}>
                    {result.cancelled ? (
                      <>
                        <p className="text-4xl font-bold text-red-400">0%</p>
                        <p className="text-richblack-200 mt-1">Exam Cancelled — Cheating Detected</p>
                        <p className="text-sm text-red-400 font-semibold mt-2">🚫 Instructor has been notified</p>
                      </>
                    ) : (
                      <>
                        <p className={`text-4xl font-bold ${result.percentage >= PASS_PERCENTAGE ? "text-green-400" : "text-red-400"}`}>
                          {result.percentage}%
                        </p>
                        <p className="text-richblack-200 mt-1">{result.score} / {result.totalQuestions} correct</p>
                        {result.percentage >= PASS_PERCENTAGE ? (
                          <div className="mt-3">
                            <p className="text-green-400 font-bold text-lg">🎉 Passed!</p>
                            <p className="text-xs text-richblack-400 mt-1">You have successfully passed this exam. You cannot retake it.</p>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <p className="text-red-400 font-bold text-lg">❌ Failed</p>
                            <p className="text-xs text-richblack-400 mt-1">You scored below {PASS_PERCENTAGE}%. You can retake this exam.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Violations log if any */}
                  {violations.length > 0 && (
                    <div className="rounded-lg bg-red-900/20 border border-red-800 p-4">
                      <p className="text-xs font-semibold text-red-400 mb-2">⚠️ Violations during exam:</p>
                      {violations.map((v, i) => (
                        <p key={i} className="text-xs text-red-300">[{v.time}] {v.message}</p>
                      ))}
                    </div>
                  )}

                  {/* Detailed results (only if not cancelled) */}
                  {!result.cancelled && result.results?.map((r, i) => (
                    <div key={i} className={`rounded-lg border p-4 ${r.isCorrect ? "border-green-500/30 bg-green-900/10" : "border-pink-500/30 bg-pink-900/10"}`}>
                      <p className="text-sm font-medium text-richblack-5 mb-2">
                        {r.isCorrect ? "✅" : "❌"} Q{i + 1}. {r.questionText}
                      </p>
                      <div className="space-y-1">
                        {r.options.map((opt, oi) => (
                          <p key={oi} className={`text-xs px-3 py-1 rounded ${
                            oi === r.correctOption ? "text-green-400" :
                            oi === r.selectedOption && !r.isCorrect ? "text-pink-400" : "text-richblack-400"
                          }`}>
                            {String.fromCharCode(65 + oi)}. {opt}
                            {oi === r.correctOption && " ✓"}
                            {oi === r.selectedOption && !r.isCorrect && " (your answer)"}
                          </p>
                        ))}
                      </div>
                      {r.explanation && <p className="text-xs text-richblack-300 mt-2 italic">💡 {r.explanation}</p>}
                    </div>
                  ))}

                  <button
                    onClick={handleClose}
                    className="w-full border border-richblack-600 text-richblack-200 py-2 rounded-md hover:bg-richblack-700 transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen popup — blocks exam until student re-enters fullscreen */}
      {showFullscreenPopup && (
        <div className="fixed inset-0 z-[2000] grid place-items-center bg-black bg-opacity-90">
          <div className="flex flex-col items-center gap-5 rounded-xl border border-red-700 bg-richblack-800 p-8 text-center max-w-sm mx-4">
            <div className="text-6xl">🖥️</div>
            <p className="text-xl font-bold text-red-400">Fullscreen Required!</p>
            <p className="text-sm text-richblack-300">
              You exited fullscreen mode. The exam is paused. Please go back to fullscreen to continue.
            </p>
            <p className="text-xs text-yellow-300 font-semibold">
              ⚠️ Warning {warnings}/{MAX_WARNINGS} recorded
            </p>
            <button
              onClick={handleReenterFullscreen}
              className="w-full rounded-lg bg-yellow-50 text-richblack-900 py-3 font-bold text-sm hover:bg-yellow-25 transition-all"
            >
              🔲 Go Fullscreen & Resume Exam
            </button>
          </div>
        </div>
      )}
    </>
  )
}
