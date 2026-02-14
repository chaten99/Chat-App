import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

const RightSidebar = () => {
  const { selectedUser, messages, deleteChat } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const [msgImages, setMsgImages] = useState([]);
  const [confirmDeleteChat, setConfirmDeleteChat] = useState(false);

  useEffect(() => {
    setMsgImages(messages.filter((msg) => msg.image).map((msg) => msg.image));
  }, [messages]);

  return (
    selectedUser && (
      <div
        className={`h-full bg-[#111b21] flex flex-col ${selectedUser ? "max-md:hidden" : ""}`}
      >
        <div className="flex flex-col items-center px-6 py-8 border-b border-[#202c33]">
          <div className="relative">
            <img
              src={selectedUser?.profilePic || assets.avatar_icon}
              alt=""
              className="w-24 h-24 rounded-full object-cover"
            />
            {onlineUsers.includes(selectedUser._id) && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#00a884] border-2 border-[#111b21] rounded-full"></span>
            )}
          </div>

          <h2 className="mt-4 text-lg font-semibold text-white">
            {selectedUser.fullName}
          </h2>

          <p className="text-sm text-gray-400 text-center mt-1 px-4">
            {selectedUser.bio || "No bio available"}
          </p>
        </div>

        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Media</h3>

          {msgImages.length === 0 ? (
            <p className="text-xs text-gray-500">No shared media</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {msgImages.map((url, index) => (
                <div
                  key={index}
                  onClick={() => window.open(url)}
                  className="cursor-pointer"
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-24 object-cover rounded-lg hover:opacity-90 transition"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#202c33] space-y-3">
          <button
            onClick={() => setConfirmDeleteChat(true)}
            className="w-full py-2 bg-red-500 hover:bg-red-600 transition rounded-md text-white font-medium"
          >
            Delete Chat
          </button>

          <button
            onClick={logout}
            className="w-full py-2 bg-[#00a884] hover:bg-[#019f7a] transition rounded-md text-black font-medium"
          >
            Logout
          </button>
        </div>

        {confirmDeleteChat && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#111b21] w-[320px] rounded-2xl p-6 shadow-2xl border border-[#202c33]">
              <h3 className="text-white text-lg font-semibold mb-2">
                Delete entire chat?
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                This will permanently remove all messages in this conversation.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDeleteChat(false)}
                  className="px-4 py-2 text-sm rounded-lg bg-[#2a3942] hover:bg-[#34444f] transition"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    deleteChat();
                    setConfirmDeleteChat(false);
                  }}
                  className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 transition text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  );
};

export default RightSidebar;
