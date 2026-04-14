import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true},
    sender: { type: String, required: true},
    receiver: { type: String, required: true},
    text: { type: String, default: ""},
    file: { type: String, required: true},
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;