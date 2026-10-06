import React, { useState, useRef, useEffect } from "react";
import { BsPlayFill, BsPauseFill, BsMicFill } from "react-icons/bs";

const WAVEFORM_HEIGHTS = [
  35, 60, 40, 80, 55, 95, 70, 45, 85, 65, 90, 50, 75, 100, 60, 80, 45, 70, 90,
  55, 85, 40, 65, 80, 50, 75, 40, 60
];

const VoiceMessagePlayer = ({ audioUrl, duration = 0, isSentByMe = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    if (duration > 0) {
      setTotalDuration(duration);
    }
  }, [duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.warn("Audio playback error:", e);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && (!totalDuration || totalDuration === 0)) {
      if (Number.isFinite(audioRef.current.duration)) {
        setTotalDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * (totalDuration || 1);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const cycleSpeed = (e) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !Number.isFinite(secs)) return "0:00";
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressRatio = totalDuration > 0 ? currentTime / totalDuration : 0;

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[220px] sm:min-w-[260px] max-w-sm select-none">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Play / Pause Circular Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 ${
          isSentByMe
            ? "bg-[#00a884] text-white hover:bg-[#008f6f]"
            : "bg-[#128c7e] text-white hover:bg-[#075e54]"
        }`}
        title={isPlaying ? "Pause" : "Play Voice Note"}
      >
        {isPlaying ? (
          <BsPauseFill className="text-xl" />
        ) : (
          <BsPlayFill className="text-2xl ml-0.5" />
        )}
      </button>

      {/* Waveform Bar & Progress Tracking */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        {/* Clickable Waveform container */}
        <div
          onClick={handleSeek}
          className="h-7 flex items-center gap-[2.5px] cursor-pointer py-1 group"
          title="Click to seek"
        >
          {WAVEFORM_HEIGHTS.map((heightPercent, idx) => {
            const barRatio = idx / WAVEFORM_HEIGHTS.length;
            const isPlayed = barRatio <= progressRatio;
            return (
              <span
                key={idx}
                style={{ height: `${heightPercent}%` }}
                className={`w-[3px] rounded-full transition-colors duration-100 ${
                  isPlayed
                    ? isSentByMe
                      ? "bg-[#00a884]"
                      : "bg-[#128c7e]"
                    : isSentByMe
                    ? "bg-[#a3d9b8]"
                    : "bg-gray-300 group-hover:bg-gray-400"
                }`}
              />
            );
          })}
        </div>

        {/* Bottom Time and Speed Pill */}
        <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 px-0.5">
          <span className="tabular-nums">
            {isPlaying ? formatTime(currentTime) : formatTime(totalDuration)}
          </span>

          <div className="flex items-center gap-2">
            {/* Speed Pill (1x / 1.5x / 2x) */}
            <button
              type="button"
              onClick={cycleSpeed}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/5 hover:bg-black/10 text-gray-700 transition-colors"
              title="Change playback speed"
            >
              {playbackRate}x
            </button>
            <BsMicFill
              className={`text-xs ${
                isSentByMe ? "text-[#00a884]" : "text-[#128c7e]"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
