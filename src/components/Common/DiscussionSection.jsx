import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { apiConnector } from "../../services/apiConnector"
import { FiSend, FiThumbsUp, FiTrash2, FiCornerDownRight, FiMessageCircle, FiChevronDown, FiChevronUp } from "react-icons/fi"

const BASE_URL = process.env.REACT_APP_BASE_URL

// ─── Time ago helper ──────────────────────────────────────────
function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Avatar ───────────────────────────────────────────────────
function Avatar({ user, size = 8 }) {
  return user?.image ? (
    <img src={user.image} alt={user.firstName}
      className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />
  ) : (
    <div className={`w-${size} h-${size} rounded-full bg-yellow-400 flex items-center justify-center text-richblack-900 font-bold text-sm shrink-0`}>
      {user?.firstName?.[0]?.toUpperCase() || "?"}
    </div>
  )
}

// ─── Reply Box ────────────────────────────────────────────────
function ReplyBox({ onSubmit, onCancel }) {
  const [text, setText] = useState("")
  return (
    <div className="flex gap-2 mt-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { onSubmit(text); setText("") } }}
        placeholder="Write a reply..."
        className="flex-1 rounded-lg bg-richblack-600 px-3 py-1.5 text-sm text-richblack-5 outline-none border border-richblack-500 focus:border-yellow-400 transition-colors"
      />
      <button
        onClick={() => { if (text.trim()) { onSubmit(text); setText("") } }}
        className="p-1.5 rounded-lg bg-yellow-400 text-richblack-900 hover:bg-yellow-300 transition-colors"
      >
        <FiSend size={14} />
      </button>
      <button onClick={onCancel} className="text-xs text-richblack-400 hover:text-richblack-200 px-2">
        Cancel
      </button>
    </div>
  )
}

