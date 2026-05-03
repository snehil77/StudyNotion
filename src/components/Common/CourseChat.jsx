import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { io } from "socket.io-client"
import { FiMessageSquare, FiX, FiSend } from "react-icons/fi"

let socket = null

export default function CourseChat({ courseId }) {
  const { user } = useSelector((state) => state.profile)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)
  const isOpenRef = useRef(false)

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    // Connect socket once
    const serverUrl =
      process.env.REACT_APP_BASE_URL?.replace("/api/v1", "") || "http://localhost:4000"

    socket = io(serverUrl, { transports: ["websocket"] })

    socket.on("connect", () => {
      // Join user room
      socket.emit("join", user?._id)
      // Join course room
      socket.emit("joinCourse", courseId)
    })

    // Listen for new messages — matches server: io.to().emit("newMessage", ...)
    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg])
      if (!isOpenRef.current) setUnread((u) => u + 1)
    })

    return () => {
      if (socket) {
        socket.disconnect()
        socket = null
      }
    }
  }, [courseId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isOpen) setUnread(0)
  }, [isOpen])

  const sendMessage = () => {
    if (!input.trim() || !socket) return
    // Matches server: socket.on("sendMessage", ...)
    socket.emit("sendMessage", {
      courseId,
      senderId: user?._id,
      senderName: `${user?.firstName} ${user?.lastName}`,
      senderImage: user?.image,
      message: input.trim(),
    })
    setInput("")
  }

  const formatTime = (iso) => {
    if (!iso) return ""
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-2 rounded-md bg-richblack-700 px-4 py-2 text-sm font-semibold text-richblack-5 hover:bg-richblack-600 transition-all"
      >
        <FiMessageSquare size={16} />
        Live Chat
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-50 text-richblack-900 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[1000] w-[360px] h-[480px] rounded-2xl border border-richblack-600 bg-richblack-800 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-richblack-700 rounded-t-2xl px-4 py-3">
            <p className="font-semibold text-richblack-5 text-sm">💬 Course Live Chat</p>
            <button onClick={() => setIsOpen(false)}>
              <FiX className="text-richblack-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-richblack-400 text-xs text-center mt-4">
                Be the first to say hi! 👋
              </p>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.senderId === user?._id
              return (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  <img
                    src={
                      msg.senderImage ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${msg.senderName}`
                    }
                    alt=""
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                  <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <p className="text-xs text-richblack-400 mb-0.5">{msg.senderName}</p>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm ${
                        isMe
                          ? "bg-yellow-50 text-richblack-900 rounded-br-sm"
                          : "bg-richblack-600 text-richblack-5 rounded-bl-sm"
                      }`}
                    >
                      {msg.message}
                    </div>
                    <p className="text-[10px] text-richblack-500 mt-0.5">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-richblack-700">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-richblack-700 text-richblack-5 text-sm rounded-full px-4 py-2 outline-none"
            />
            <button
              onClick={sendMessage}
              className="bg-yellow-50 text-richblack-900 rounded-full w-9 h-9 flex items-center justify-center hover:bg-yellow-25 transition-all"
            >
              <FiSend size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
