import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { closePaymentModal } from "../redux/paymentSlice";
import {
  IoClose,
  IoCopyOutline,
  IoCheckmarkCircle,
  IoQrCodeOutline,
  IoPhonePortraitOutline,
  IoSearchOutline,
  IoSend,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { FaRupeeSign } from "react-icons/fa";
import { setMessages, setLastMessage } from "../redux/messageSlice";
import { setSelectedUser } from "../redux/userSlice";
import { addGroupMessage } from "../redux/groupSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const PaymentModal = () => {
  const dispatch = useDispatch();
  const { isPaymentOpen, paymentTargetUser, defaultAmount, defaultNote } = useSelector(
    (store) => store.payment
  );
  const { authUser, selectedUser, otherUsers } = useSelector((store) => store.user);
  const { selectedGroup } = useSelector((store) => store.group);
  const { messages } = useSelector((store) => store.message);
  const { socket } = useSelector((store) => store.socket);

  const [activeTab, setActiveTab] = useState("apps"); // "apps" | "qr"
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [customUpiId, setCustomUpiId] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize recipient and fields when modal opens
  useEffect(() => {
    if (isPaymentOpen) {
      const recipient = paymentTargetUser || selectedUser || null;
      setSelectedRecipient(recipient);
      setAmount(defaultAmount ? String(defaultAmount) : "500");
      setNote(defaultNote || "Payment via WhatsApp");

      // Default UPI ID based on recipient or phone/username
      if (recipient?.username) {
        setCustomUpiId(`${recipient.username.toLowerCase()}@okhdfcbank`);
      } else if (recipient?.fullName) {
        setCustomUpiId(
          `${recipient.fullName.replace(/\s+/g, "").toLowerCase()}@oksbi`
        );
      } else {
        setCustomUpiId("irshad.dev@oksbi");
      }
    }
  }, [isPaymentOpen, paymentTargetUser, selectedUser, defaultAmount, defaultNote]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isPaymentOpen) {
        dispatch(closePaymentModal());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaymentOpen, dispatch]);

  const recipientName =
    selectedRecipient?.fullName || selectedGroup?.name || "Recipient";
  const upiId = customUpiId || "irshad.dev@oksbi";
  const numAmount = parseFloat(amount) || 0;

  // Standard UPI Link (NPCI Compliant)
  const upiUrl = useMemo(() => {
    const cleanUpi = upiId.trim();
    const cleanName = encodeURIComponent(recipientName);
    const cleanNote = encodeURIComponent(note.trim() || "Payment");
    return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${numAmount}&cu=INR&tn=${cleanNote}`;
  }, [upiId, recipientName, numAmount, note]);

  // Dynamic QR Code image URL using standard QR generator
  const qrCodeUrl = useMemo(() => {
    if (!upiUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
      upiUrl
    )}&margin=10`;
  }, [upiUrl]);

  // Copy UPI string or ID
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiUrl);
    setCopied(true);
    toast.success("UPI payment link copied! 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  // Trigger UPI App (PhonePe / GPay / Paytm / System)
  const handleLaunchUpiApp = (appName = "UPI") => {
    if (numAmount <= 0) {
      toast.error("Please enter a valid amount!");
      return;
    }

    // Try opening UPI scheme
    window.location.href = upiUrl;
    toast.success(`Opening ${appName}... 📱`, { duration: 2500 });
  };

  // Play coin / payment chime sound via Web Audio API
  const playPaymentSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
      osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime + 0.24); // C6
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  };

  // Send Authentic WhatsApp Pay Receipt Message into Chat
  const handleSendPaymentReceipt = useCallback(async () => {
    if (numAmount <= 0) {
      toast.error("Please enter a valid payment amount!");
      return;
    }

    const target = selectedRecipient || selectedUser;
    if (!target?._id && !selectedGroup?._id) {
      toast.error("Please select a recipient to send receipt to!");
      return;
    }

    setIsSubmitting(true);
    playPaymentSound();

    const txnId = `UPI-${Date.now().toString().slice(-8)}`;
    const paymentPayload = {
      amount: numAmount,
      note: note.trim() || "Payment",
      recipientName: target?.fullName || selectedGroup?.name || "Recipient",
      recipientId: target?._id || selectedGroup?._id,
      upiId: upiId,
      status: "completed",
      txnId: txnId,
      timestamp: new Date().toISOString(),
    };

    const structuredMessage = `[PAYMENT:${JSON.stringify(paymentPayload)}]`;

    // 1. Group Chat Sending
    if (selectedGroup?._id) {
      try {
        const res = await axios.post(
          `${BASE_URL}/api/v1/group/send/${selectedGroup._id}`,
          {
            message: structuredMessage,
            image: null,
            audio: null,
            audioDuration: 0,
          },
          { withCredentials: true }
        );
        if (res.data?.success && res.data.message) {
          dispatch(addGroupMessage(res.data.message));
        }
        toast.success(`Payment receipt for ₹${numAmount} shared! 💳✨`);
        dispatch(closePaymentModal());
      } catch (err) {
        console.error("Payment group send error:", err);
        toast.error("Failed to share payment in group");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 2. 1-on-1 User Chat Sending
    const userMsg = {
      _id: `user-msg-${Date.now()}`,
      senderId: authUser?._id,
      receiverId: target._id,
      message: structuredMessage,
      image: null,
      audio: null,
      audioDuration: 0,
      createdAt: new Date().toISOString(),
      delivered: false,
      seen: false,
      isMe: true,
    };

    if (selectedUser?._id === target._id) {
      dispatch(setMessages([...(messages || []), userMsg]));
    }
    dispatch(
      setLastMessage({
        userId: target._id,
        text: `💳 ₹${numAmount} Payment Receipt`,
        time: userMsg.createdAt,
        isMe: true,
        seen: false,
        delivered: false,
      })
    );

    if (!selectedUser || selectedUser._id !== target._id) {
      dispatch(setSelectedUser(target));
    }

    if (socket && target._id && target._id !== "meta-ai") {
      socket.emit("sendMessage", userMsg);
    }

    try {
      await axios.post(
        `${BASE_URL}/api/v1/message/send/${target._id}`,
        {
          message: structuredMessage,
          image: null,
          audio: null,
          audioDuration: 0,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success(`₹${numAmount} Payment Receipt sent to ${target.fullName}! 💳✨`);
      dispatch(closePaymentModal());
    } catch (err) {
      console.error("Payment message API error:", err);
      toast.success(`₹${numAmount} Payment Receipt staged in chat!`);
      dispatch(closePaymentModal());
    } finally {
      setIsSubmitting(false);
    }
  }, [
    numAmount,
    selectedRecipient,
    selectedUser,
    selectedGroup,
    note,
    upiId,
    authUser,
    dispatch,
    messages,
    socket,
  ]);

  if (!isPaymentOpen) return null;

  const filteredUsers = (otherUsers || []).filter((u) =>
    u.fullName?.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div className="w-full max-w-md bg-[#111b21] border border-[#202c33] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#00a884]/20 via-[#103629]/40 to-[#111b21] border-b border-[#202c33] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#00a884] text-[#0b141a] flex items-center justify-center font-black shadow-lg">
              <FaRupeeSign size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[#e9edef]">
                  WhatsApp Payments 🇮🇳
                </h3>
                <span className="text-[10px] bg-[#00a884]/20 text-[#25d366] px-1.5 py-0.2 rounded font-extrabold border border-[#25d366]/30">
                  BHIM UPI
                </span>
              </div>
              <p className="text-[11px] text-[#8696a0] flex items-center gap-1">
                <IoShieldCheckmarkOutline className="text-[#25d366]" size={12} />
                <span>100% Safe, Instant & Encrypted</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(closePaymentModal())}
            className="w-8 h-8 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-white flex items-center justify-center transition active:scale-95"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Recipient Profile Card */}
          {selectedRecipient ? (
            <div className="p-3 rounded-2xl bg-[#202c33]/70 border border-[#2a3942] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={getAvatarUrl(selectedRecipient)}
                  alt="avatar"
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#00a884]"
                  onError={(e) => handleImageError(e, selectedRecipient.fullName)}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-white truncate">
                      {selectedRecipient.fullName}
                    </p>
                    <IoCheckmarkCircle size={14} className="text-[#00a884] shrink-0" />
                  </div>
                  <p className="text-[11px] text-[#8696a0] truncate font-mono">
                    UPI ID: {upiId}
                  </p>
                </div>
              </div>

              {!paymentTargetUser && (
                <button
                  onClick={() => setSelectedRecipient(null)}
                  className="text-[11px] text-[#00a884] hover:underline font-semibold shrink-0 ml-2"
                >
                  Change
                </button>
              )}
            </div>
          ) : (
            /* Recipient Selection Dropdown */
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#8696a0]">
                Select Contact to Pay
              </label>
              <div className="px-3 py-2 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center gap-2">
                <IoSearchOutline className="text-[#8696a0]" size={15} />
                <input
                  type="text"
                  placeholder="Search friend..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-full placeholder-[#8696a0]"
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                {filteredUsers.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => {
                      setSelectedRecipient(u);
                      setCustomUpiId(
                        `${u.username?.toLowerCase() || "user"}@okhdfcbank`
                      );
                    }}
                    className="p-2 rounded-xl hover:bg-[#202c33] cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getAvatarUrl(u)}
                        alt={u.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => handleImageError(e, u.fullName)}
                      />
                      <span className="text-xs text-white font-medium">
                        {u.fullName}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#00a884] font-bold">
                      Select
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amount Box */}
          <div className="p-4 rounded-2xl bg-[#0b141a] border border-[#202c33] text-center flex flex-col items-center">
            <span className="text-[11px] text-[#8696a0] uppercase tracking-wider font-semibold">
              Enter Amount
            </span>
            <div className="flex items-center justify-center gap-1 my-2">
              <span className="text-2xl font-bold text-[#00a884]">₹</span>
              <input
                type="number"
                min="1"
                max="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent text-4xl font-extrabold text-white text-center w-44 outline-none tracking-tight"
                autoFocus
              />
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition active:scale-95 ${
                    numAmount === q
                      ? "bg-[#00a884] border-[#00a884] text-[#0b141a] font-bold"
                      : "bg-[#202c33] border-[#2a3942] text-[#8696a0] hover:text-white"
                  }`}
                >
                  +₹{q}
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <input
              type="text"
              placeholder="Add a payment note (e.g. Dinner, Gift, Chai ☕)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#202c33] border border-[#2a3942] focus:border-[#00a884] text-xs text-white px-3.5 py-2.5 rounded-xl outline-none placeholder-[#8696a0] transition"
            />
          </div>

          {/* Payment Method Switch Tabs */}
          <div className="flex p-1 rounded-xl bg-[#202c33] border border-[#2a3942]">
            <button
              onClick={() => setActiveTab("apps")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === "apps"
                  ? "bg-[#00a884] text-[#0b141a] font-bold shadow-md"
                  : "text-[#8696a0] hover:text-white"
              }`}
            >
              <IoPhonePortraitOutline size={14} />
              <span>UPI Apps</span>
            </button>
            <button
              onClick={() => setActiveTab("qr")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === "qr"
                  ? "bg-[#00a884] text-[#0b141a] font-bold shadow-md"
                  : "text-[#8696a0] hover:text-white"
              }`}
            >
              <IoQrCodeOutline size={14} />
              <span>Scan QR Code</span>
            </button>
          </div>

          {/* TAB 1: UPI APPS (PhonePe, GPay, Paytm) */}
          {activeTab === "apps" ? (
            <div className="space-y-2.5 animate-fade-in">
              <p className="text-[11px] text-[#8696a0] text-center">
                Tap below to open your preferred UPI app:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {/* Google Pay */}
                <button
                  type="button"
                  onClick={() => handleLaunchUpiApp("Google Pay")}
                  className="p-3 rounded-2xl bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] flex items-center gap-2.5 transition active:scale-95 group text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-xs font-black shadow text-[#4285F4] shrink-0">
                    GPay
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-[#25d366] transition">
                      Google Pay
                    </p>
                    <p className="text-[10px] text-[#8696a0]">Instant Pay</p>
                  </div>
                </button>

                {/* PhonePe */}
                <button
                  type="button"
                  onClick={() => handleLaunchUpiApp("PhonePe")}
                  className="p-3 rounded-2xl bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] flex items-center gap-2.5 transition active:scale-95 group text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#5f259f] text-white flex items-center justify-center text-xs font-black shadow shrink-0">
                    Pe
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-[#25d366] transition">
                      PhonePe
                    </p>
                    <p className="text-[10px] text-[#8696a0]">Instant Pay</p>
                  </div>
                </button>

                {/* Paytm */}
                <button
                  type="button"
                  onClick={() => handleLaunchUpiApp("Paytm")}
                  className="p-3 rounded-2xl bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] flex items-center gap-2.5 transition active:scale-95 group text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#002e6e] text-[#00b9f1] flex items-center justify-center text-xs font-black shadow shrink-0">
                    Paytm
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-[#25d366] transition">
                      Paytm UPI
                    </p>
                    <p className="text-[10px] text-[#8696a0]">Instant Pay</p>
                  </div>
                </button>

                {/* BHIM / Any UPI App */}
                <button
                  type="button"
                  onClick={() => handleLaunchUpiApp("BHIM UPI")}
                  className="p-3 rounded-2xl bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] flex items-center gap-2.5 transition active:scale-95 group text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 text-white flex items-center justify-center text-xs font-black shadow shrink-0">
                    UPI
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-[#25d366] transition">
                      Other UPI
                    </p>
                    <p className="text-[10px] text-[#8696a0]">BHIM / Cred</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* TAB 2: LIVE UPI QR CODE SCANNER */
            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-[#0b141a] border border-[#202c33] animate-fade-in text-center">
              <div className="p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="UPI QR Code"
                  className="w-48 h-48 rounded-lg object-contain"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-[#e9edef]">
                  Scan with ANY UPI App to pay ₹{numAmount}
                </p>
                <p className="text-[10px] text-[#8696a0]">
                  GPay • PhonePe • Paytm • BHIM • Cred • Amazon Pay
                </p>
              </div>

              {/* Copy UPI Link button */}
              <button
                type="button"
                onClick={handleCopyUpi}
                className="py-1.5 px-3 rounded-lg bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-xs text-white font-medium flex items-center gap-1.5 transition active:scale-95"
              >
                <IoCopyOutline size={14} />
                <span>{copied ? "Copied Link! ✓" : "Copy UPI Payment Link"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer: Confirm & Send In-Chat Receipt */}
        <div className="p-4 bg-[#111b21] border-t border-[#202c33] flex flex-col gap-2">
          <button
            onClick={handleSendPaymentReceipt}
            disabled={isSubmitting || numAmount <= 0}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#00a884] to-[#25d366] hover:opacity-95 text-[#0b141a] font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <IoSend size={16} />
            <span>
              {isSubmitting
                ? "Processing..."
                : `Send ₹${numAmount} Payment Receipt to Chat`}
            </span>
          </button>
          <p className="text-[10px] text-[#8696a0] text-center">
            Generates WhatsApp Pay transaction confirmation in chat
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
