import React, { useState, useEffect, useRef } from "react";
import {
  IoClose,
  IoSearchOutline,
  IoMusicalNotes,
  IoPlay,
  IoCheckmarkCircle,
} from "react-icons/io5";
import { STATUS_SONGS } from "../utils/statusSongs";
import toast from "react-hot-toast";

const CATEGORIES = [
  "All",
  "Romantic",
  "Party",
  "Trending",
  "Love",
  "Classics",
  "Travel",
  "Acoustic",
  "Workout",
];

const MusicPickerModal = ({ isOpen, onClose, onSelectSong, currentSong }) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [playingSongId, setPlayingSongId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Stop audio preview when modal is closed
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingSongId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePlay = (e, song) => {
    e.stopPropagation();

    if (playingSongId === song.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingSongId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(song.audioUrl);
      audio.volume = 0.7;
      audio.play().catch(() => {});
      audio.onended = () => setPlayingSongId(null);
      audioRef.current = audio;
      setPlayingSongId(song.id);
    }
  };

  const handleSelect = (song) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingSongId(null);
    onSelectSong(song);
    toast.success(`Selected "${song.title}"! 🎵`, { id: "song-pick-toast" });
    onClose();
  };

  // Filter songs based on search query and category
  const filteredSongs = STATUS_SONGS.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.artist.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || song.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#111b21] text-[#e9edef] rounded-2xl shadow-2xl border border-[#202c33] overflow-hidden flex flex-col h-[560px] max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942]">
          <div className="flex items-center gap-2">
            <IoMusicalNotes className="text-[#25d366]" size={18} />
            <h3 className="font-bold text-sm text-[#e9edef]">Choose Music / Song</h3>
          </div>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8696a0] hover:text-white hover:bg-[#111b21] transition"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 bg-[#0b141a] border-b border-[#202c33]">
          <div className="relative flex items-center bg-[#202c33] rounded-full px-4 h-12 border border-[#2a3942] focus-within:border-[#25d366] focus-within:ring-2 focus-within:ring-[#25d366]/25 shadow-inner transition-all">
            <IoSearchOutline size={20} className="text-[#8696a0] mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Search Bollywood songs or artists (e.g. Arijit, Kesariya)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm sm:text-[15px] text-[#e9edef] placeholder-[#8696a0] outline-none border-none focus:outline-none focus:ring-0 leading-normal"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="w-6 h-6 rounded-full bg-[#374248] hover:bg-[#4a5860] text-gray-300 hover:text-white flex items-center justify-center text-xs ml-1.5 transition cursor-pointer shrink-0"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition cursor-pointer active:scale-95 ${
                  selectedCategory === cat
                    ? "bg-[#103629] text-[#25d366] border border-[#25d366]/60 font-semibold shadow-xs"
                    : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#26353d]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Song List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#202c33]/40 bg-[#0b141a]">
          {filteredSongs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8696a0]">
              No songs found matching "{search}"
            </div>
          ) : (
            filteredSongs.map((song) => {
              const isSelected = currentSong?.id === song.id || currentSong?.title === song.title;
              const isPlaying = playingSongId === song.id;

              return (
                <div
                  key={song.id}
                  onClick={() => handleSelect(song)}
                  className={`flex items-center justify-between px-3.5 py-2.5 hover:bg-[#202c33]/70 transition cursor-pointer group ${
                    isSelected ? "bg-[#103629]/40 border-l-2 border-[#25d366]" : ""
                  }`}
                >
                  {/* Left: Album cover + Title & Artist */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-md">
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Play / Pause Overlay Button */}
                      <button
                        type="button"
                        onClick={(e) => handleTogglePlay(e, song)}
                        className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition"
                        title={isPlaying ? "Pause Preview" : "Play Preview"}
                      >
                        {isPlaying ? (
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3 bg-[#25d366] animate-pulse rounded-full" />
                            <span className="w-1 h-4 bg-[#25d366] animate-bounce rounded-full" />
                            <span className="w-1 h-2 bg-[#25d366] animate-pulse rounded-full" />
                          </div>
                        ) : (
                          <IoPlay size={16} className="text-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-[#e9edef] truncate flex items-center gap-1.5">
                        {song.title}
                        {isSelected && (
                          <IoCheckmarkCircle
                            size={14}
                            className="text-[#25d366] shrink-0"
                          />
                        )}
                      </h4>
                      <p className="text-[11px] text-[#8696a0] truncate mt-0.5">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  {/* Right: Select / Play indicator */}
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] text-[#8696a0] px-2 py-0.5 rounded-full bg-[#202c33]">
                      {song.category}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(song);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#25d366]/20 hover:bg-[#25d366] text-[#25d366] hover:text-[#0b141a] transition cursor-pointer"
                    >
                      {isSelected ? "✓ Selected" : "+ Add"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#111b21] border-t border-[#202c33] flex items-center justify-between text-xs text-[#8696a0]">
          <span>Tap play icon to preview audio</span>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              onClose();
            }}
            className="text-[#25d366] font-semibold hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MusicPickerModal;
