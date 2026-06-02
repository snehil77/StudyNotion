const axios = require("axios")

const mailSender = async (email, title, body) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "StudyNotion", email: "snehil142@gmail.com" },
        to: [{ email: email }],
        subject: title,
        htmlContent: body,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    )
    console.log("✅ Email sent successfully")
    return response.data
  } catch (error) {
    console.error("❌ Mail Error:", error.response?.data || error.message)
    throw error
  }
}

module.exports = mailSender