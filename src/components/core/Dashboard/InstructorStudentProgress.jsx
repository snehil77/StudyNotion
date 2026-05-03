import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { apiConnector } from "../../../services/apiConnector"
import { FEATURE_ENDPOINTS } from "../../../services/apis"
import { fetchInstructorCourses } from "../../../services/operations/courseDetailsAPI"
import ReactMarkdown from "react-markdown"
import { VscGraph } from "react-icons/vsc"
import { RxCross2 } from "react-icons/rx"
import { FiShield, FiClock, FiAlertTriangle, FiChevronDown, FiChevronUp } from "react-icons/fi"

function fmtMins(mins) {
  if (!mins) return "0m"
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`
  return `${mins}m`
}

// ── Violation Badge ───────────────────────────────────────────
function ViolationBadge({ count, cancelled }) {
  if (cancelled) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full">
      🚫 Cancelled
    </span>
  )
  if (!count) return <span className="text-richblack-500 text-xs">—</span>
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
      count >= 3 ? "bg-red-900/40 text-red-400" : "bg-yellow-900/40 text-yellow-400"
    }`}>
      ⚠️ {count}
    </span>
  )
}

// ── Expanded Student Row ──────────────────────────────────────
function StudentDetailRow({ s, onGenerateReport }) {
  const [expanded, setExpanded] = useState(false)

  const totalViolations = s.totalViolations || 0
  const cancelledExams = s.cancelledExams || 0

  return (
    <>
      <tr className="hover:bg-richblack-700/50 transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
        {/* Student */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <img
              src={s.image || `https://api.dicebear.com/5.x/initials/svg?seed=${s.firstName}`}
              alt="" className="h-8 w-8 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium text-richblack-5">{s.firstName} {s.lastName}</p>
              <p className="text-xs text-richblack-400">{s.email}</p>
            </div>
            <span className="ml-1 text-richblack-500">
              {expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </span>
          </div>
        </td>

        {/* Progress */}
        <td className="px-4 py-3">
          <div className="w-28">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-richblack-300">{s.progressPercent || 0}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-richblack-600">
              <div
                className={`h-2 rounded-full transition-all ${
                  (s.progressPercent || 0) >= 75 ? "bg-green-500" :
                  (s.progressPercent || 0) >= 40 ? "bg-yellow-400" : "bg-red-500"
                }`}
                style={{ width: `${s.progressPercent || 0}%` }}
              />
            </div>
          </div>
        </td>

        {/* Lectures */}
        <td className="px-4 py-3 text-sm text-richblack-200">
          {s.completedLectures || 0} / {s.totalLectures || 0}
        </td>

        {/* Watch Time */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 text-sm text-cyan-400">
            <FiClock size={13} />
            {fmtMins(s.totalWatchMinutes)}
          </div>
        </td>

        {/* Exam Score */}
        <td className="px-4 py-3 text-sm">
          {s.avgExamScore != null ? (
            <span className={s.avgExamScore >= 40 ? "text-green-400" : "text-red-400"}>
              {s.avgExamScore}%
            </span>
          ) : (
            <span className="text-richblack-500">—</span>
          )}
        </td>

        {/* Violations */}
        <td className="px-4 py-3">
          <ViolationBadge count={totalViolations} cancelled={cancelledExams > 0} />
        </td>

        {/* Report */}
        <td className="px-4 py-3">
          <button
            onClick={(e) => { e.stopPropagation(); onGenerateReport(s.studentId) }}
            className="flex items-center gap-1 rounded-lg bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-richblack-900 hover:bg-yellow-25 transition-all"
          >
            <VscGraph size={13} /> AI Report
          </button>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-richblack-700/30">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Watch Time Breakdown */}
              <div className="bg-richblack-700 rounded-xl border border-richblack-600 p-4">
                <p className="text-xs font-semibold text-richblack-300 mb-3 flex items-center gap-1">
                  <FiClock size={12} /> Watch Time
                </p>
                <p className="text-2xl font-bold text-cyan-400">{fmtMins(s.totalWatchMinutes)}</p>
                <p className="text-xs text-richblack-400 mt-1">Total watch time</p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-richblack-400">Lectures completed</span>
                    <span className="text-richblack-200">{s.completedLectures}/{s.totalLectures}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-richblack-400">Avg per lecture</span>
                    <span className="text-richblack-200">
                      {s.completedLectures > 0 ? fmtMins(Math.round((s.totalWatchMinutes || 0) / s.completedLectures)) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exam Performance */}
              <div className="bg-richblack-700 rounded-xl border border-richblack-600 p-4">
                <p className="text-xs font-semibold text-richblack-300 mb-3 flex items-center gap-1">
                  <VscGraph size={12} /> Exam Performance
                </p>
                {s.examScores?.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {s.examScores.map((exam, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-richblack-300 truncate flex-1">{exam.examTitle}</span>
                        <div className="flex items-center gap-1 ml-2">
                          {exam.cancelled ? (
                            <span className="text-xs text-red-400 font-bold">🚫 0%</span>
                          ) : (
                            <span className={`text-xs font-bold ${exam.passed ? "text-green-400" : "text-red-400"}`}>
                              {exam.score}%
                            </span>
                          )}
                          {exam.violations?.length > 0 && (
                            <span className="text-xs text-yellow-400">⚠️{exam.violations.length}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-richblack-500">No exams attempted</p>
                )}
              </div>

              {/* Proctoring Report */}
              <div className="bg-richblack-700 rounded-xl border border-richblack-600 p-4">
                <p className="text-xs font-semibold text-richblack-300 mb-3 flex items-center gap-1">
                  <FiShield size={12} /> Proctoring
                </p>
                {totalViolations === 0 && cancelledExams === 0 ? (
                  <div className="text-center py-2">
                    <p className="text-2xl">✅</p>
                    <p className="text-xs text-green-400 mt-1">No violations</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cancelledExams > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-red-400">🚫 Cancelled exams</span>
                        <span className="font-bold text-red-400">{cancelledExams}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-yellow-400">⚠️ Total violations</span>
                      <span className="font-bold text-yellow-400">{totalViolations}</span>
                    </div>
                    {/* Per-exam violation log */}
                    {s.examScores?.filter(e => e.violations?.length > 0).map((exam, i) => (
                      <div key={i} className="mt-2 border-t border-richblack-600 pt-2">
                        <p className="text-xs text-richblack-400 mb-1">{exam.examTitle}</p>
                        <div className="max-h-20 overflow-y-auto space-y-0.5">
                          {exam.violations.map((v, vi) => (
                            <p key={vi} className="text-[10px] text-red-400">
                              [{v.time}] {v.message}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function InstructorStudentsProgress() {
  const { token } = useSelector((s) => s.auth)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [progressData, setProgressData] = useState([])
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [filter, setFilter] = useState("all") // all | at-risk | violations

  useEffect(() => {
    ;(async () => {
      const result = await fetchInstructorCourses(token)
      if (result) {
        setCourses(result)
        if (result.length > 0) setSelectedCourse(result[0]._id)
      }
    })()
  }, [])

  useEffect(() => {
    if (selectedCourse) fetchProgress()
  }, [selectedCourse])

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const res = await apiConnector(
        "GET",
        `${FEATURE_ENDPOINTS.GET_COURSE_STUDENTS_PROGRESS}/${selectedCourse}`,
        null,
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) setProgressData(res.data.students || [])
    } catch (e) { console.log(e) }
    setLoading(false)
  }

  const generateReport = async (studentId) => {
    setSelectedStudent(studentId)
    setReportLoading(true)
    setReport(null)
    try {
      const res = await apiConnector("POST", FEATURE_ENDPOINTS.GENERATE_PROGRESS_REPORT, {
        courseId: selectedCourse,
        studentId,
      }, { Authorization: `Bearer ${token}` })
      if (res?.data?.success) setReport(res.data.report)
    } catch (e) { console.log(e) }
    setReportLoading(false)
  }

  // Filtered list
  const filteredData = progressData.filter((s) => {
    if (filter === "at-risk") return (s.progressPercent || 0) < 40
    if (filter === "violations") return (s.totalViolations || 0) > 0 || (s.cancelledExams || 0) > 0
    return true
  })

  const totalViolationsAll = progressData.reduce((sum, s) => sum + (s.totalViolations || 0), 0)
  const atRiskCount = progressData.filter((s) => (s.progressPercent || 0) < 40).length
  const withViolations = progressData.filter((s) => (s.totalViolations || 0) > 0).length

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-richblack-5">📊 Student Progress</h2>

      {/* Course selector */}
      <div>
        <label className="text-sm text-richblack-300">Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="mt-1 w-full rounded-lg bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none border border-richblack-600"
        >
          {courses.map((c) => (<option key={c._id} value={c._id}>{c.courseName}</option>))}
        </select>
      </div>

      {/* Stats summary */}
      {progressData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-xl bg-richblack-800 border border-richblack-600 p-4 text-center">
            <p className="text-3xl font-bold text-yellow-50">{progressData.length}</p>
            <p className="text-xs text-richblack-400 mt-1">Total Students</p>
          </div>
          <div className="rounded-xl bg-richblack-800 border border-richblack-600 p-4 text-center">
            <p className="text-3xl font-bold text-green-400">
              {progressData.filter((s) => s.progressPercent >= 75).length}
            </p>
            <p className="text-xs text-richblack-400 mt-1">On Track (75%+)</p>
          </div>
          <div className="rounded-xl bg-richblack-800 border border-richblack-600 p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{atRiskCount}</p>
            <p className="text-xs text-richblack-400 mt-1">At Risk (&lt;40%)</p>
          </div>
          <div className="rounded-xl bg-richblack-800 border border-richblack-600 p-4 text-center">
            <p className="text-3xl font-bold text-cyan-400">
              {fmtMins(Math.round(progressData.reduce((s, st) => s + (st.totalWatchMinutes || 0), 0) / (progressData.length || 1)))}
            </p>
            <p className="text-xs text-richblack-400 mt-1">Avg Watch Time</p>
          </div>
          <div className="rounded-xl bg-richblack-800 border border-richblack-600 p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{totalViolationsAll}</p>
            <p className="text-xs text-richblack-400 mt-1">Total Violations</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {progressData.length > 0 && (
        <div className="flex gap-2">
          {[
            { id: "all", label: `All (${progressData.length})` },
            { id: "at-risk", label: `⚠️ At Risk (${atRiskCount})` },
            { id: "violations", label: `🚫 Violations (${withViolations})` },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.id
                  ? "bg-yellow-50 text-richblack-900"
                  : "bg-richblack-700 text-richblack-300 hover:bg-richblack-600"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Students table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-50 border-t-transparent" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="rounded-xl bg-richblack-800 p-10 text-center text-richblack-400">
          {progressData.length === 0 ? "No enrolled students found" : "No students match this filter"}
        </div>
      ) : (
        <div className="rounded-xl border border-richblack-600 bg-richblack-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-richblack-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-richblack-300">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-richblack-300">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-richblack-300">Lectures</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-richblack-300">
                  <span className="flex items-center gap-1"><FiClock size={11} /> Watch Time</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-richblack-300">Exam Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-richblack-300">
                  <span className="flex items-center gap-1"><FiShield size={11} /> Violations</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-richblack-300">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-richblack-700">
              {filteredData.map((s) => (
                <StudentDetailRow key={s.studentId} s={s} onGenerateReport={generateReport} />
              ))}
            </tbody>
          </table>
          <p className="text-xs text-richblack-500 text-center py-2">Click a row to expand details</p>
        </div>
      )}

      {/* Report Modal */}
      {(reportLoading || report) && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-richblack-900 bg-opacity-80 backdrop-blur-sm">
          <div className="relative w-11/12 max-w-[700px] max-h-[80vh] rounded-xl border border-richblack-600 bg-richblack-800 flex flex-col">
            <div className="flex items-center justify-between rounded-t-xl bg-richblack-700 p-4">
              <p className="font-semibold text-richblack-5 flex items-center gap-2">
                <VscGraph size={18} /> AI Progress Report
              </p>
              <button onClick={() => { setReport(null); setSelectedStudent(null) }}>
                <RxCross2 className="text-xl text-richblack-400 hover:text-richblack-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 text-richblack-5 prose prose-invert max-w-none">
              {reportLoading ? (
                <div className="flex items-center gap-3 text-richblack-300 justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-50 border-t-transparent" />
                  Generating AI report...
                </div>
              ) : (
                <ReactMarkdown>{report}</ReactMarkdown>
              )}
            </div>
            <div className="p-3 border-t border-richblack-700 text-center text-xs text-richblack-400">
              Powered by Groq AI
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
