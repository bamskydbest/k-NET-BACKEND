import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Brevo from "@getbrevo/brevo";

dotenv.config();

console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "Loaded ✅" : "❌ Missing");

const app = express();
app.use(cors({
  origin: [
    "https://knetgh.netlify.app",  
  ],
  methods: ["GET", "POST"],
}));

app.use(bodyParser.json());

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Newsletter Schema & Model
const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now },
});
const Newsletter = mongoose.model("Newsletter", newsletterSchema);

// ✅ Contact Form Route (using Brevo API)
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  console.log("Contact form submitted:", { name, email, message });

  try {
    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY as string
    );

    const receiverEmail = process.env.RECEIVER_EMAIL as string;

    // Type-safe check to avoid 'undefined' email errors
    if (!receiverEmail || !email) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing sender or receiver email." });
    }

    const sendSmtpEmail: Brevo.SendSmtpEmail = {
      sender: { name: name || "Anonymous", email }, // dynamic sender info
      to: [{ email: receiverEmail }],
      replyTo: { email },
      subject: `New contact from ${name || "Unknown Sender"}`,
      htmlContent: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name || "N/A"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.status(200).json({ ok: true, message: "Email sent successfully!" });
  } catch (error: any) {
    console.error(
      "Error sending email via Brevo API:",
      error.response?.text || error.message
    );
    res.status(500).json({ ok: false, error: "Failed to send email" });
  }
});

app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  next();
});

// ✅ Newsletter Subscription Route
app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;
  console.log("New newsletter subscription:", email);

  if (!email) {
    return res.status(400).json({ ok: false, error: "Email is required" });
  }

  try {
    const subscriber = new Newsletter({ email });
    await subscriber.save();
    res.status(200).json({ ok: true, message: "Subscribed successfully" });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ ok: false, error: "Email already subscribed" });
    }
    console.error("Error saving subscription:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend running on ${PORT}`));
