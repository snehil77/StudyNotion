const BASE_URL = process.env.REACT_APP_BASE_URL

// AUTH ENDPOINTS
export const endpoints = {
  SENDOTP_API: BASE_URL + "/auth/sendotp",
  SIGNUP_API: BASE_URL + "/auth/signup",
  LOGIN_API: BASE_URL + "/auth/login",
  RESETPASSTOKEN_API: BASE_URL + "/auth/reset-password-token",
  RESETPASSWORD_API: BASE_URL + "/auth/reset-password",
}

// PROFILE ENDPOINTS
export const profileEndpoints = {
  GET_USER_DETAILS_API: BASE_URL + "/profile/getUserDetails",
  GET_USER_ENROLLED_COURSES_API: BASE_URL + "/profile/getEnrolledCourses",
  GET_INSTRUCTOR_DATA_API: BASE_URL + "/profile/instructorDashboard",
}

// STUDENTS ENDPOINTS
export const studentEndpoints = {
  COURSE_PAYMENT_API: BASE_URL + "/payment/capturePayment",
  COURSE_VERIFY_API: BASE_URL + "/payment/verifyPayment",
  SEND_PAYMENT_SUCCESS_EMAIL_API: BASE_URL + "/payment/sendPaymentSuccessEmail",
}

// COURSE ENDPOINTS
export const courseEndpoints = {
  GET_ALL_COURSE_API: BASE_URL + "/course/getAllCourses",
  COURSE_DETAILS_API: BASE_URL + "/course/getCourseDetails",
  EDIT_COURSE_API: BASE_URL + "/course/editCourse",
  COURSE_CATEGORIES_API: BASE_URL + "/course/showAllCategories",
  CREATE_COURSE_API: BASE_URL + "/course/createCourse",
  CREATE_SECTION_API: BASE_URL + "/course/addSection",
  CREATE_SUBSECTION_API: BASE_URL + "/course/addSubSection",
  UPDATE_SECTION_API: BASE_URL + "/course/updateSection",
  UPDATE_SUBSECTION_API: BASE_URL + "/course/updateSubSection",
  GET_ALL_INSTRUCTOR_COURSES_API: BASE_URL + "/course/getInstructorCourses",
  DELETE_SECTION_API: BASE_URL + "/course/deleteSection",
  DELETE_SUBSECTION_API: BASE_URL + "/course/deleteSubSection",
  DELETE_COURSE_API: BASE_URL + "/course/deleteCourse",
  GET_FULL_COURSE_DETAILS_AUTHENTICATED: BASE_URL + "/course/getFullCourseDetails",
  LECTURE_COMPLETION_API: BASE_URL + "/course/updateCourseProgress",
  CREATE_RATING_API: BASE_URL + "/course/createRating",
}

// RATINGS AND REVIEWS
export const ratingsEndpoints = {
  REVIEWS_DETAILS_API: BASE_URL + "/course/getReviews",
}

// CATEGORIES API
export const categories = {
  CATEGORIES_API: BASE_URL + "/course/showAllCategories",
}

// CATALOG PAGE DATA
export const catalogData = {
  CATALOGPAGEDATA_API: BASE_URL + "/course/getCategoryPageDetails",
}

// CONTACT-US API
export const contactusEndpoint = {
  CONTACT_US_API: BASE_URL + "/reach/contact",
}

// SETTINGS PAGE API
export const settingsEndpoints = {
  UPDATE_DISPLAY_PICTURE_API: BASE_URL + "/profile/updateDisplayPicture",
  UPDATE_PROFILE_API: BASE_URL + "/profile/updateProfile",
  CHANGE_PASSWORD_API: BASE_URL + "/auth/changepassword",
  DELETE_PROFILE_API: BASE_URL + "/profile/deleteProfile",
}

// AI ENDPOINTS
export const AI_ENDPOINTS = {
  ASK_DOUBT: BASE_URL + "/ai/ask-doubt",
  GENERATE_NOTES: BASE_URL + "/ai/generate-notes",
  GENERATE_QUIZ: BASE_URL + "/ai/generate-quiz",
}

// FEATURE ENDPOINTS
export const FEATURE_ENDPOINTS = {
  // Doubts
  CREATE_DOUBT: BASE_URL + "/feature/doubt/create",
  GET_COURSE_DOUBTS: BASE_URL + "/feature/doubt/course",
  REPLY_DOUBT: BASE_URL + "/feature/doubt/reply",
  RESOLVE_DOUBT: BASE_URL + "/feature/doubt/resolve",
  GET_INSTRUCTOR_DOUBTS: BASE_URL + "/feature/doubt/instructor",

  // Announcements
  CREATE_ANNOUNCEMENT: BASE_URL + "/feature/announcement/create",
  GET_COURSE_ANNOUNCEMENTS: BASE_URL + "/feature/announcement/course",
  DELETE_ANNOUNCEMENT: BASE_URL + "/feature/announcement/delete",

  // Exams
  CREATE_EXAM: BASE_URL + "/feature/exam/create",
  GET_COURSE_EXAMS: BASE_URL + "/feature/exam/course",
  SUBMIT_EXAM: BASE_URL + "/feature/exam/submit",
  GET_EXAM_RESULTS: BASE_URL + "/feature/exam/results",

  // Progress
  GET_STUDENT_PROGRESS: (courseId) => BASE_URL + `/feature/progress/student/${courseId}`,
  GET_COURSE_STUDENTS_PROGRESS: BASE_URL + "/feature/progress/course",
  GENERATE_PROGRESS_REPORT: BASE_URL + "/feature/progress/report",

  // Watch Time
  WATCHTIME_START: BASE_URL + "/feature/watchtime/start",
  WATCHTIME_END: BASE_URL + "/feature/watchtime/end",
  WATCHTIME_DOUBT: BASE_URL + "/feature/watchtime/doubt",
  WATCHTIME_GET: (courseId) => BASE_URL + `/feature/watchtime/course/${courseId}`,
}
