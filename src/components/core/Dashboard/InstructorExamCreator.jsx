import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { apiConnector } from "../../../services/apiConnector"
import { FEATURE_ENDPOINTS } from "../../../services/apis"
import { fetchInstructorCourses } from "../../../services/operations/courseDetailsAPI"
import { FiPlus, FiTrash2, FiCheck } from "react-icons/fi"

export default function InstructorExamCreator() {
  const { token } = useSelector((state) => state.auth)

  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: 30,
    questions: [
      {
        questionText: "",
        options: ["", "", "", ""],
        correctOption: 0,
        explanation: "",
      },
    ],
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Load instructor courses
  useEffect(() => {
    ;(async () => {
      const result = await fetchInstructorCourses(token)
      if (result && result.length > 0) {
        setCourses(result)
        setSelectedCourse(result[0]._id)
      }
    })()
  }, [])

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        {
          questionText: "",
          options: ["", "", "", ""],
          correctOption: 0,
          explanation: "",
        },
      ],
    })
  }

  const removeQuestion = (i) => {
    setForm({
      ...form,
      questions: form.questions.filter((_, idx) => idx !== i),
    })
  }

  const updateQuestion = (qi, field, value) => {
    const qs = [...form.questions]
    qs[qi][field] = value
    setForm({ ...form, questions: qs })
  }

  const updateOption = (qi, oi, value) => {
    const qs = [...form.questions]
    qs[qi].options[oi] = value
    setForm({ ...form, questions: qs })
  }

  const handleSubmit = async () => {
    if (!selectedCourse) return alert("Please select a course")
    if (!form.title.trim()) return alert("Please enter exam title")
    for (const q of form.questions) {
      if (!q.questionText.trim()) return alert("All questions must have text")
      if (q.options.some((o) => !o.trim())) return alert("All options must be filled")
    }

    setLoading(true)
    try {
      const res = await apiConnector(
        "POST",
        FEATURE_ENDPOINTS.CREATE_EXAM,
        {
          courseId: selectedCourse,
          ...form,
        },
        { Authorization: `Bearer ${token}` }
      )
      if (res?.data?.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        setForm({
          title: "",
          description: "",
          duration: 30,
          questions: [
            {
              questionText: "",
              options: ["", "", "", ""],
              correctOption: 0,
              explanation: "",
            },
          ],
        })
      }
    } catch (e) {
      console.log(e)
      alert("Failed to create exam. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <p className="text-2xl font-bold text-richblack-5">📝 Create Exam</p>

      {/* Course selector */}
      <div>
        <label className="text-sm text-richblack-300">Select Course *</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="mt-1 w-full rounded-lg bg-richblack-700 px-3 py-2 text-sm text-richblack-5 outline-none border border-richblack-600"
        >
          {courses.length === 0 && (
            <option value="">Loading courses...</option>
          )}
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.courseName}
            </option>
          ))}
        </select>
      </div>

      {/* Exam details */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-richblack-300">Exam Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Module 1 Assessment"
            className="w-full bg-richblack-700 text-richblack-5 text-sm rounded-md px-3 py-2 mt-1 outline-none border border-richblack-600"
          />
        </div>
        <div>
          <label className="text-sm text-richblack-300">Duration (minutes)</label>
          <input
            type="number"
            value={form.duration}
            onChange={(e) =>
              setForm({ ...form, duration: parseInt(e.target.value) || 30 })
            }
            className="w-full bg-richblack-700 text-richblack-5 text-sm rounded-md px-3 py-2 mt-1 outline-none border border-richblack-600"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-richblack-300">Description (optional)</label>
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description..."
          className="w-full bg-richblack-700 text-richblack-5 text-sm rounded-md px-3 py-2 mt-1 outline-none border border-richblack-600"
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {form.questions.map((q, qi) => (
          <div
            key={qi}
            className="bg-richblack-700 rounded-xl border border-richblack-600 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-richblack-5">
                Question {qi + 1}
              </p>
              {form.questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qi)}
                  className="text-pink-400 hover:text-pink-300"
                >
                  <FiTrash2 size={15} />
                </button>
              )}
            </div>

            <textarea
              value={q.questionText}
              onChange={(e) =>
                updateQuestion(qi, "questionText", e.target.value)
              }
              placeholder="Enter your question..."
              rows={2}
              className="w-full bg-richblack-600 text-richblack-5 text-sm rounded-md px-3 py-2 mb-3 outline-none resize-none"
            />

            <p className="text-xs text-richblack-400 mb-2">
              Options (click circle to mark correct answer)
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuestion(qi, "correctOption", oi)}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      q.correctOption === oi
                        ? "border-green-400 bg-green-400"
                        : "border-richblack-400 hover:border-richblack-200"
                    }`}
                  >
                    {q.correctOption === oi && (
                      <FiCheck size={10} className="text-richblack-900" />
                    )}
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    className="flex-1 bg-richblack-600 text-richblack-5 text-sm rounded-md px-3 py-1.5 outline-none"
                  />
                </div>
              ))}
            </div>

            <input
              value={q.explanation}
              onChange={(e) => updateQuestion(qi, "explanation", e.target.value)}
              placeholder="Explanation (optional, shown after submission)..."
              className="w-full bg-richblack-600 text-richblack-400 text-xs rounded-md px-3 py-2 mt-3 outline-none"
            />
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="flex items-center gap-2 text-sm text-yellow-50 hover:text-yellow-25 transition-all"
      >
        <FiPlus size={16} /> Add Another Question
      </button>

      <button
        onClick={handleSubmit}
        disabled={loading || !form.title.trim() || !selectedCourse}
        className={`w-full py-3 rounded-md font-semibold text-sm transition-all ${
          success
            ? "bg-green-500 text-white"
            : "bg-yellow-50 text-richblack-900 hover:bg-yellow-25 disabled:opacity-50"
        }`}
      >
        {loading ? "Creating..." : success ? "✅ Exam Created!" : "Create Exam"}
      </button>
    </div>
  )
}
