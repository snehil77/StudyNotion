import { useEffect, useState } from "react"
import ProgressBar from "@ramonak/react-progress-bar"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { MdVideoCall } from "react-icons/md"

import { getUserEnrolledCourses } from "../../../services/operations/profileAPI"
import { liveClassService } from "../../../services/liveClassService"

export default function EnrolledCourses() {
  const { token } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  const [enrolledCourses, setEnrolledCourses] = useState(null)
  const [liveRooms, setLiveRooms] = useState({}) // courseId -> roomId

  useEffect(() => {
    ;(async () => {
      try {
        const res = await getUserEnrolledCourses(token)
        const filterPublishCourse = res.filter((ele) => ele.status !== "Draft")
        setEnrolledCourses(filterPublishCourse)

        // Check live rooms for each course
        const rooms = {}
        await Promise.all(
          filterPublishCourse.map(async (course) => {
            try {
              const activeRooms = await liveClassService.getActiveRooms({
                courseId: course._id,
                token,
              })
              if (activeRooms && activeRooms.length > 0) {
                rooms[course._id] = activeRooms[0].roomId
              }
            } catch (_) {}
          })
        )
        setLiveRooms(rooms)
      } catch (error) {
        console.log("Could not fetch enrolled courses.")
      }
    })()
  }, [])

  // Poll every 15 seconds for live rooms
  useEffect(() => {
    if (!enrolledCourses) return
    const interval = setInterval(async () => {
      const rooms = {}
      await Promise.all(
        enrolledCourses.map(async (course) => {
          try {
            const activeRooms = await liveClassService.getActiveRooms({
              courseId: course._id,
              token,
            })
            if (activeRooms && activeRooms.length > 0) {
              rooms[course._id] = activeRooms[0].roomId
            }
          } catch (_) {}
        })
      )
      setLiveRooms(rooms)
    }, 15000)
    return () => clearInterval(interval)
  }, [enrolledCourses])

  return (
    <>
      <div className="text-3xl text-richblack-50">Enrolled Courses</div>
      {!enrolledCourses ? (
        <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
          <div className="spinner"></div>
        </div>
      ) : !enrolledCourses.length ? (
        <p className="grid h-[10vh] w-full place-content-center text-richblack-5">
          You have not enrolled in any course yet.
        </p>
      ) : (
        <div className="my-8 text-richblack-5">
          {/* Headings */}
          <div className="flex rounded-t-lg bg-richblack-500">
            <p className="w-[40%] px-5 py-3">Course Name</p>
            <p className="w-1/4 px-2 py-3">Duration</p>
            <p className="w-1/5 px-2 py-3">Progress</p>
            <p className="flex-1 px-2 py-3">Live</p>
          </div>

          {enrolledCourses.map((course, i, arr) => (
            <div
              className={`flex items-center border border-richblack-700 ${
                i === arr.length - 1 ? "rounded-b-lg" : "rounded-none"
              }`}
              key={i}
            >
              {/* Course Info */}
              <div
                className="flex w-[40%] cursor-pointer items-center gap-4 px-5 py-3"
                onClick={() =>
                  navigate(
                    `/view-course/${course?._id}/section/${course.courseContent?.[0]?._id}/sub-section/${course.courseContent?.[0]?.subSection?.[0]?._id}`
                  )
                }
              >
                <img
                  src={course.thumbnail}
                  alt="course_img"
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="flex max-w-xs flex-col gap-2">
                  <p className="font-semibold">{course.courseName}</p>
                  <p className="text-xs text-richblack-300">
                    {course.courseDescription.length > 50
                      ? `${course.courseDescription.slice(0, 50)}...`
                      : course.courseDescription}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="w-1/4 px-2 py-3">{course?.totalDuration}</div>

              {/* Progress */}
              <div className="flex w-1/5 flex-col gap-2 px-2 py-3">
                <p>Progress: {course.progressPercentage || 0}%</p>
                <ProgressBar
                  completed={course.progressPercentage || 0}
                  height="8px"
                  isLabelVisible={false}
                />
              </div>

              {/* Live Class Button */}
              <div className="flex-1 px-2 py-3">
                {liveRooms[course._id] ? (
                  <button
                    onClick={() => navigate(`/live/${liveRooms[course._id]}`)}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white animate-pulse hover:animate-none hover:bg-green-500 transition-all"
                  >
                    <MdVideoCall size={20} />
                    Join Live
                  </button>
                ) : (
                  <span className="text-xs text-richblack-400">No live class</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
