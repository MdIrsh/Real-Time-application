import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMessages } from "../redux/messageSlice";
import { getInitialMetaAiMessages } from "../utils/metaAi";

const useGetMessages = () => {
  const { selectedUser } = useSelector((store) => store.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!selectedUser?._id) return;

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
          `http://localhost:5000/api/v1/message/${selectedUser._id}`
        );
        dispatch(setMessages(res.data));
      } catch (error) {
        console.log(error);
      }
    };

    fetchMessages();
  }, [selectedUser, dispatch]);
};

export default useGetMessages;
