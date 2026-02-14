import { createContext, useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import assets from "../src/assets/assets.js";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [isTyping, setIsTyping] = useState(false);

  const [isAudioAllowed, setIsAudioAllowed] = useState(false);
  const audioRef = useRef(null);

  const { socket, axios, authUser } = useContext(AuthContext);

  useEffect(() => {
    audioRef.current = new Audio(assets.notificationSound);

    const enableAudio = () => {
      if (audioRef.current) {
        audioRef.current.volume = 0;
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              audioRef.current.volume = 1;
              setIsAudioAllowed(true);
              document.removeEventListener("click", enableAudio);
              document.removeEventListener("keydown", enableAudio);
            })
            .catch((err) => {
              console.log("Audio unlock failed:", err);
            });
        }
      }
    };

    document.addEventListener("click", enableAudio);
    document.addEventListener("keydown", enableAudio);

    return () => {
      document.removeEventListener("click", enableAudio);
      document.removeEventListener("keydown", enableAudio);
    };
  }, []);

  const playNotificationSound = () => {
    if (!isAudioAllowed || !audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn("Notification sound blocked:", err.message);
      });
    } catch (error) {
      console.error("Audio system error", error);
    }
  };

  const updateSidebarOnMessage = (newMessage) => {
    setUsers((prevUsers) => {
      const senderId = newMessage.senderId;
      const receiverId = newMessage.receiverId;
      const partnerId = senderId === authUser._id ? receiverId : senderId;

      const userIndex = prevUsers.findIndex((u) => u._id === partnerId);
      if (userIndex === -1) return prevUsers;

      const updatedUser = { ...prevUsers[userIndex] };
      updatedUser.lastMessage = {
        text: newMessage.text || (newMessage.image ? "📷 Photo" : newMessage.video ? "🎥 Video" : ""),
        createdAt: new Date().toISOString(),
      };

      const newUsers = [...prevUsers];
      newUsers.splice(userIndex, 1);
      newUsers.unshift(updatedUser);
      return newUsers;
    });
  };

  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async (messageData) => {
    const tempId = `temp-${Date.now()}`;
    
    let replyToObject = null;
    if (messageData.replyTo) {
        replyToObject = messages.find(m => m._id === messageData.replyTo);
    }

    const optimisticMessage = {
        _id: tempId,
        senderId: authUser._id,
        receiverId: selectedUser._id,
        text: messageData.text,
        image: messageData.image,
        video: messageData.video,
        replyTo: replyToObject,
        createdAt: new Date().toISOString(),
        seen: false,
        reactions: [],
        isUploading: !!(messageData.image || messageData.video),
    };

    try {
      setMessages((prev) => [...prev, optimisticMessage]);
      updateSidebarOnMessage(optimisticMessage);

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );

      if (data.success) {
        setMessages((prev) => 
            prev.map((msg) => msg._id === tempId ? data.newMessage : msg)
        );
        updateSidebarOnMessage(data.newMessage);
      }
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      toast.error(error.response?.data?.message || "Failed to send");
    }
  };

  const editMessage = async (messageId, newText) => {
    try {
      const { data } = await axios.put(`/api/messages/edit/${messageId}`, {
        text: newText,
      });
      if (data.success) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg._id === messageId) {
                return { ...msg, ...data.message };
            }
            return msg;
          })
        );
      }
    } catch (error) {
      toast.error("Failed to edit");
      console.log(error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const { data } = await axios.delete(`/api/messages/${messageId}`);
      if (data.success) {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteChat = async () => {
    try {
      const { data } = await axios.delete(`/api/messages/chat/${selectedUser._id}`);
      if (data.success) {
        setMessages([]);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const reactToMessage = async (messageId, emoji) => {
    try {
      await axios.post(`/api/messages/react/${messageId}`, { emoji });
    } catch (error) {
      console.error(error);
    }
  };

  const subscribeToMessages = () => {
    if (!socket) return;

    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("messageEdited");
    socket.off("messagesSeen");
    socket.off("userTyping");
    socket.off("userStopTyping");
    socket.off("chatDeleted");
    socket.off("messageReacted");

    socket.on("newMessage", (newMessage) => {
      updateSidebarOnMessage(newMessage);

      if (newMessage.senderId !== authUser._id) {
        playNotificationSound();
      }

      const isChatOpen = selectedUser && String(newMessage.senderId) === String(selectedUser._id);

      if (isChatOpen) {
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);
        axios.put(`/api/messages/marks/${newMessage._id}`);
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    });

    socket.on("messageEdited", (updatedMessage) => {
        setMessages((prev) =>
          prev.map((msg) => 
            msg._id === updatedMessage._id ? { ...msg, ...updatedMessage } : msg
          )
        );
    });

    socket.on("messageDeleted", (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    socket.on("messagesSeen", ({ messageIds }) => {
      if (!messageIds) return;
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg._id.toString()) ? { ...msg, seen: true } : msg
        )
      );
    });

    socket.on("userTyping", ({ senderId }) => {
      if (selectedUser && String(selectedUser._id) === String(senderId)) {
        setIsTyping(true);
      }
    });

    socket.on("userStopTyping", ({ senderId }) => {
      if (selectedUser && String(selectedUser._id) === String(senderId)) {
        setIsTyping(false);
      }
    });

    socket.on("chatDeleted", () => setMessages([]));

    socket.on("messageReacted", (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMessage._id ? { ...msg, ...updatedMessage } : msg))
      );
    });
  };

  const unsubscribeFromMessages = () => {
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("messageEdited");
    socket.off("messagesSeen");
    socket.off("userTyping");
    socket.off("userStopTyping");
    socket.off("chatDeleted");
    socket.off("messageReacted");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser, authUser]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        editMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        deleteMessage,
        isTyping,
        deleteChat,
        reactToMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};