import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import MessageContainer from "./MessageContainer";
import CallModal from "./CallModal";
import IncomingCallModal from "./IncomingCallModal";
import MicPermissionPrompt from "./MicPermissionPrompt";
import ReelsModal from "./ReelsModal";
import CameraModal from "./CameraModal";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { openGroupCall } from "../redux/groupCallSlice";

const HomePage = () => {
  const { selectedUser, authUser } = useSelector((store) => store.user);
  const { selectedGroup } = useSelector((store) => store.group);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const hasActiveChat = Boolean(selectedUser || selectedGroup);

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }

    // Auto-join Group Call room if user opened a shared ?groupCall=<roomId> invite link
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get("groupCall");
      if (roomParam) {
        dispatch(
          openGroupCall({
            roomId: roomParam,
            callType: "video",
            roomTitle: "Group Video Call",
          })
        );
        params.delete("groupCall");
        const cleanSearch = params.toString();
        const nextUrl =
          window.location.pathname + (cleanSearch ? `?${cleanSearch}` : "");
        window.history.replaceState({}, "", nextUrl);
      }
    } catch (e) {}
  }, [authUser, navigate, dispatch]);

  return (
    <div className="w-full h-full flex flex-col bg-[#050814] overflow-hidden select-none relative font-sans">
      {/* Proactive Microphone Permission Alert Banner */}
      <MicPermissionPrompt />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar: Visible on desktop/tablet, or on mobile when no chat is open */}
        <div
          className={`${
            hasActiveChat ? "hidden md:flex" : "flex"
          } w-full md:w-[330px] lg:w-[380px] xl:w-[420px] flex-col h-full border-r border-[#18233c] shrink-0 bg-[#050814] overflow-hidden`}
        >
          <Sidebar />
        </div>

        {/* Message Container: Visible on desktop, or on mobile when a chat is open */}
        <div
          className={`${
            !hasActiveChat ? "hidden md:flex" : "flex"
          } flex-1 flex-col h-full min-w-0 overflow-hidden bg-[#050814]`}
        >
          <MessageContainer />
        </div>

        {/* WebRTC Audio and Video Call Modals */}
        <CallModal />
        <IncomingCallModal />

        {/* Instagram/Snapchat Reels Modal */}
        <ReelsModal />

        {/* Live Camera Viewfinder & Photo Capture Modal */}
        <CameraModal />
      </div>
    </div>
  );
};

export default HomePage;
