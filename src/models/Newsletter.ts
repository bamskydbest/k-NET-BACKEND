import mongoose, { Schema, Document } from "mongoose";

export interface INewsletter extends Document {
  email: string;
  subscribedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const NewsletterSchema: Schema = new Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,                 // convert emails to lowercase
      match: /^\S+@\S+\.\S+$/          // simple email format validation
    },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }                  // automatically adds createdAt & updatedAt
);

export default mongoose.model<INewsletter>("Newsletter", NewsletterSchema);
