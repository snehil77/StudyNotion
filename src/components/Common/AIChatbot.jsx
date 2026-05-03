import { useState, useRef, useEffect } from "react"
import { useSelector } from "react-redux"
import { IoChatbubbleEllipses, IoClose, IoSend } from "react-icons/io5"
import { askDoubt } from "../../services/operations/aiChatAPI"

export default function AIChatbot({ courseContext, videoTitle, subSectionId }) {
  const { token } = useSelector((state) => state.auth)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    const response = await askDoubt(input, courseContext, videoTitle, subSectionId, token)

    if (response?.success) {
      const aiMessage = { role: "assistant", content: response.answer }
      setMessages((prev) => [...prev, aiMessage])
    } else {
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I couldn't process your doubt. Please try again.",
      }
      setMessages((prev) => [...prev, errorMessage])
    }

    setLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-yellow-50 text-black p-4 rounded-full shadow-lg hover:bg-yellow-100 transition-all duration-200"
      >
        {isOpen ? <IoClose size={24} /> : <IoChatbubbleEllipses size={24} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-richblack-800 rounded-lg shadow-xl flex flex-col border border-richblack-700">
          <div className="bg-yellow-50 text-black p-4 rounded-t-lg">
            <h3 className="font-semibold">🤖 AI Doubt Assistant</h3>
            <p className="text-xs opacity-75">Ask anything about this video</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-richblack-300 mt-8">
                <p>👋 Hi! I'm your AI assistant.</p>
                <p className="text-sm mt-2">Ask me anything about:</p>
                <ul className="text-xs mt-2 space-y-1">
                  <li>• Course concepts you don't understand</li>
                  <li>• Code examples and explanations</li>
                  <li>• Clarifications on video lectures</li>
                </ul>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-yellow-50 text-black"
                      : "bg-richblack-700 text-richblack-5"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-richblack-700 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-richblack-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-richblack-300 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-richblack-300 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-richblack-700">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your doubt..."
                className="flex-1 bg-richblack-700 text-richblack-5 p-2 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-yellow-50"
                rows="1"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-yellow-50 text-black p-2 rounded-lg hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoSend size={20} />
              </button>
            </div>
            <p className="text-xs text-richblack-400 mt-2 text-center">
              Powered by Groq AI
            </p>
          </div>
        </div>
      )}
    </>
  )
}

