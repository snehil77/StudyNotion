const Discussion = require("../models/Discussion")
const User = require("../models/User")

exports.getDiscussions = async (req, res) => {
  try {
    const { courseId, subSectionId } = req.params
    const discussions = await Discussion.find({ course: courseId, subSection: subSectionId })
      .populate("user", "firstName lastName image")
      .populate("replies.user", "firstName lastName image")
      .sort({ isPinned: -1, createdAt: -1 })
    res.json({ success: true, data: discussions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.createDiscussion = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body)
    console.log("REQ USER:", req.user)
    const { courseId, subSectionId, content } = req.body
    const userId = req.user.id
    const discussion = await Discussion.create({
      course: courseId,
      subSection: subSectionId,
      user: userId,
      content,
    })
    const populated = await discussion.populate("user", "firstName lastName image")
    res.json({ success: true, data: populated })
  } catch (err) {
    console.log("DISCUSSION ERROR:", err.message)
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.replyDiscussion = async (req, res) => {
  try {
    const { discussionId, content } = req.body
    const userId = req.user.id
    const discussion = await Discussion.findById(discussionId)
    if (!discussion) return res.status(404).json({ success: false, message: "Not found" })
    discussion.replies.push({ user: userId, content })
    await discussion.save()
    await discussion.populate("user", "firstName lastName image")
    await discussion.populate("replies.user", "firstName lastName image")
    res.json({ success: true, data: discussion })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.toggleLike = async (req, res) => {
  try {
    const { discussionId } = req.body
    const userId = req.user.id
    const discussion = await Discussion.findById(discussionId)
    if (!discussion) return res.status(404).json({ success: false, message: "Not found" })
    const idx = discussion.likes.indexOf(userId)
    if (idx === -1) discussion.likes.push(userId)
    else discussion.likes.splice(idx, 1)
    await discussion.save()
    res.json({ success: true, likes: discussion.likes.length, liked: idx === -1 })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.deleteDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params
    const userId = req.user.id
    const discussion = await Discussion.findById(discussionId)
    if (!discussion) return res.status(404).json({ success: false, message: "Not found" })
    if (discussion.user.toString() !== userId)
      return res.status(403).json({ success: false, message: "Not authorized" })
    await discussion.deleteOne()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}