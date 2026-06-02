const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });

    console.log("Verifying SMTP connection...");

    await transporter.verify();

    console.log("✅ SMTP Connected Successfully");

    const info = await transporter.sendMail({
      from: `"StudyNotion | CodeHelp" <${process.env.MAIL_USER}>`,
      to: email,
      subject: title,
      html: body,
    });

    console.log("✅ Email sent successfully");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);

    return info;
  } catch (error) {
    console.error("❌ MAIL ERROR START ❌");
    console.error(error);
    console.error("❌ MAIL ERROR END ❌");

    throw error;
  }
};

module.exports = mailSender;