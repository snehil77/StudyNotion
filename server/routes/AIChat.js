const express = require("express")
const router = express.Router()
const { auth } = require("../middleware/auth")
const { askDoubt, generateNotes, generateQuiz } = require("../controllers/AIChat")

router.post("/ask-doubt", auth, askDoubt)
router.post("/generate-notes", auth, generateNotes)
router.post("/generate-quiz", auth, generateQuiz)

module.exports = router
