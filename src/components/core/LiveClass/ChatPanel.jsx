// src/components/core/LiveClass/ChatPanel.jsx
import { useEffect, useRef, useState } from "react"
import { MdSend } from "react-icons/md"

export default function ChatPanel({ messages, onSend, currentUserId }) {
  const [input, setInput] = useState("")
  const bottomRef = useRef(null)

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input.trim())
    setInput("")
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-richblack-500 mt-8">
            No messages yet. Say hi! 👋
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}
          >
            {!msg.isSelf && (
              <span className="mb-1 text-[10px] font-semibold text-richblack-400">
                {msg.name}
              </span>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed
                ${msg.isSelf
                  ? "rounded-tr-sm bg-yellow-50 bg-opacity-20 text-yellow-25"
                  : "rounded-tl-sm bg-richblack-700 text-richblack-25"
                }`}
            >
              {msg.text}
            </div>
            <span className="mt-1 text-[9px] text-richblack-600">{msg.time}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-richblack-700 p-3">
        <div className="flex items-end gap-2 rounded-xl bg-richblack-700 px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-richblack-5 placeholder-richblack-500 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="rounded-lg bg-yellow-50 p-1.5 text-richblack-900 transition-all hover:bg-yellow-25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <MdSend size={16} />
          </button>
        </div>
        <p className="mt-1 text-[9px] text-richblack-600 text-right">Enter to send</p>
      </div>
    </div>
  )
}
