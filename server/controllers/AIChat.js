const Groq = require("groq-sdk")
const SubSection = require("../models/Subsection")

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

exports.askDoubt = async (req, res) => {
  try {
    const { question, courseContext, videoTitle, subSectionId } = req.body
    console.log("🤖 Question:", question)

    let transcript = ""
    if (subSectionId) {
      const subSection = await SubSection.findById(subSectionId)
      transcript = subSection?.transcript || ""
    }

    const contextMessage = transcript
      ? `You are a helpful coding instructor for "${courseContext || "programming"}".
The student is watching: "${videoTitle || "a lecture"}".
Here is the full transcript of the video:
---
${transcript.substring(0, 3000)}
---
Answer the student's doubt based on the video transcript above. Be concise and clear.`
      : `You are a helpful coding instructor for "${courseContext || "programming"}".
The student is watching: "${videoTitle || "a lecture"}".
Answer briefly in simple language. Keep it under 150 words.`

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 400,
      messages: [
        { role: "system", content: contextMessage },
        { role: "user", content: question },
      ],
    })

    const answer = completion.choices[0].message.content
    console.log("✅ Groq Response:", answer)
    res.json({ success: true, answer })
  } catch (error) {
    console.log("Error:", error)
    res.json({
      success: true,
      answer: `💡 Your question: "${req.body?.question}"\n\n(Note: AI service is currently busy. Please try again.)`,
    })
  }
}

exports.generateNotes = async (req, res) => {
  try {
    const { videoTitle, videoDescription, subSectionId } = req.body

    let transcript = ""
    if (subSectionId) {
      const subSection = await SubSection.findById(subSectionId)
      transcript = subSection?.transcript || ""
    }

    const contentForNotes = transcript
      ? `Video Transcript:\n${transcript.substring(0, 4000)}`
      : `Title: ${videoTitle}\nDescription: ${videoDescription || "No description provided"}`

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: "You are a helpful study notes generator. Create clear, structured, student-friendly notes.",
        },
        {
          role: "user",
          content: `Create structured study notes for this lecture.

${contentForNotes}

Format the notes as:
## 📚 Key Concepts
- List main concepts

## 🔑 Important Points
- List important points

## 💡 Summary
A brief 2-3 line summary

Keep it concise and student-friendly.`,
        },
      ],
    })

    const notes = completion.choices[0].message.content
    res.json({ success: true, notes })
  } catch (error) {
    console.log("Error:", error)
    res.json({
      success: false,
      notes: `# Notes for: ${req.body?.videoTitle}\n\nPlease try again later.`,
    })
  }
}

exports.generateQuiz = async (req, res) => {
  try {
    const { videoTitle, subSectionId } = req.body
    console.log("🧠 Generating quiz for:", videoTitle)

    let transcript = ""
    if (subSectionId) {
      const subSection = await SubSection.findById(subSectionId)
      transcript = subSection?.transcript || ""
    }

    const contentForQuiz = transcript
      ? `Video Transcript:\n${transcript.substring(0, 4000)}`
      : `Lecture Title: ${videoTitle}`

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are a quiz generator. Generate exactly 5 multiple choice questions based on the lecture content provided. 
You MUST respond with ONLY a valid JSON array. No extra text, no markdown, no explanation.
Format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation why this is correct"
  }
]
"correct" is the index (0-3) of the correct option.`,
        },
        {
          role: "user",
          content: `Generate 5 MCQ questions based on this lecture:\n\n${contentForQuiz}`,
        },
      ],
    })

    let rawText = completion.choices[0].message.content.trim()

    // Clean any markdown code blocks if present
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim()

    const questions = JSON.parse(rawText)
    console.log("✅ Quiz generated:", questions.length, "questions")

    res.json({ success: true, questions })
  } catch (error) {
    console.log("Quiz generation error:", error)
    res.json({
      success: false,
      message: "Could not generate quiz. Please try again.",
    })
  }
}
