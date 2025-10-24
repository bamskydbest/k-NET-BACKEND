import mongoose, { Schema } from "mongoose";
const NewsletterSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true, // convert emails to lowercase
        match: /^\S+@\S+\.\S+$/ // simple email format validation
    },
    subscribedAt: { type: Date, default: Date.now },
}, { timestamps: true } // automatically adds createdAt & updatedAt
);
export default mongoose.model("Newsletter", NewsletterSchema);
