import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testSMTP() {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587, // try 587 first, then 465 if it fails
      secure: false, // true if port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // ignore self-signed certs
      },
      logger: true, // log everything
      debug: true,  // show debug output
    });

    await transporter.verify();
    console.log("✅ Connection successful, ready to send emails!");
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
}

testSMTP();
