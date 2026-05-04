import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { apiConnector } from "../services/apiConnector"
import CourseCard from "../components/core/Catalog/Course_Card"
import { AiOutlineSearch } from "react-icons/ai"

export default function SearchPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = new URLSearchParams(location.search).get("q") || ""

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState(query)

  useEffect(() => {
    setSearchInput(query)
    if (!query.trim()) return
    fetchResults(query)
  }, [query])

  const fetchResults = async (q) => {
    setLoading(true)
    try {
      const BASE = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api/v1"
      const res = await apiConnector("GET", `${BASE}/course/search?q=${encodeURIComponent(q)}`)
      setResults(res.data.data || [])
    } catch (err) {
      console.error("Search error:", err)
      setResults([])
    }
    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-richblack-900 text-richblack-5 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <form onSubmit={handleSearch} className="mb-8 flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-richblack-600 bg-richblack-800 px-4 py-3">
            <AiOutlineSearch className="text-richblack-400" fontSize={22} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search courses by name..."
              className="flex-1 bg-transparent text-richblack-5 placeholder-richblack-400 outline-none text-base"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-yellow-50 px-6 py-3 font-semibold text-richblack-900 hover:bg-yellow-25 transition-all"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-richblack-600 border-t-yellow-50" />
          </div>
        ) : query && results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl font-semibold text-richblack-300">No courses found for "{query}"</p>
            <p className="mt-2 text-richblack-400">Try a different keyword</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="mb-6 text-richblack-300 text-sm">
              {results.length} result{results.length !== 1 ? "s" : ""} for <span className="text-yellow-50 font-semibold">"{query}"</span>
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((course) => (
                <CourseCard key={course._id} course={course} Height="h-[250px]" />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-richblack-400">
            Type something to search for courses
          </div>
        )}
      </div>
    </div>
  )
}