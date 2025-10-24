import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "Loaded ✅" : "❌ Missing");
const app = express();
app.use(cors());
app.use(bodyParser.json());
// ✅ Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
// ✅ Newsletter Schema & Model
const newsletterSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    subscribedAt: { type: Date, default: Date.now },
});
const Newsletter = mongoose.model("Newsletter", newsletterSchema);
// ✅ Nodemailer transporter (Brevo SMTP)
let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // use TLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
    logger: true,
    debug: true,
});
// ✅ Contact Form Route
app.post("/api/contact", async (req, res) => {
    const { name, email, message } = req.body;
    console.log("Contact form submitted:", { name, email, message });
    try {
        await transporter.sendMail({
            from: `"Mahmoud Abdulmajeed" <${process.env.SMTP_USER}>`, // ✅ must match verified Brevo sender
            to: process.env.RECEIVER_EMAIL, // your receiving email address
            replyTo: email, // user's email from contact form
            subject: `New contact from ${name}`,
            text: message,
            html: `
    <h2>New contact message</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong> ${message}</p>
  `,
        });
        res.status(200).json({ ok: true });
    }
    catch (err) {
        console.error("Error sending email:", err);
        res.status(500).json({ ok: false });
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
    }
    catch (err) {
        if (err.code === 11000) {
            // duplicate email
            return res.status(400).json({ ok: false, error: "Email already subscribed" });
        }
        console.error("Error saving subscription:", err);
        res.status(500).json({ ok: false, error: "Server error" });
    }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend running on ${PORT}`));
