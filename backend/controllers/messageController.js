import Message from "../models/message.js";

/* CREATE CHAT ID */
const createChatId = (a, b) => [a, b].sort().join("-");

/* SEND MESSAGE */
export const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;

    if (!sender || !receiver)
      return res.status(400).json({ message: "Missing fields" });

    const chatId = createChatId(sender, receiver);

    const message = await Message.create({
      chatId,
      sender,
      receiver,
      text,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET MESSAGES */
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET CONVERSATIONS (RN + WEB COMPATIBLE) */
export const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$chatId",
          lastMessage: { $first: "$text" },
          lastTime: { $first: "$createdAt" },
          sender: { $first: "$sender" },
          receiver: { $first: "$receiver" },
        },
      },
    ]);

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};