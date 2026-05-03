import React, { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import "video-react/dist/video-react.css"
import { useLocation } from "react-router-dom"
import { BigPlayButton, Player } from "video-react"

import { markLectureAsComplete } from "../../../services/operations/courseDetailsAPI"
import { updateCompletedLectures } from "../../../slices/viewCourseSlice"
import IconBtn from "../../Common/IconBtn"
import CourseReviewModal from "./CourseReviewModal"
import AIChatbot from "../../Common/AIChatbot"
import AINotesButton from "../../Common/AINotesButton"
import AIQuizButton from "../../Common/AIQuizButton"
import DoubtPanel from "../../Common/DoubtPanel"
import EmotionAIAssistant from "../../Common/EmotionAIAssistant"
import DiscussionSection from "../../Common/DiscussionSection"

export default function VideoDetails() {
  const { courseId, sectionId, subSectionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const playerRef = useRef(null)
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.profile)
  const { token } = useSelector((state) => state.auth)
  const { courseSectionData, courseEntireData, completedLectures } = useSelector(
    (state) => state.viewCourse
  )

  const [reviewModal, setReviewModal] = useState(false)
  const [videoData, setVideoData] = useState(null)
  const [previewSource, setPreviewSource] = useState("")
  const [videoEnded, setVideoEnded] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!courseSectionData?.length) return
    if (!courseId && !sectionId && !subSectionId) {
      navigate("/dashboard/enrolled-courses")
      return
    }
    const filteredData = courseSectionData?.filter((course) => course?._id === sectionId)
    const filteredVideoData = filteredData?.[0]?.subSection?.filter(
      (data) => data?._id === subSectionId
    )
    setVideoData(filteredVideoData?.[0] || null)
    setPreviewSource(courseEntireData?.thumbnail || "")
    setVideoEnded(false)
  }, [courseSectionData, courseEntireData, location.pathname])

  const isFirstVideo = () => {
    const currentSectionIndex = courseSectionData?.findIndex((data) => data?._id === sectionId)
    const currentSubSectionIndex = courseSectionData?.[currentSectionIndex]?.subSection?.findIndex(
      (data) => data?._id === subSectionId
    )
    return currentSectionIndex === 0 && currentSubSectionIndex === 0
  }

  const isLastVideo = () => {
    const currentSectionIndex = courseSectionData?.findIndex((data) => data?._id === sectionId)
    const noOfSubSections = courseSectionData?.[currentSectionIndex]?.subSection?.length
    const currentSubSectionIndex = courseSectionData?.[currentSectionIndex]?.subSection?.findIndex(
      (data) => data?._id === subSectionId
    )
    return (
      currentSectionIndex === courseSectionData?.length - 1 &&
      currentSubSectionIndex === noOfSubSections - 1
    )
  }

  const goToNextVideo = () => {
    const currentSectionIndex = courseSectionData?.findIndex((data) => data?._id === sectionId)
    const noOfSubSections = courseSectionData?.[currentSectionIndex]?.subSection?.length
    const currentSubSectionIndex = courseSectionData?.[currentSectionIndex]?.subSection?.findIndex(
      (data) => data?._id === subSectionId
    )
    if (currentSubSectionIndex !== noOfSubSections - 1) {
      const nextSubSectionId = courseSectionData?.[currentSectionIndex]?.subSection?.[currentSubSectionIndex + 1]?._id
      navigate(`/view-course/${courseId}/section/${sectionId}/sub-section/${nextSubSectionId}`)
    } else {
      const nextSectionId = courseSectionData?.[currentSectionIndex + 1]?._id
      const nextSubSectionId = courseSectionData?.[currentSectionIndex + 1]?.subSection?.[0]?._id
      navigate(`/view-course/${courseId}/section/${nextSectionId}/sub-section/${nextSubSectionId}`)
    }
  }

  const goToPrevVideo = () => {
    const currentSectionIndex = courseSectionData?.findIndex((data) => data?._id === sectionId)
    const currentSubSectionIndex = courseSectionData?.[currentSectionIndex]?.subSection?.findIndex(
      (data) => data?._id === subSectionId
    )
    if (currentSubSectionIndex !== 0) {
      const prevSubSectionId = courseSectionData?.[currentSectionIndex]?.subSection?.[currentSubSectionIndex - 1]?._id
      navigate(`/view-course/${courseId}/section/${sectionId}/sub-section/${prevSubSectionId}`)
    } else {
      const prevSectionId = courseSectionData?.[currentSectionIndex - 1]?._id
      const prevSubSections = courseSectionData?.[currentSectionIndex - 1]?.subSection
      const prevSubSectionId = prevSubSections?.[prevSubSections?.length - 1]?._id
      navigate(`/view-course/${courseId}/section/${prevSectionId}/sub-section/${prevSubSectionId}`)
    }
  }

  const handleLectureCompletion = async () => {
    setLoading(true)
    const res = await markLectureAsComplete({ courseId, subsectionId: subSectionId }, token)
    if (res) dispatch(updateCompletedLectures(subSectionId))
    setLoading(false)
  }

  const handlePauseVideo = () => {
    try { if (playerRef.current) playerRef.current.pause() } catch (e) {}
  }

  const handleResumeVideo = () => {
    try { if (playerRef.current) playerRef.current.play() } catch (e) {}
  }

  return (
    <>
      {reviewModal && <CourseReviewModal setReviewModal={setReviewModal} />}

      <div className="flex flex-col gap-5 text-white">

        {/* Video Player */}
        {!videoData ? (
          <img src={previewSource} alt="Preview" className="h-full w-full rounded-md object-cover" />
        ) : (
          <Player
            ref={playerRef}
            aspectRatio="16:9"
            playsInline
            autoPlay
            onEnded={() => setVideoEnded(true)}
            src={videoData?.videoUrl}
          >
            <BigPlayButton position="center" />
          </Player>
        )}

        {/* Video Ended Overlay */}
        {videoEnded && (
          <div
            style={{ backgroundImage: "linear-gradient(to top, rgb(0,0,0), rgba(0,0,0,0.3) 60%, rgba(0,0,0,0))" }}
            className="full absolute inset-0 z-[100] grid h-full place-content-center font-inter"
          >
            {!completedLectures?.includes(subSectionId) && (
              <IconBtn
                disabled={loading}
                onclick={handleLectureCompletion}
                text={!loading ? "Mark As Completed" : "Loading..."}
                customClasses="text-xl max-w-max px-4 mx-auto"
              />
            )}
            <IconBtn
              disabled={loading}
              onclick={() => { setVideoEnded(false); playerRef?.current?.seek(0) }}
              text="Rewatch"
              customClasses="text-xl max-w-max px-4 mx-auto mt-2"
            />
            <div className="mt-10 flex min-w-[250px] justify-center gap-x-4 text-xl">
              {!isFirstVideo() && (
                <button disabled={loading} onClick={goToPrevVideo} className="blackbutton">Prev</button>
              )}
              {!isLastVideo() && (
                <button disabled={loading} onClick={goToNextVideo} className="blackbutton">Next</button>
              )}
            </div>
          </div>
        )}

        {/* Video Title */}
        <h1 className="mt-4 text-3xl font-semibold">{videoData?.title}</h1>

        {/* AI Buttons */}
        {videoData && (
          <div className="flex flex-wrap gap-2">
            <AINotesButton
              videoTitle={videoData?.title}
              videoDescription={videoData?.description}
              subSectionId={subSectionId}
            />
            <AIQuizButton
              videoTitle={videoData?.title}
              subSectionId={subSectionId}
              courseId={courseId}
            />
            <EmotionAIAssistant
              videoTitle={videoData?.title || "Lecture"}
              subSectionId={subSectionId}
              courseContext={courseEntireData?.courseName || "Programming"}
              onPauseVideo={handlePauseVideo}
              onResumeVideo={handleResumeVideo}
            />
            <DoubtPanel courseId={courseId} />
          </div>
        )}

        {/* Description */}
        <p className="pt-2 pb-6">{videoData?.description}</p>

        {/* Discussion Section */}
        {videoData && (
          <DiscussionSection courseId={courseId} subSectionId={subSectionId} />
        )}

        {/* Prev / Next */}
        <div className="flex items-start gap-3 justify-end">
          {!isFirstVideo() && (
            <button onClick={goToPrevVideo} className="blackbutton">Prev</button>
          )}
          {!isLastVideo() && (
            <button onClick={goToNextVideo} className="blackbutton">Next</button>
          )}
        </div>

        {/* Add Review */}
        <div className="flex justify-end">
          <button onClick={() => setReviewModal(true)} className="yellowbutton">Add Review</button>
        </div>
      </div>

      {/* AI Chatbot - floating */}
      <AIChatbot
        courseContext={courseEntireData?.courseName || "Programming"}
        videoTitle={videoData?.title || "Lecture"}
        subSectionId={subSectionId}
      />
    </>
  )
}
