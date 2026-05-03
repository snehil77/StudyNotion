import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { apiConnector } from "../../../services/apiConnector"
import { FEATURE_ENDPOINTS } from "../../../services/apis"
import ReactMarkdown from "react-markdown"
import { RxCross2 } from "react-icons/rx"

export default function StudentProgressDashboard() {
  const { token } = useSelector((s) => s.auth)
  const { user } = useSelector((s) => s.profile)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  // ── Load enrolled courses from profile ──────────────────────
  useEffect(() => {
    const courses = user?.courses || []
    console.log("📚 [StudentProgressDashboard] user.courses:", courses)
    setEnrolledCourses(courses)
    if (courses.length > 0) {
      const firstId = courses[0]?._id || courses[0]
      console.log("📚 [StudentProgressDashboard] Setting selectedCourse:", firstId)
      setSelectedCourse(firstId)
    }
  }, [user])

  useEffect(() => {
    if (selectedCourse) fetchProgress()
  }, [selectedCourse])

  const fetchProgress = async () => {
    setLoading(true)
    setProgress(null)
    try {
      const BASE_URL = process.env.REACT_APP_BASE_URL
      const url = BASE_URL + "/feature/progress/student/" + selectedCourse
      console.log("🔍 [StudentProgressDashboard] selectedCourse:", selectedCourse)
      console.log("🔍 [StudentProgressDashboard] BASE_URL:", BASE_URL)
      console.log("🔍 [StudentProgressDashboard] Full URL:", url)

      const res = await apiConnector("GET", url, null, {
        Authorization: `Bearer ${token}`,
      })
      console.log("✅ [StudentProgressDashboard] API Response:", res?.data)
      if (res?.data?.success) setProgress(res.data.progress)
      else console.warn("⚠️ success false:", res?.data)
    } catch (e) {
      console.log("❌ [StudentProgressDashboard] fetch error:", e)
    }
    setLoading(false)
  }

  const fetchReport = async () => {
    setReportLoading(true)
    setReport(null)
    try {
      const BASE_URL = process.env.REACT_APP_BASE_URL
      const res = await apiConnector(
        "POST",
        BASE_URL + "/feature/progress/report",
        { courseId: selectedCourse, studentId: user?._id },
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) setReport(res.data.report)
    } catch (e) {
      console.log("❌ [StudentProgressDashboard] report error:", e)
    }
    setReportLoading(false)
  }

  const pct = progress?.progressPercent || 0
  const getColor = () => {
    if (pct >= 75) return "text-green-400"
    if (pct >= 40) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-richblack-5">📈 My Progress</h2>

      {/* Course selector */}
      <div>
        <label className="text-sm text-richblack-300">Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="mt-1 w-full rounded-lg bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none border border-richblack-600"
        >
          {enrolledCourses.length === 0 && (
            <option value="">No courses enrolled</option>
          )}
          {enrolledCourses.map((c) => {
            const id = c?._id || c
            const name = c?.courseName || c?.name || id || "Course"
            return <option key={id} value={id}>{name}</option>
          })}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-yellow-50 border-t-transparent" />
        </div>
      ) : progress ? (
        <>
          {/* Progress cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl bg-richblack-800 border border-richblack-600 p-5 text-center">
              <p className={`text-4xl font-bold ${getColor()}`}>{pct}%</p>
              <p className="text-xs text-richblack-400 mt-2">Course Progress</p>
            </div>
            <div className="rounded-xl bg-richblack-800 border border-richblack-600 p-5 text-center">
              <p className="text-4xl font-bold text-richblack-5">{progress.completedLectures || 0}</p>
              <p className="text-xs text-richblack-400 mt-2">Lectures Done</p>
            </div>
            <div className="rounded-xl bg-richblack-800 border border-richblack-600 p-5 text-center">
              <p className="text-4xl font-bold text-yellow-50">{progress.quizAttempts || 0}</p>
              <p className="text-xs text-richblack-400 mt-2">Quizzes Taken</p>
            </div>
            <div className="rounded-xl bg-richblack-800 border border-richblack-600 p-5 text-center">
              <p className="text-4xl font-bold text-blue-400">
                {progress.avgQuizScore != null ? `${progress.avgQuizScore}%` : "—"}
              </p>
              <p className="text-xs text-richblack-400 mt-2">Avg Quiz Score</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="rounded-xl bg-richblack-800 border border-richblack-600 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-richblack-5">Overall Progress</p>
              <span className={`text-sm font-bold ${getColor()}`}>{pct}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-richblack-600">
              <div
                className="h-3 rounded-full bg-yellow-50 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-richblack-400 mt-2">
              {progress.completedLectures || 0} of {progress.totalLectures || 0} lectures completed
            </p>
          </div>

          {/* Recent quiz scores */}
          {progress.recentQuizzes?.length > 0 && (
            <div className="rounded-xl bg-richblack-800 border border-richblack-600 p-5">
              <p className="text-sm font-semibold text-richblack-5 mb-3">Recent Quiz Results</p>
              <div className="space-y-2">
                {progress.recentQuizzes.map((q, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-richblack-300">{q.examTitle}</span>
                    <span className={`text-sm font-semibold ${q.score >= 70 ? "text-green-400" : "text-red-400"}`}>
                      {q.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Report button */}
          <button
            onClick={fetchReport}
            disabled={reportLoading}
            className="w-full rounded-xl bg-yellow-50 py-3 text-sm font-semibold text-richblack-900 hover:bg-yellow-25 disabled:opacity-50 transition-all"
          >
            {reportLoading ? "Generating AI Report..." : "📋 View My AI Progress Report"}
          </button>
        </>
      ) : (
        <div className="rounded-xl bg-richblack-800 p-10 text-center text-richblack-400">
          {enrolledCourses.length === 0
            ? "No courses enrolled yet."
            : "No progress data found for this course."}
        </div>
      )}

      {/* Report Modal */}
      {(reportLoading || report) && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-richblack-900 bg-opacity-80 backdrop-blur-sm">
          <div className="relative w-11/12 max-w-[700px] max-h-[80vh] rounded-xl border border-richblack-600 bg-richblack-800 flex flex-col">
            <div className="flex items-center justify-between rounded-t-xl bg-richblack-700 p-4">
              <p className="font-semibold text-richblack-5">📋 Your Progress Report</p>
              <button onClick={() => setReport(null)}>
                <RxCross2 className="text-xl text-richblack-400 hover:text-richblack-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 text-richblack-5 prose prose-invert max-w-none">
              {reportLoading ? (
                <div className="flex items-center gap-3 text-richblack-300 justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-50 border-t-transparent" />
                  AI is generating your personalized report...
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
