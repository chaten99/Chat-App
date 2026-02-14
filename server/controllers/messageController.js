import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io, userSocketMap } from "../index.js";
import mongoose from "mongoose";

export const getUserForSidebar = async (req, res) => {
  try {
    const myId = req.user._id;

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(myId) },
        },
      },
      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$senderId", "$$userId"] },
                        {
                          $eq: [
                            "$receiverId",
                            new mongoose.Types.ObjectId(myId),
                          ],
                        },
                      ],
                    },
                    {
                      $and: [
                        {
                          $eq: ["$senderId", new mongoose.Types.ObjectId(myId)],
                        },
                        { $eq: ["$receiverId", "$$userId"] },
                      ],
                    },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "lastMessage",
        },
      },
      {
        $addFields: {
          lastMessageTime: {
            $ifNull: [
              { $arrayElemAt: ["$lastMessage.createdAt", 0] },
              new Date(0),
            ],
          },
        },
      },
      { $sort: { lastMessageTime: -1 } },
      {
        $project: {
          password: 0,
          lastMessage: 0,
        },
      },
    ]);

    const unseenMessages = {};
    const promises = users.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: myId,
        seen: false,
      });

      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });

    await Promise.all(promises);

    res.json({
      success: true,
      users,
      unseenMessages,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const updatedMessages = await Message.find({
      senderId: selectedUserId,
      receiverId: myId,
      seen: false,
    });

    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("replyTo", "text image video senderId");

    const senderSocketId = userSocketMap[selectedUserId];

    if (senderSocketId && updatedMessages.length > 0) {
      io.to(senderSocketId).emit("messagesSeen", {
        messageIds: updatedMessages.map((msg) => msg._id.toString()),
      });
    }

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) {
      return res.json({ success: false, message: "Message not found" });
    }

    if (!message.seen) {
      message.seen = true;
      await message.save();

      const senderSocketId = userSocketMap[message.senderId];

      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
          messageIds: [message._id.toString()],
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, video, replyTo } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    let videoUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        resource_type: "image",
        folder: "chat-app/messages",
      });
      imageUrl = uploadResponse.secure_url;
    }

    if (video) {
      const uploadResponse = await cloudinary.uploader.upload(video, {
        resource_type: "video",
        folder: "chat-app/messages",
      });
      videoUrl = uploadResponse.secure_url;
    }

    let newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
      replyTo,
    });

    newMessage = await newMessage.populate("replyTo", "text image video senderId");

    const receiverSocketId = userSocketMap[receiverId];
    const senderSocketId = userSocketMap[senderId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      io.to(receiverSocketId).emit("sidebarUpdate", {
        userId: senderId,
        message: newMessage,
      });
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("sidebarUpdate", {
        userId: receiverId,
        message: newMessage,
      });
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
      return res.json({ success: false, message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.json({ success: false, message: "Not authorized" });
    }

    await Message.findByIdAndDelete(id);

    const receiverSocketId = userSocketMap[message.receiverId];
    const senderSocketId = userSocketMap[message.senderId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", id);
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", id);
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user._id;

    const otherUserId = new mongoose.Types.ObjectId(id);

    const deleted = await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    });

    const receiverSocketId = userSocketMap[id];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("chatDeleted");
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
      return res.json({ success: false, message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.json({ success: false, message: "Not authorized" });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    await message.populate("replyTo", "text image video senderId");

    const receiverSocketId = userSocketMap[message.receiverId];
    const senderSocketId = userSocketMap[message.senderId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", message);
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageEdited", message);
    }

    res.json({ success: true, message });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.json({ success: false, message: "Message not found" });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingIndex !== -1) {
      const existingReaction = message.reactions[existingIndex];

      if (existingReaction.emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    await message.populate("replyTo", "text image video senderId");

    const receiverSocketId = userSocketMap[message.receiverId];
    const senderSocketId = userSocketMap[message.senderId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReacted", message);
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageReacted", message);
    }

    res.json({ success: true, message });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};