const dotenv = require("dotenv")
dotenv.config()

// ── MODELS PRELOAD (sabse pehle - schema register karne ke liye) ──
require("./models/User")
require("./models/Discussion")
require("./models/Course")
require("./models/Profile")
require("./models/Section")
require("./models/Subsection")
require("./models/RatingandReview")
require("./models/CourseProgress")
require("./models/OTP")

const express = require("express")
const app = express()
const http = require("http")
const { Server } = require("socket.io")

const userRoutes = require("./routes/user")
const profileRoutes = require("./routes/profile")
const courseRoutes = require("./routes/Course")
const paymentRoutes = require("./routes/Payments")
const contactUsRoute = require("./routes/Contact")
const aiChatRoutes = require("./routes/AIChat")
const featureRoutes = require("./routes/features")
const liveClassRoutes = require("./routes/liveClass")

const database = require("./config/database")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const { cloudinaryConnect } = require("./config/cloudinary")
const fileUpload = require("express-fileupload")

const PORT = process.env.PORT || 4000
database.connect()

app.use(express.json())
app.use(cookieParser())
app.use(cors({ origin: "*", credentials: true }))
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }))
cloudinaryConnect()

// Routes
app.use("/api/v1/auth", userRoutes)
app.use("/api/v1/profile", profileRoutes)
app.use("/api/v1/course", courseRoutes)
app.use("/api/v1/payment", paymentRoutes)
app.use("/api/v1/reach", contactUsRoute)
app.use("/api/v1/ai", aiChatRoutes)
app.use("/api/v1/feature", featureRoutes)
app.use("/api/v1/liveclass", liveClassRoutes)

app.get("/", (req, res) => res.json({ success: true, message: "Server is running..." }))

// ── SOCKET.IO SETUP ───────────────────────────────────────────
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
})

const activeUsers = {}

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id)

  socket.on("join", (userId) => {
    activeUsers[userId] = socket.id
    console.log(`👤 User ${userId} connected`)
  })

  socket.on("joinCourse", (courseId) => {
    socket.join(`course_${courseId}`)
    console.log(`📚 Socket joined course room: ${courseId}`)
  })

  socket.on("sendMessage", (data) => {
    io.to(`course_${data.courseId}`).emit("newMessage", {
      ...data,
      timestamp: new Date().toISOString(),
    })
  })

  socket.on("disconnect", () => {
    Object.keys(activeUsers).forEach((uid) => {
      if (activeUsers[uid] === socket.id) delete activeUsers[uid]
    })
    console.log("❌ Socket disconnected:", socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`🚀 App is listening at ${PORT}`)
})