import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: String,
    sender: String,
    receiver: String,
    text: String,
    file: String,
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;