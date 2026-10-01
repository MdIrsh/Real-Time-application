import React from "react";
import Sidebar from "./Sidebar";
import MessageContainer from "./MessageContainer";
import { useSelector } from "react-redux";

const HomePage = () => {
  const { selectedUser } = useSelector((store) => store.user);

  return (
    <div className="w-full h-full bg-white flex overflow-hidden select-none">
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
    </div>
  );
};

export default HomePage;