// ─── Single Comment ───────────────────────────────────────────
function CommentCard({ discussion, currentUserId, onReply, onLike, onDelete }) {
  const [showReplies, setShowReplies] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const isLiked = discussion.likes?.includes(currentUserId)
  const isOwn = discussion.user?._id === currentUserId

  return (
    <div className="bg-richblack-700 rounded-xl p-4 border border-richblack-600">
      {/* Comment header */}
      <div className="flex items-start gap-3">
        <Avatar user={discussion.user} size={9} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-richblack-5">
              {discussion.user?.firstName} {discussion.user?.lastName}
            </span>
            <span className="text-xs text-richblack-400 shrink-0">{timeAgo(discussion.createdAt)}</span>
          </div>
          <p className="text-sm text-richblack-200 mt-1 leading-relaxed">{discussion.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onLike(discussion._id)}
              className={`flex items-center gap-1 text-xs transition-colors ${isLiked ? "text-yellow-400" : "text-richblack-400 hover:text-richblack-200"}`}
            >
              <FiThumbsUp size={12} />
              <span>{discussion.likes?.length || 0}</span>
            </button>

            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="flex items-center gap-1 text-xs text-richblack-400 hover:text-richblack-200 transition-colors"
            >
              <FiCornerDownRight size={12} />
              Reply
            </button>

            {discussion.replies?.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showReplies ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                {discussion.replies.length} {discussion.replies.length === 1 ? "reply" : "replies"}
              </button>
            )}

            {isOwn && (
              <button
                onClick={() => onDelete(discussion._id)}
                className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 transition-colors ml-auto"
              >
                <FiTrash2 size={12} />
              </button>
            )}
          </div>

          {/* Reply input */}
          {showReplyBox && (
            <ReplyBox
              onSubmit={(text) => { onReply(discussion._id, text); setShowReplyBox(false) }}
              onCancel={() => setShowReplyBox(false)}
            />
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && discussion.replies?.length > 0 && (
        <div className="mt-3 ml-12 space-y-3 border-l-2 border-richblack-600 pl-4">
          {discussion.replies.map((reply) => (
            <div key={reply._id} className="flex items-start gap-2">
              <Avatar user={reply.user} size={7} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-richblack-5">
                    {reply.user?.firstName} {reply.user?.lastName}
                  </span>
                  <span className="text-xs text-richblack-400">{timeAgo(reply.createdAt)}</span>
                </div>
                <p className="text-xs text-richblack-200 mt-0.5 leading-relaxed">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function DiscussionSection({ courseId, subSectionId }) {
  const { token } = useSelector((s) => s.auth)
  const { user } = useSelector((s) => s.profile)
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [newComment, setNewComment] = useState("")

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (courseId && subSectionId) fetchDiscussions()
  }, [courseId, subSectionId])

  const fetchDiscussions = async () => {
    setLoading(true)
    try {
      const res = await apiConnector("GET", `${BASE_URL}/feature/discussion/${courseId}/${subSectionId}`, null, headers)
      if (res?.data?.success) setDiscussions(res.data.data)
    } catch (e) { console.log("Discussion fetch error:", e) }
    setLoading(false)
  }

  const handlePost = async () => {
    if (!newComment.trim()) return
    setPosting(true)
    try {
      const res = await apiConnector("POST", `${BASE_URL}/feature/discussion/create`, {
        courseId, subSectionId, content: newComment.trim()
      }, headers)
      if (res?.data?.success) {
        setDiscussions((prev) => [res.data.data, ...prev])
        setNewComment("")
      }
    } catch (e) { console.log("Discussion post error:", e) }
    setPosting(false)
  }

  const handleReply = async (discussionId, content) => {
    try {
      const res = await apiConnector("POST", `${BASE_URL}/feature/discussion/reply`, {
        discussionId, content
      }, headers)
      if (res?.data?.success) {
        setDiscussions((prev) => prev.map((d) => d._id === discussionId ? res.data.data : d))
      }
    } catch (e) { console.log("Reply error:", e) }
  }

  const handleLike = async (discussionId) => {
    try {
      const res = await apiConnector("POST", `${BASE_URL}/feature/discussion/like`, { discussionId }, headers)
      if (res?.data?.success) {
        setDiscussions((prev) => prev.map((d) =>
          d._id === discussionId
            ? { ...d, likes: res.data.liked
                ? [...(d.likes || []), user._id]
                : (d.likes || []).filter((id) => id !== user._id) }
            : d
        ))
      }
    } catch (e) { console.log("Like error:", e) }
  }

  const handleDelete = async (discussionId) => {
    try {
      const res = await apiConnector("DELETE", `${BASE_URL}/feature/discussion/${discussionId}`, null, headers)
      if (res?.data?.success) setDiscussions((prev) => prev.filter((d) => d._id !== discussionId))
    } catch (e) { console.log("Delete error:", e) }
  }

  return (
    <div className="mt-8 border-t border-richblack-700 pt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <FiMessageCircle className="text-yellow-400" size={20} />
        <h3 className="text-lg font-bold text-richblack-5">
          Student Discussion
          {discussions.length > 0 && (
            <span className="ml-2 text-sm font-normal text-richblack-400">({discussions.length})</span>
          )}
        </h3>
      </div>

      {/* New comment box */}
      <div className="flex gap-3 mb-6">
        <Avatar user={user} size={9} />
        <div className="flex-1 flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handlePost() }}
            placeholder="Share your thoughts or ask a question..."
            className="flex-1 rounded-xl bg-richblack-700 px-4 py-2.5 text-sm text-richblack-5 outline-none border border-richblack-600 focus:border-yellow-400 transition-colors"
          />
          <button
            onClick={handlePost}
            disabled={posting || !newComment.trim()}
            className="px-4 py-2.5 rounded-xl bg-yellow-400 text-richblack-900 font-semibold text-sm hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {posting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-richblack-900 border-t-transparent" />
            ) : (
              <FiSend size={14} />
            )}
            Post
          </button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-center py-10 text-richblack-400">
          <FiMessageCircle size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No comments yet. Be the first to start the discussion!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {discussions.map((d) => (
            <CommentCard
              key={d._id}
              discussion={d}
              currentUserId={user?._id}
              onReply={handleReply}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
