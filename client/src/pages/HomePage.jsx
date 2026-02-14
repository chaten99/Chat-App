import React, { useContext, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import { ChatContext } from "../../context/ChatContext";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  return (
    <div className="w-full h-screen bg-[#0b141a]">
      <div
        className={`h-full grid ${
          selectedUser
            ? showRightSidebar
              ? "md:grid-cols-[320px_1fr_320px]"
              : "md:grid-cols-[320px_1fr]"
            : "md:grid-cols-[320px_1fr]"
        }`}
      >
        <Sidebar />
        <ChatContainer
          toggleRightSidebar={() => setShowRightSidebar((prev) => !prev)}
        />
        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
};

export default HomePage;
