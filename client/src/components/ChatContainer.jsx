import React, { useContext, useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { MdEmojiEmotions, MdClose, MdEdit, MdReply, MdVideocam, MdImage } from "react-icons/md";
import assets from "../assets/assets";
import { formatMessageTime, formatMessageDate } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const TypingBubble = () => (
  <div className="flex justify-start mb-2 animate-in fade-in duration-300">
    <div className="bg-[#202c33] px-4 py-2 rounded-2xl rounded-bl-md shadow-md w-fit">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-[bounce_1.4s_infinite] [animation-delay:-0.32s]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-[bounce_1.4s_infinite] [animation-delay:-0.16s]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-[bounce_1.4s_infinite]" />
      </div>
    </div>
  </div>
);

const MessageLoader = () => (
  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg z-20 backdrop-blur-[1px] transition-all">
    <div className="w-8 h-8 border-4 border-white/30 border-t-[#00a884] rounded-full animate-spin"></div>
  </div>
);

const ReplyPreview = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between bg-[#1f2c34] p-2 border-l-4 border-[#00a884] rounded-t-lg mx-2 mt-2 animate-in slide-in-from-bottom-2">
      <div className="flex flex-col overflow-hidden">
        <span className="text-[#00a884] text-xs font-bold">
          {message.isOwn ? "You" : message.senderName}
        </span>
        <span className="text-gray-300 text-sm truncate">
          {message.image ? "📷 Photo" : message.video ? "🎥 Video" : message.text}
        </span>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-[#374248] rounded-full">
        <MdClose className="text-gray-400" />
      </button>
    </div>
  );
};

const ChatContainer = ({ toggleRightSidebar }) => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    editMessage,
    getMessages,
    deleteMessage,
    isTyping,
    reactToMessage,
  } = useContext(ChatContext);

  const { authUser, onlineUsers, socket } = useContext(AuthContext);

  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [replyMessage, setReplyMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const scrollEnd = useRef();
  const emojiRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    if (!editingMessage) {
      socket.emit("typing", { receiverId: selectedUser._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { receiverId: selectedUser._id });
      }, 800);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isUploading) return;

    if (editingMessage) {
      await editMessage(editingMessage._id, input.trim());
      setEditingMessage(null);
    } else {
      await sendMessage({
        text: input.trim(),
        replyTo: replyMessage?._id,
      });
      setReplyMessage(null);
    }
    setInput("");
    setShowEmoji(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket?.emit("stopTyping", { receiverId: selectedUser._id });
  };

  const handleMediaSelect = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === 'image' && !file.type.startsWith("image/")) return toast.error("Select an image");
    if (type === 'video' && !file.type.startsWith("video/")) return toast.error("Select a video");
    if (file.size > 20 * 1024 * 1024) return toast.error("File size limit is 20MB");

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      await sendMessage({
        [type]: reader.result,
        replyTo: replyMessage?._id,
        text: input.trim() || null,
      });
      setReplyMessage(null);
      setInput("");
      setIsUploading(false);
    };
    e.target.value = "";
  };

  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const startEditing = (msg) => {
    setEditingMessage(msg);
    setReplyMessage(null);
    setInput(msg.text || "");
    inputRef.current?.focus();
    setShowDeleteMenu(null);
  };

  const startReply = (msg) => {
    const isOwn = msg.senderId === authUser._id;
    setReplyMessage({
      ...msg,
      isOwn,
      senderName: isOwn ? "You" : selectedUser.fullName,
    });
    setEditingMessage(null);
    inputRef.current?.focus();
    setShowDeleteMenu(null);
  };

  const cancelAction = () => {
    setReplyMessage(null);
    setEditingMessage(null);
    setInput("");
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      setReplyMessage(null);
      setEditingMessage(null);
      setInput("");
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!editingMessage) {
      scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, editingMessage, replyMessage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmoji && emojiRef.current && !emojiRef.current.contains(event.target)) setShowEmoji(false);
      if ((showDeleteMenu || showReactionPicker) && !event.target.closest(".message-group")) {
        setShowDeleteMenu(null);
        setShowReactionPicker(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmoji, showDeleteMenu, showReactionPicker]);

  const handleMouseEnter = (msgId) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredMessage(msgId);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredMessage(null), 300);
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-gray-500 bg-[#0f1c24]">
        <img src={assets.logo_icon || "/logo.png"} alt="" className="w-16 opacity-50" />
        <p className="mt-3 text-sm">Select a chat to start messaging</p>
      </div>
    );
  }

  const isOnline = Array.isArray(onlineUsers) && onlineUsers.includes(String(selectedUser._id));

  return (
    <div className="h-full flex flex-col bg-[#0b141a] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#202c33] shadow-sm z-10">
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-10 h-10 rounded-full object-cover" />
        <div className="flex flex-col flex-1">
          <span className="text-white font-medium">{selectedUser.fullName}</span>
          <span className={`text-xs ${isOnline ? "text-green-400" : "text-gray-400"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleRightSidebar} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a3942] text-gray-300">i</button>
          <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className="md:hidden w-5 cursor-pointer" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-visible px-4 py-4 space-y-1 bg-[url('/bg-chat-tile.png')] bg-repeat" style={{ backgroundImage: "linear-gradient(rgba(11,20,26,0.9), rgba(11,20,26,0.9))" }}>
        {messages.map((msg, index) => {
          const isOwnMessage = msg.senderId === authUser._id;
          const isNextSame = messages[index + 1]?.senderId === msg.senderId;
          const currentDate = formatMessageDate(msg.createdAt);
          const prevDate = index > 0 ? formatMessageDate(messages[index - 1].createdAt) : null;
          const showDate = currentDate !== prevDate;
          const isHovered = hoveredMessage === msg._id;
          const isReplyOwn = msg.replyTo?.senderId === authUser._id;
          const replyName = isReplyOwn ? "You" : (msg.replyTo?.senderId ? selectedUser.fullName : "User");

          return (
            <React.Fragment key={msg._id}>
              {showDate && (
                <div className="flex justify-center my-4 sticky top-2 z-10">
                  <span className="bg-[#1f2c34] text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm border border-[#2a3942]">{currentDate}</span>
                </div>
              )}
              <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} ${isNextSame ? "mb-0.5" : "mb-3"}`}>
                <div onMouseEnter={() => handleMouseEnter(msg._id)} onMouseLeave={handleMouseLeave} className="relative max-w-[85%] md:max-w-[70%] group message-group">
                  <div className={`relative px-2 py-2 rounded-lg shadow-sm text-sm ${isOwnMessage ? "bg-[#005c4b] text-white rounded-tr-none" : "bg-[#202c33] text-white rounded-tl-none"}`}>
                    
                    {msg.isUploading && <MessageLoader />}
                    
                    {msg.replyTo && (
                      <div className={`mb-2 p-2 rounded-md border-l-4 text-xs cursor-pointer opacity-80 hover:opacity-100 transition ${isOwnMessage ? "bg-[#025043] border-[#024438]" : "bg-[#1d272d] border-[#00a884]"}`} onClick={() => document.getElementById(msg.replyTo?._id)?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                        <span className="font-bold block mb-1 text-[#00a884] opacity-100">{replyName}</span>
                        <span className="line-clamp-1 text-gray-300">{msg.replyTo?.image ? "📷 Photo" : msg.replyTo?.video ? "🎥 Video" : msg.replyTo?.text || "Original message deleted"}</span>
                      </div>
                    )}
                    
                    {msg.image && <img src={msg.image} alt="" className={`rounded-lg mb-1 max-w-full h-auto object-cover ${msg.isUploading ? "opacity-50 blur-[1px]" : ""}`} />}
                    {msg.video && <video src={msg.video} controls className={`rounded-lg mb-1 max-w-full h-auto ${msg.isUploading ? "opacity-50 blur-[1px]" : ""}`} />}
                    {msg.text && <p className="whitespace-pre-wrap leading-relaxed px-1 pb-1">{msg.text}</p>}
                    
                    <div className="flex justify-end items-center gap-1 mt-0.5 text-[10px] text-gray-300 select-none">
                      {msg.isEdited && <span className="italic opacity-70 mr-1">(edited)</span>}
                      <span>{formatMessageTime(msg.createdAt)}</span>
                      {isOwnMessage && !msg.isUploading && <span className={msg.seen ? "text-[#53bdeb]" : "text-gray-400"}>{msg.seen ? "✔✔" : isOnline ? "✔✔" : "✔"}</span>}
                      {msg.isUploading && <span className="text-gray-400">🕒</span>}
                    </div>

                    {msg.reactions?.length > 0 && (
                      <div className="absolute -bottom-3 right-2 bg-[#202c33] border border-[#2a3942] rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-md z-10 cursor-pointer hover:bg-[#2a3942] transition">
                        {Object.entries(msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})).slice(0, 3).map(([emoji, count]) => (
                          <span key={emoji} className="text-[10px] leading-none">{emoji}{count > 1 ? count : ''}</span>
                        ))}
                        {msg.reactions.length > 3 && <span className="text-[9px] text-gray-400">+{msg.reactions.length - 3}</span>}
                      </div>
                    )}
                  </div>

                  {!msg.isUploading && (isHovered || showDeleteMenu === msg._id) && (
                    <button onClick={(e) => { e.stopPropagation(); setShowDeleteMenu(showDeleteMenu === msg._id ? null : msg._id); setShowReactionPicker(null); }} className={`absolute top-0 ${isOwnMessage ? "-left-8" : "-right-8"} p-1 rounded-full bg-[#202c33] text-gray-400 hover:text-white shadow-md z-20 animate-in fade-in zoom-in duration-200`}>
                      <svg viewBox="0 0 24 24" width="20" height="20" className="fill-current"><path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path></svg>
                    </button>
                  )}

                  {!msg.isUploading && (isHovered || showReactionPicker === msg._id) && (
                    <button onClick={(e) => { e.stopPropagation(); setShowReactionPicker(showReactionPicker === msg._id ? null : msg._id); setShowDeleteMenu(null); }} className={`absolute top-8 ${isOwnMessage ? "-left-8" : "-right-8"} p-1 rounded-full bg-[#202c33] text-gray-400 hover:text-yellow-400 shadow-md z-20 animate-in fade-in zoom-in duration-200`}>
                      <MdEmojiEmotions size={20} />
                    </button>
                  )}

                  {showDeleteMenu === msg._id && (
                    <div className={`absolute top-6 ${isOwnMessage ? "right-0 origin-top-right" : "left-0 origin-top-left"} bg-[#202c33] rounded-md shadow-xl border border-[#2a3942] py-2 w-40 z-50 flex flex-col`}>
                      <button onClick={() => startReply(msg)} className="px-4 py-2 text-sm text-left text-gray-300 hover:bg-[#111b21] hover:text-white transition flex items-center gap-2"><MdReply /> Reply</button>
                      {isOwnMessage && <button onClick={() => startEditing(msg)} className="px-4 py-2 text-sm text-left text-gray-300 hover:bg-[#111b21] hover:text-white transition flex items-center gap-2"><MdEdit /> Edit</button>}
                      {isOwnMessage && <button onClick={() => { setConfirmDelete(msg._id); setShowDeleteMenu(null); }} className="px-4 py-2 text-sm text-left text-red-400 hover:bg-[#111b21] transition">Delete</button>}
                    </div>
                  )}

                  {showReactionPicker === msg._id && (
                    <div className={`absolute -top-10 ${isOwnMessage ? "right-0" : "left-0"} bg-[#202c33] rounded-full px-2 py-1 flex gap-1 z-50 shadow-xl border border-[#2a3942]`}>
                      {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                        <button key={emoji} onClick={() => { reactToMessage(msg._id, emoji); setShowReactionPicker(null); }} className="text-xl hover:scale-125 transition-transform duration-200 p-1">{emoji}</button>
                      ))}
                    </div>
                  )}
                  <div id={msg._id} className="absolute -top-20 opacity-0 pointer-events-none" />
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {isTyping && <TypingBubble />}
        <div ref={scrollEnd} className="h-1"></div>
      </div>

      <div className="bg-[#202c33] px-2 py-2">
        {replyMessage && <ReplyPreview message={replyMessage} onClose={cancelAction} />}
        {editingMessage && (
          <div className="flex items-center justify-between bg-[#1f2c34] p-2 border-l-4 border-blue-500 rounded-t-lg mx-2 mb-1 animate-in slide-in-from-bottom-2">
            <div className="flex flex-col"><span className="text-blue-500 text-xs font-bold">Editing Message</span><span className="text-gray-400 text-xs truncate">{editingMessage.text}</span></div>
            <button onClick={cancelAction} className="p-1 hover:bg-[#374248] rounded-full"><MdClose className="text-gray-400" /></button>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1">
          <button onClick={() => setShowEmoji(!showEmoji)} className={`p-2 rounded-full transition ${showEmoji ? "text-[#00a884]" : "text-gray-400 hover:text-gray-200"}`}><MdEmojiEmotions size={24} /></button>
          {showEmoji && <div ref={emojiRef} className="absolute bottom-20 left-4 z-50 shadow-2xl"><EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" width={300} height={400} /></div>}
          
          <div className="flex gap-1">
            <label htmlFor="image-upload" className="p-2 text-gray-400 hover:text-gray-200 cursor-pointer rounded-full hover:bg-[#2a3942] transition">
              <MdImage size={24} className="opacity-60" />
            </label>
            <input type="file" id="image-upload" accept="image/*" className="hidden" onChange={(e) => handleMediaSelect(e, 'image')} disabled={isUploading} />
            
            <label htmlFor="video-upload" className="p-2 text-gray-400 hover:text-gray-200 cursor-pointer rounded-full hover:bg-[#2a3942] transition">
              <MdVideocam size={24} className="opacity-60" />
            </label>
            <input type="file" id="video-upload" accept="video/*" className="hidden" onChange={(e) => handleMediaSelect(e, 'video')} disabled={isUploading} />
          </div>

          <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2 bg-[#2a3942] rounded-lg px-4 py-2.5">
            <input ref={inputRef} type="text" value={input} onChange={handleInputChange} placeholder={editingMessage ? "Edit your message..." : "Type a message"} className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-sm" disabled={isUploading} />
          </form>
          
          <button onClick={handleSendMessage} className="p-3 bg-[#00a884] rounded-full hover:bg-[#008f6f] transition shadow-md flex items-center justify-center disabled:opacity-50" disabled={isUploading}>
            {editingMessage ? <MdEdit className="text-white" size={20} /> : <img src={assets.send_button} alt="Send" className="w-5 h-5 invert brightness-0 invert-100" />}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-[#202c33] w-[350px] rounded-lg p-6 shadow-2xl transform transition-all scale-100">
            <h3 className="text-gray-100 text-lg font-medium mb-2">Delete message?</h3>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-[#00a884] hover:bg-[#2a3942] rounded-full transition text-sm font-medium border border-[#2a3942]">Cancel</button>
              <button onClick={() => { deleteMessage(confirmDelete); setConfirmDelete(null); }} className="px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] rounded-full transition text-sm font-medium shadow-lg">Delete for everyone</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;