import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  chatId: string;
  sender: Types.ObjectId;
  text: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema: Schema<IMessage> = new Schema(
  {
    chatId: { type: String, ref: "Chat", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: String,
    image: {
      url: String,
      publicId: String,
    },
    messageType: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },
    seen: { type: Boolean, default: false },
    seenAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMessage>("Message", schema);
