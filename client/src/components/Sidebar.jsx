import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";

const Sidebar = () => {
  const {
    getUsers,
    users = [],
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  const filteredUsers = input
    ? users.filter((user) =>
        user.fullName?.toLowerCase().includes(input.toLowerCase()),
      )
    : users;

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <div
      className={`h-full bg-[#111b21] flex flex-col ${selectedUser ? "max-md:hidden" : ""}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#202c33] relative">
        <img src={assets.logo} alt="logo" className="w-28" />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition"
          >
            <span className="text-lg text-gray-300">⋮</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-[#202c33] rounded-lg shadow-xl border border-[#2a3942] z-50">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile");
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a3942] transition"
              >
                Edit Profile
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#2a3942] transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 bg-[#111b21]">
        <div className="flex items-center bg-[#202c33] rounded-full px-4 py-2">
          <img src={assets.search_icon} alt="" className="w-4 opacity-70" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search or start new chat"
            className="flex-1 bg-transparent outline-none text-white text-sm ml-2"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Array.isArray(filteredUsers) &&
          filteredUsers.map((user) => (
            <div
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
              }}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                selectedUser?._id === user._id
                  ? "bg-[#2a3942]"
                  : "hover:bg-[#202c33]"
              }`}
            >
              <div className="relative">
                <img
                  src={user?.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-[#111b21] rounded-full"></span>
                )}
              </div>

              <div className="flex flex-col flex-1">
                <span className="text-white text-sm font-medium">
                  {user.fullName}
                </span>
                <span className="text-xs text-gray-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </span>
              </div>

              {unseenMessages[user._id] > 0 && (
                <span className="min-w-[20px] h-5 px-2 flex items-center justify-center text-xs font-semibold bg-[#00a884] text-black rounded-full">
                  {unseenMessages[user._id]}
                </span>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default Sidebar;
