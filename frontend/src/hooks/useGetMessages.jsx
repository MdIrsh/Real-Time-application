import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMessages } from "../redux/messageSlice";
import { getInitialMetaAiMessages } from "../utils/metaAi";
import { BASE_URL } from "../config/api";

const useGetMessages = () => {
  const { selectedUser } = useSelector((store) => store.user);
  const { socket } = useSelector((store) => store.socket);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!selectedUser?._id) return;

    if (
      socket &&
      selectedUser._id !== "meta-ai" &&
      !selectedUser._id.startsWith("demo-contact")
    ) {
      socket.emit("markAsSeen", { senderId: selectedUser._id });
    }

    if (selectedUser._id === "meta-ai") {
      const saved = localStorage.getItem("meta_ai_chat_history");
      if (saved) {
        try {
          dispatch(setMessages(JSON.parse(saved)));
        } catch {
          const initial = getInitialMetaAiMessages();
          dispatch(setMessages(initial));
          localStorage.setItem("meta_ai_chat_history", JSON.stringify(initial));
        }
      } else {
        const initial = getInitialMetaAiMessages();
        dispatch(setMessages(initial));
        localStorage.setItem("meta_ai_chat_history", JSON.stringify(initial));
      }
      return;
    }

    const fetchMessages = async () => {
      try {
        axios.defaults.withCredentials = true;
        const res = await axios.get(
          `${BASE_URL}/api/v1/message/${selectedUser._id}`
        );
        dispatch(setMessages(res.data));
      } catch (error) {
        console.log("Backend offline, loading fallback message:", error);
        dispatch(
          setMessages([
            {
              _id: `welcome-${selectedUser._id}`,
              senderId: selectedUser._id,
              message: `Hey! Thanks for checking out my chat application. You can send text, emojis, photos, or use the mic button 🎙️!`,
              createdAt: new Date().toISOString(),
            },
          ])
        );
      }
    };

    fetchMessages();
  }, [selectedUser, socket, dispatch]);
};

export default useGetMessages;
