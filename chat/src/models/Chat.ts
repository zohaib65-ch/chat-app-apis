import mongoose, { Document, Schema } from "mongoose";

export interface IChat extends Document {
  users: string[];
  latestMessage: {
    text: string;
    sender: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
const schema: Schema<IChat> = new Schema(
  {
    users: [{ type: String, required: true }],
    latestMessage: {
      text: { type: String },
      sender: { type: String },
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model<IChat>("Chat", schema);
