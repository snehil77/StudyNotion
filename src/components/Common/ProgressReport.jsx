import { useState } from "react"
import { useSelector } from "react-redux"
import { apiConnector } from "../../services/apiConnector"
import { FEATURE_ENDPOINTS } from "../../services/apis"
import ReactMarkdown from "react-markdown"
import { FiX, FiTrendingUp, FiZap, FiAward, FiClock, FiBook, FiShield, FiMessageCircle } from "react-icons/fi"

// ─── Helpers ──────────────────────────────────────────────────
function fmtSecs(secs) {
  const m = Math.floor((secs || 0) / 60)
  const s = (secs || 0) % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function fmtMins(mins) {
  if (!mins) return "0m"
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`
  return `${mins}m`
}

// ─── Heatmap ──────────────────────────────────────────────────
function ActivityHeatmap({ activityData = [] }) {
  const today = new Date()
  const cells = []
  for (let i = 51; i >= 0; i--) {
    const weekCells = []
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today)
      date.setDate(today.getDate() - (i * 7 + d))
      const dateStr = date.toISOString().split("T")[0]
      const found = activityData.find((a) => a.date === dateStr)
      weekCells.push({ dateStr, count: found?.count || 0 })
    }
    cells.push(weekCells)
  }
  const getColor = (c) => {
    if (c === 0) return "#1f2937"
    if (c === 1) return "#854d0e"
    if (c === 2) return "#a16207"
    if (c <= 4) return "#ca8a04"
    return "#eab308"
  }
  return (
    <div className="overflow-x-auto">
      <div style={{ display: "flex", gap: "3px" }}>
        {cells.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {week.map((cell, di) => (
              <div key={di} title={`${cell.dateStr}: ${cell.count}`}
                style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: getColor(cell.count), cursor: "default", transition: "transform 0.1s" }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.4)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Circle Progress ──────────────────────────────────────────
function CircleProgress({ pct = 0, size = 64, stroke = 6, color = "#eab308" }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2937" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill="#f5f5f5" fontSize={size * 0.2} fontWeight="bold">{pct}%</text>
    </svg>
  )
}

// ─── Exam Card ────────────────────────────────────────────────
function ExamCard({ exam, index, isBest }) {
  const isPassed = exam.percentage >= 40
  const isCancelled = exam.cancelled
  return (
    <div className={`relative rounded-xl border p-4 overflow-hidden ${isCancelled ? "border-red-700/50 bg-red-900/10" : "border-richblack-600 bg-richblack-700"}`}>
      {isBest && !isCancelled && (
        <span className="absolute top-2 right-2 text-[10px] font-bold bg-yellow-400 text-richblack-900 px-2 py-0.5 rounded-full">BEST</span>
      )}
      <p className="text-sm font-semibold text-richblack-100 truncate pr-14">{exam.exam?.title || `Exam ${index + 1}`}</p>
      <div className="mt-3 flex items-center gap-4">
        <div>
          <p className={`text-2xl font-bold ${isCancelled ? "text-red-400" : isPassed ? "text-green-400" : "text-pink-400"}`}>
            {isCancelled ? "0%" : `${exam.percentage}%`}
          </p>
          <p className="text-xs text-richblack-400">{exam.score}/{exam.totalQuestions} marks</p>
        </div>
        <div className="flex-1 h-2 rounded-full bg-richblack-600">
          <div className={`h-2 rounded-full transition-all duration-700 ${isCancelled ? "bg-red-500" : isPassed ? "bg-green-400" : "bg-pink-400"}`}
            style={{ width: isCancelled ? "100%" : `${exam.percentage}%` }} />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-md ${isCancelled ? "bg-red-400/10 text-red-400" : isPassed ? "bg-green-400/10 text-green-400" : "bg-pink-400/10 text-pink-400"}`}>
          {isCancelled ? "CANCEL" : isPassed ? "PASS" : "FAIL"}
        </span>
      </div>
      {exam.violations?.length > 0 && (
        <p className="text-xs text-red-400 mt-2">⚠️ {exam.violations.length} violation{exam.violations.length > 1 ? "s" : ""} detected</p>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function ProgressReport({ courseId }) {
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)

  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiReport, setAiReport] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const url = FEATURE_ENDPOINTS.GET_STUDENT_PROGRESS(courseId)
      const res = await apiConnector("GET", url, null, { Authorization: `Bearer ${token}` })
      if (res?.data?.success) setData(res.data)
    } catch (e) {
      console.log("ProgressReport fetch error:", e)
    }
    setLoading(false)
  }

  const handleOpen = () => {
    setIsOpen(true)
    if (!data) fetchProgress()
  }

  const generateAIReport = async () => {
    setAiLoading(true)
    setAiReport(null)
    try {
      const res = await apiConnector("POST", FEATURE_ENDPOINTS.GENERATE_PROGRESS_REPORT,
        { courseId },
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) setAiReport(res.data.report)
    } catch (e) {
      console.log("AI report error:", e)
    }
    setAiLoading(false)
  }

  // ── Derived values ──────────────────────────────────────────
  const completedVideos  = data?.courseProgress?.completedVideos || []
  const completedCount   = completedVideos.length
  const totalLectures    = data?.totalLectures || 0
  const lecturesPct      = totalLectures ? Math.round((completedCount / totalLectures) * 100) : 0
  const examResults      = data?.examResults || []
  const streak           = data?.streak || 0
  const weeklyLectures   = data?.weeklyLectures || 0
  const activityData     = data?.activityData || []
  const lastWatchedTitle = data?.lastWatchedTitle || "—"
  const watchTime        = data?.watchTime || {}
  const doubtTimestamps  = data?.doubtTimestamps || []
  const proctoring       = data?.proctoringReport || {}

  const validExams = examResults.filter((e) => !e.cancelled)
  const bestPct    = validExams.length ? Math.max(...validExams.map((e) => e.percentage)) : null
  const latestPct  = validExams.length ? validExams[validExams.length - 1].percentage : null
  const avgPct     = validExams.length
    ? Math.round(validExams.reduce((s, e) => s + e.percentage, 0) / validExams.length) : null

  const tabs = [
    { id: "overview",   label: "Overview",   icon: <FiBook size={12} /> },
    { id: "activity",   label: "Activity",   icon: <FiZap size={12} /> },
    { id: "watchtime",  label: "Watch Time", icon: <FiClock size={12} /> },
    { id: "doubts",     label: "Doubts",     icon: <FiMessageCircle size={12} /> },
    { id: "exams",      label: "Exams",      icon: <FiAward size={12} /> },
    { id: "proctor",    label: "Proctoring", icon: <FiShield size={12} /> },
    { id: "ai",         label: "AI Report",  icon: <FiTrendingUp size={12} /> },
  ]

  return (
    <>
      <button onClick={handleOpen}
        className="flex items-center gap-2 rounded-md bg-richblack-700 px-4 py-2 text-sm font-semibold text-richblack-5 hover:bg-richblack-600 transition-all">
        <FiTrendingUp size={16} /> My Progress
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-richblack-900 bg-opacity-80 backdrop-blur-sm">
          <div className="w-11/12 max-w-[750px] max-h-[90vh] rounded-2xl border border-richblack-600 bg-richblack-800 flex flex-col overflow-hidden shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between bg-richblack-700 px-5 py-4 rounded-t-2xl border-b border-richblack-600">
              <div className="flex items-center gap-2">
                <FiTrendingUp className="text-yellow-400" size={18} />
                <p className="font-bold text-richblack-5 text-base">My Progress</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-richblack-600 transition-colors">
                <FiX className="text-richblack-300 hover:text-richblack-5" size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-richblack-600 bg-richblack-800 px-3 pt-3 gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all whitespace-nowrap ${
                    activeTab === tab.id ? "bg-richblack-700 text-yellow-400 border-b-2 border-yellow-400" : "text-richblack-400 hover:text-richblack-200"
                  }`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
                  <p className="text-richblack-400 text-sm">Loading your progress...</p>
                </div>
              ) : !data ? (
                <p className="text-richblack-400 text-sm text-center py-16">No progress data yet. Start watching lectures!</p>
              ) : (
                <>
                  {/* ── OVERVIEW ── */}
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-richblack-700 rounded-xl p-4 text-center border border-richblack-600">
                          <CircleProgress pct={lecturesPct} />
                          <p className="text-xs text-richblack-400 mt-2">Course Done</p>
                        </div>
                        <div className="bg-richblack-700 rounded-xl p-4 text-center border border-richblack-600">
                          <p className="text-3xl font-bold text-richblack-5">{completedCount}</p>
                          <p className="text-xs text-richblack-400 mt-1">of {totalLectures} lectures</p>
                        </div>
                        <div className="bg-richblack-700 rounded-xl p-4 text-center border border-richblack-600">
                          <p className="text-3xl font-bold text-blue-400">{doubtTimestamps.length}</p>
                          <p className="text-xs text-richblack-400 mt-1">Doubts Asked</p>
                        </div>
                        <div className="bg-richblack-700 rounded-xl p-4 text-center border border-richblack-600">
                          <p className="text-3xl font-bold text-purple-400">{examResults.length}</p>
                          <p className="text-xs text-richblack-400 mt-1">Exams Taken</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-richblack-700 rounded-xl p-4 border border-richblack-600 flex items-center gap-3">
                          <FiClock className="text-yellow-400 shrink-0" size={20} />
                          <div>
                            <p className="text-xs text-richblack-400">Watch Time</p>
                            <p className="text-sm font-semibold text-richblack-5">{fmtMins(watchTime.totalMinutes || data?.timeSpentMinutes)}</p>
                          </div>
                        </div>
                        <div className="bg-richblack-700 rounded-xl p-4 border border-richblack-600 flex items-center gap-3 md:col-span-2">
                          <FiBook className="text-blue-400 shrink-0" size={20} />
                          <div className="min-w-0">
                            <p className="text-xs text-richblack-400">Last Watched</p>
                            <p className="text-sm font-semibold text-richblack-5 truncate">{lastWatchedTitle}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-richblack-700 rounded-xl p-4 border border-richblack-600">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-semibold text-richblack-300">Overall Completion</p>
                          <span className="text-xs font-bold text-yellow-400">{lecturesPct}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-richblack-600">
                          <div className="h-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-700" style={{ width: `${lecturesPct}%` }} />
                        </div>
                        <p className="text-xs text-richblack-500 mt-1.5">{completedCount} of {totalLectures} lectures completed</p>
                      </div>
                      {examResults.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                          {[["Best", bestPct, "text-green-400"], ["Latest", latestPct, "text-yellow-400"], ["Average", avgPct, "text-blue-400"]].map(([label, val, color]) => (
                            <div key={label} className="bg-richblack-700 rounded-xl p-3 text-center border border-richblack-600">
                              <p className={`text-xl font-bold ${color}`}>{val != null ? `${val}%` : "—"}</p>
                              <p className="text-xs text-richblack-400 mt-1">{label} Exam</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── ACTIVITY ── */}
                  {activeTab === "activity" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-richblack-700 rounded-xl p-4 border border-richblack-600 text-center">
                          <div className="text-3xl mb-1">🔥</div>
                          <p className="text-3xl font-bold text-orange-400">{streak}</p>
                          <p className="text-xs text-richblack-400 mt-1">Day Streak</p>
                        </div>
                        <div className="bg-richblack-700 rounded-xl p-4 border border-richblack-600 text-center">
                          <div className="text-3xl mb-1">📅</div>
                          <p className="text-3xl font-bold text-cyan-400">{weeklyLectures}</p>
                          <p className="text-xs text-richblack-400 mt-1">This Week</p>
                        </div>
                      </div>
                      <div className="bg-richblack-700 rounded-xl p-4 border border-richblack-600">
                        <p className="text-xs font-semibold text-richblack-300 mb-3">Learning Activity (Last 52 Weeks)</p>
                        <ActivityHeatmap activityData={activityData} />
                        <div className="flex items-center gap-2 mt-3 justify-end">
                          <span className="text-xs text-richblack-500">Less</span>
                          {["#1f2937","#854d0e","#a16207","#ca8a04","#eab308"].map((c, i) => (
                            <div key={i} style={{ width: 11, height: 11, backgroundColor: c, borderRadius: 2 }} />
                          ))}
                          <span className="text-xs text-richblack-500">More</span>
                        </div>
                      </div>
                      <div className={`rounded-xl p-4 border text-center ${streak >= 7 ? "bg-orange-400/10 border-orange-400/30 text-orange-300" : streak >= 3 ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-300" : "bg-richblack-700 border-richblack-600 text-richblack-400"}`}>
                        <p className="text-sm font-semibold">
                          {streak >= 7 ? `🎉 ${streak} days! You're on fire!` : streak >= 3 ? `💪 ${streak} day streak! Keep pushing!` : streak >= 1 ? `✅ ${streak} day streak. Build the habit!` : "Start your streak — learn something today! 📚"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── WATCH TIME ── */}
                  {activeTab === "watchtime" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-richblack-700 rounded-xl p-4 border border-richblack-600 text-center">
                          <p className="text-3xl font-bold text-yellow-400">{fmtMins(watchTime.totalMinutes || data?.timeSpentMinutes)}</p>
                          <p className="text-xs text-richblack-400 mt-1">Total Watch Time</p>
                        </div>
                        <div className="bg-richblack-700 rounded-xl p-4 border border-richblack-600 text-center">
                          <p className="text-3xl font-bold text-richblack-5">{watchTime.lectureWatchTime?.length || 0}</p>
                          <p className="text-xs text-richblack-400 mt-1">Lectures Watched</p>
                        </div>
                      </div>
                      {watchTime.lectureWatchTime?.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-richblack-300">Per Lecture Breakdown</p>
                          {watchTime.lectureWatchTime.map((lec, i) => (
                            <div key={i} className="bg-richblack-700 rounded-lg border border-richblack-600 p-3">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-richblack-100 truncate flex-1">{lec.title}</p>
                                <span className="text-xs font-bold text-yellow-400 ml-2">{fmtMins(lec.totalMinutes)}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-richblack-400">
                                <span>📍 Last at: {fmtSecs(lec.lastTimestamp)}</span>
                                <span>🔄 {lec.sessionCount} session{lec.sessionCount !== 1 ? "s" : ""}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-richblack-400 text-sm text-center py-8">Watch time tracking will appear after your next video session.</p>
                      )}
                    </div>
                  )}

                  {/* ── DOUBTS ── */}
                  {activeTab === "doubts" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-richblack-300">Doubts Asked During Videos</p>
                        <span className="text-xs bg-richblack-700 text-richblack-200 px-2 py-1 rounded-full">{doubtTimestamps.length} total</span>
                      </div>
                      {doubtTimestamps.length === 0 ? (
                        <p className="text-richblack-400 text-sm text-center py-8">No doubts asked yet.</p>
                      ) : (
                        doubtTimestamps.map((d, i) => (
                          <div key={i} className="bg-richblack-700 rounded-xl border border-richblack-600 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-mono">
                                ⏱ {d.videoTimestampFormatted}
                              </span>
                              <span className="text-xs text-richblack-400 truncate">{d.lectureTitle}</span>
                            </div>
                            <p className="text-sm font-medium text-richblack-100">❓ {d.question}</p>
                            {d.answer && (
                              <p className="text-xs text-richblack-300 mt-2 border-t border-richblack-600 pt-2">
                                💡 {d.answer.slice(0, 200)}{d.answer.length > 200 ? "..." : ""}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* ── EXAMS ── */}
                  {activeTab === "exams" && (
                    <div className="space-y-4">
                      {examResults.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-4xl mb-3">🎓</p>
                          <p className="text-richblack-400 text-sm">No exams taken yet.</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-3">
                            {[["Best", bestPct, "text-green-400"], ["Latest", latestPct, "text-yellow-400"], ["Average", avgPct, "text-blue-400"]].map(([label, val, color]) => (
                              <div key={label} className="bg-richblack-700 rounded-xl p-3 text-center border border-richblack-600">
                                <p className={`text-xl font-bold ${color}`}>{val != null ? `${val}%` : "—"}</p>
                                <p className="text-xs text-richblack-400 mt-1">{label} Score</p>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-3">
                            {examResults.map((exam, i) => (
                              <ExamCard key={i} exam={exam} index={i} isBest={!exam.cancelled && exam.percentage === bestPct} />
                            ))}
                          </div>
                          <div className="bg-richblack-700 rounded-xl p-4 border border-richblack-600">
                            <p className="text-xs font-semibold text-richblack-300 mb-2">Pass Rate</p>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 rounded-full bg-richblack-600">
                                <div className="h-2 rounded-full bg-green-400 transition-all duration-700"
                                  style={{ width: `${Math.round((examResults.filter((e) => e.passed).length / examResults.length) * 100)}%` }} />
                              </div>
                              <span className="text-sm font-bold text-green-400 whitespace-nowrap">
                                {examResults.filter((e) => e.passed).length}/{examResults.length} passed
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── PROCTORING ── */}
                  {activeTab === "proctor" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          ["Total Exams", proctoring.totalExams || 0, "text-richblack-5"],
                          ["Passed", proctoring.totalPassed || 0, "text-green-400"],
                          ["Cancelled", proctoring.totalCancelled || 0, "text-red-400"],
                          ["Violations", Object.values(proctoring.violationCounts || {}).reduce((a,b)=>a+b,0), "text-yellow-400"],
                        ].map(([label, val, color]) => (
                          <div key={label} className="bg-richblack-700 rounded-xl p-3 text-center border border-richblack-600">
                            <p className={`text-2xl font-bold ${color}`}>{val}</p>
                            <p className="text-xs text-richblack-400 mt-1">{label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Violation breakdown */}
                      {proctoring.violationCounts && Object.values(proctoring.violationCounts).some(v => v > 0) ? (
                        <div className="bg-richblack-700 rounded-xl border border-richblack-600 p-4">
                          <p className="text-xs font-semibold text-richblack-300 mb-3">Violation Breakdown</p>
                          <div className="space-y-2">
                            {[
                              ["Tab Switch", proctoring.violationCounts.tabSwitch, "🖥️"],
                              ["No Face Detected", proctoring.violationCounts.noFace, "👤"],
                              ["Multiple Faces", proctoring.violationCounts.multipleFaces, "👥"],
                              ["Background Noise", proctoring.violationCounts.noise, "🔊"],
                              ["Fullscreen Exit", proctoring.violationCounts.fullscreenExit, "📺"],
                            ].filter(([,count]) => count > 0).map(([label, count, icon]) => (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-sm text-richblack-200">{icon} {label}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-1.5 rounded-full bg-richblack-600">
                                    <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${Math.min((count / 10) * 100, 100)}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-red-400 w-4 text-right">{count}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 text-center">
                          <p className="text-3xl mb-2">✅</p>
                          <p className="text-sm font-semibold text-green-400">No violations recorded</p>
                          <p className="text-xs text-richblack-400 mt-1">Great academic integrity!</p>
                        </div>
                      )}

                      {/* Per-exam violation log */}
                      {proctoring.examViolations?.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-richblack-300">Exam-wise Violation Log</p>
                          {proctoring.examViolations.map((ev, i) => (
                            <div key={i} className="bg-red-900/10 border border-red-800/40 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-red-300">{ev.examTitle}</p>
                                {ev.cancelled && <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">CANCELLED</span>}
                              </div>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {ev.violations.map((v, vi) => (
                                  <p key={vi} className="text-xs text-red-400">
                                    [{v.time}] {v.message}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── AI REPORT ── */}
                  {activeTab === "ai" && (
                    <div className="space-y-4">
                      {!aiReport && !aiLoading && (
                        <div className="text-center py-8">
                          <p className="text-5xl mb-4">🤖</p>
                          <p className="text-richblack-200 font-semibold text-base mb-1">AI Progress Report</p>
                          <p className="text-richblack-400 text-sm mb-6">
                            Get a personalized analysis — strengths, weaknesses, integrity score, and recommendations.
                          </p>
                          <button onClick={generateAIReport}
                            className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-richblack-900 hover:bg-yellow-300 transition-all">
                            Generate AI Report
                          </button>
                        </div>
                      )}
                      {aiLoading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
                          <p className="text-richblack-400 text-sm">AI is analyzing your progress...</p>
                        </div>
                      )}
                      {aiReport && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-richblack-200">📋 Your Personalized Report</p>
                            <button onClick={generateAIReport} disabled={aiLoading}
                              className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold">
                              Regenerate ↻
                            </button>
                          </div>
                          <div className="rounded-xl bg-richblack-700 border border-richblack-600 p-5 prose prose-invert prose-sm max-w-none text-richblack-200">
                            <ReactMarkdown>{aiReport}</ReactMarkdown>
                          </div>
                          <p className="text-xs text-richblack-500 text-center">Powered by Groq AI</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
