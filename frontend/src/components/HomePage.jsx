import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import MessageContainer from "./MessageContainer";
import CallModal from "./CallModal";
import IncomingCallModal from "./IncomingCallModal";
import MicPermissionPrompt from "./MicPermissionPrompt";
import ReelsModal from "./ReelsModal";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const { selectedUser, authUser } = useSelector((store) => store.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
    }
  }, [authUser, navigate]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0b141a] overflow-hidden select-none relative font-sans">
      {/* Proactive Microphone Permission Alert Banner */}
      <MicPermissionPrompt />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar: Visible on desktop, or on mobile when no chat is open */}
        <div
          className={`${
            selectedUser ? "hidden md:flex" : "flex"
          } w-full md:w-[380px] lg:w-[420px] flex-col h-full border-r border-[#202c33] shrink-0 bg-[#0b141a] overflow-hidden`}
        >
          <Sidebar />
        </div>

        {/* Message Container: Visible on desktop, or on mobile when a chat is open */}
        <div
          className={`${
            !selectedUser ? "hidden md:flex" : "flex"
          } flex-1 flex-col h-full min-w-0 overflow-hidden bg-[#0b141a]`}
        >
          <MessageContainer />
        </div>

        {/* WebRTC Audio and Video Call Modals */}
        <CallModal />
        <IncomingCallModal />

        {/* Instagram/Snapchat Reels Modal */}
        <ReelsModal />
      </div>
    </div>
  );
};

export default HomePage;
