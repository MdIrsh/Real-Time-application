import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import MessageContainer from "./MessageContainer";
import CallModal from "./CallModal";
import IncomingCallModal from "./IncomingCallModal";
import MicPermissionPrompt from "./MicPermissionPrompt";
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
    <div className="w-full h-full flex flex-col bg-white overflow-hidden select-none relative">
      {/* Proactive Microphone Permission Alert Banner */}
      <MicPermissionPrompt />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar: Visible on desktop, or on mobile when no chat is open */}
        <div
          className={`${
            selectedUser ? "hidden md:flex" : "flex"
          } w-full md:w-[360px] lg:w-[400px] flex-col h-full border-r border-gray-200 shrink-0 bg-white overflow-hidden`}
        >
          <Sidebar />
        </div>

        {/* Message Container: Visible on desktop, or on mobile when a chat is open */}
        <div
          className={`${
            !selectedUser ? "hidden md:flex" : "flex"
          } flex-1 flex-col h-full min-w-0 overflow-hidden`}
        >
          <MessageContainer />
        </div>

        {/* WebRTC Audio and Video Call Modals */}
        <CallModal />
        <IncomingCallModal />
      </div>
    </div>
  );
};

export default HomePage;
