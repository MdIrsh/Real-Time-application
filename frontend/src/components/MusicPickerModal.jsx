import React, { useState, useEffect, useRef } from "react";
import {
  IoClose,
  IoSearchOutline,
  IoMusicalNotes,
  IoPlay,
  IoCheckmarkCircle,
  IoSparkles,
  IoGlobeOutline,
} from "react-icons/io5";
import { STATUS_SONGS } from "../utils/statusSongs";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";

const CATEGORIES = [
  "All",
  "Trending",
  "Romantic",
  "Party",
  "Soulful",
  "90s Hits",
  "Punjabi Pop",
  "Lo-Fi",
  "Sufi",
  "Sad Songs",
];

const MusicPickerModal = ({ isOpen, onClose, onSelectSong, currentSong }) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [playingSongId, setPlayingSongId] = useState(null);
  const [onlineSongs, setOnlineSongs] = useState([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const audioRef = useRef(null);

  // Stop audio preview when modal is closed
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingSongId(null);
      setSearch("");
      setOnlineSongs([]);
    }
  }, [isOpen]);

  // Debounced online song search via backend
  useEffect(() => {
    const q = search.trim();
    if (!isOpen || q.length < 2) {
      setOnlineSongs([]);
      setIsSearchingOnline(false);
      return;
    }

    setIsSearchingOnline(true);
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/api/v1/status/search-songs?query=${encodeURIComponent(q)}`,
          { withCredentials: true }
        );
        if (res.data?.success && Array.isArray(res.data.songs)) {
          setOnlineSongs(res.data.songs);
        }
      } catch (err) {
        // Silently fall back to curated library
      } finally {
        setIsSearchingOnline(false);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [search, isOpen]);

  const getAudioUrl = (url) => {
    if (!url) return "";
    if (url.includes("jio.com") || url.includes("jiotune") || url.includes("saavn")) {
      return `${BASE_URL}/api/v1/status/stream-audio?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const handleTogglePlay = (e, song) => {
    e.stopPropagation();

    if (playingSongId === song.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingSongId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Try proxy stream first (bypasses ISP blocks, ad-blockers & browser CORS)
      const primaryUrl = getAudioUrl(song.audioUrl);
      const audio = new Audio(primaryUrl);
      audio.volume = 0.8;

      let fallbackTried = false;
      const tryFallback = () => {
        if (!fallbackTried && primaryUrl !== song.audioUrl) {
          fallbackTried = true;
          const directAudio = new Audio(song.audioUrl);
          directAudio.volume = 0.8;
          directAudio.onended = () => setPlayingSongId(null);
          directAudio.onerror = () => {
            toast.error("Audio preview not available for this song", {
              id: "audio-preview-toast",
            });
            setPlayingSongId(null);
          };
          directAudio.play().catch(() => {
            setPlayingSongId(null);
          });
          audioRef.current = directAudio;
          return;
        }
        toast.error("Audio preview not available for this song", {
          id: "audio-preview-toast",
        });
        setPlayingSongId(null);
      };

      audio.onerror = tryFallback;
      audio.onended = () => setPlayingSongId(null);
      audio.play().catch((err) => {
        if (err.name !== "AbortError") {
          tryFallback();
        }
      });

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

  // 1. Filter local curated songs based on search and category
  const localFiltered = STATUS_SONGS.filter((song) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      (song.movie && song.movie.toLowerCase().includes(q)) ||
      (song.category && song.category.toLowerCase().includes(q));
    const matchesCategory =
      selectedCategory === "All" ||
      song.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // 2. Deduplicate online songs against local matches
  const localUrls = new Set(localFiltered.map((s) => s.audioUrl));
  const localNormTitles = new Set(
    localFiltered.map((s) => s.title.toLowerCase().replace(/[^a-z0-9]/g, ""))
  );

  const filteredOnline = onlineSongs.filter((s) => {
    const norm = s.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    return !localUrls.has(s.audioUrl) && !localNormTitles.has(norm);
  });

  const allDisplaySongs = search.trim()
    ? [...localFiltered, ...filteredOnline]
    : localFiltered;

  if (!isOpen) return null;

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingSongId(null);
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#111b21] text-[#e9edef] rounded-2xl shadow-2xl border border-[#202c33] overflow-hidden flex flex-col h-[600px] max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#103629] flex items-center justify-center text-[#25d366] shadow-sm">
              <IoMusicalNotes size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#e9edef] flex items-center gap-1.5">
                Choose Music / Song
                <span className="text-[11px] text-[#25d366] font-medium bg-[#103629] px-2 py-0.5 rounded-full border border-[#25d366]/40">
                  {STATUS_SONGS.length}+ Hits
                </span>
              </h3>
              <p className="text-[11px] text-[#8696a0]">
                Every song has distinct, genuine audio overlay
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8696a0] hover:text-white hover:bg-[#111b21] transition cursor-pointer"
            aria-label="Close music picker"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Search Bar & Category Chips */}
        <div className="p-3.5 bg-[#0b141a] border-b border-[#202c33]">
          <div className="relative flex items-center bg-[#202c33] rounded-full px-4 h-12 border border-[#2a3942] focus-within:border-[#25d366] focus-within:ring-2 focus-within:ring-[#25d366]/25 shadow-inner transition-all">
            <IoSearchOutline
              size={20}
              className="text-[#8696a0] mr-2.5 shrink-0"
            />
            <input
              type="text"
              placeholder="Search any Bollywood song or artist (Arijit, Atif, Kesariya)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm sm:text-[15px] text-[#e9edef] placeholder-[#8696a0] outline-none border-none focus:outline-none focus:ring-0 leading-normal"
              autoFocus
            />
            {isSearchingOnline && (
              <div className="w-4 h-4 border-2 border-[#25d366] border-t-transparent rounded-full animate-spin shrink-0 mr-2" />
            )}
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="w-6 h-6 rounded-full bg-[#374248] hover:bg-[#4a5860] text-gray-300 hover:text-white flex items-center justify-center text-xs ml-1 transition cursor-pointer shrink-0"
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

        {/* Live Search Indicator */}
        {search.trim() && (
          <div className="px-4 py-1.5 bg-[#182229] border-b border-[#202c33] flex items-center justify-between text-[11px] text-[#8696a0]">
            <span className="flex items-center gap-1.5">
              <IoGlobeOutline className="text-[#25d366]" size={13} />
              Showing {allDisplaySongs.length} unique songs for "{search}"
            </span>
            {isSearchingOnline && (
              <span className="text-[#25d366] animate-pulse">
                Searching online catalog...
              </span>
            )}
          </div>
        )}

        {/* Song List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#202c33]/40 bg-[#0b141a]">
          {allDisplaySongs.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 rounded-full bg-[#202c33] flex items-center justify-center text-[#8696a0] mb-3">
                <IoMusicalNotes size={24} />
              </div>
              <p className="text-sm font-medium text-[#e9edef]">
                No songs found matching "{search}"
              </p>
              <p className="text-xs text-[#8696a0] mt-1 max-w-xs">
                Try searching by song name (e.g. Kesariya, Tum Hi Ho) or singer
                (Arijit, Atif, Diljit, Sidhu)
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#202c33] hover:bg-[#26353d] text-[#25d366] transition cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            allDisplaySongs.map((song) => {
              const isSelected =
                currentSong?.id === song.id || currentSong?.title === song.title;
              const isPlaying = playingSongId === song.id;

              return (
                <div
                  key={song.id}
                  onClick={() => handleSelect(song)}
                  className={`flex items-center justify-between px-3.5 py-2.5 hover:bg-[#202c33]/70 transition cursor-pointer group ${
                    isSelected
                      ? "bg-[#103629]/40 border-l-2 border-[#25d366]"
                      : ""
                  }`}
                >
                  {/* Left: Album cover with play button + Title & Artist */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md bg-[#202c33]">
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src =
                            "https://c.saavncdn.com/179/World-Music-Day-Best-Of-Bollywood-Hits-Hindi-2026-20260622111029-500x500.jpg";
                        }}
                      />
                      {/* Play / Pause Overlay Button */}
                      <button
                        type="button"
                        onClick={(e) => handleTogglePlay(e, song)}
                        className={`absolute inset-0 flex items-center justify-center transition cursor-pointer ${
                          isPlaying
                            ? "bg-black/60"
                            : "bg-black/40 hover:bg-black/65"
                        }`}
                        title={isPlaying ? "Pause Preview" : "Play Preview"}
                      >
                        {isPlaying ? (
                          <div className="flex items-end justify-center gap-0.5 h-4">
                            <span className="w-1 h-3 bg-[#25d366] animate-pulse rounded-full" />
                            <span className="w-1 h-4 bg-[#25d366] animate-bounce rounded-full" />
                            <span className="w-1 h-2 bg-[#25d366] animate-pulse rounded-full" />
                          </div>
                        ) : (
                          <IoPlay size={18} className="text-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-[#e9edef] truncate flex items-center gap-1.5">
                        <span className="truncate">{song.title}</span>
                        {isSelected && (
                          <IoCheckmarkCircle
                            size={15}
                            className="text-[#25d366] shrink-0"
                          />
                        )}
                        {song.isOnline && (
                          <span className="text-[9px] bg-[#103629] text-[#25d366] px-1.5 py-0.2 rounded-full font-normal shrink-0 border border-[#25d366]/30 flex items-center gap-0.5">
                            <IoSparkles size={8} /> Online
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-[#8696a0] truncate mt-0.5">
                        {song.artist}
                      </p>
                      {song.movie && song.movie !== song.artist && (
                        <p className="text-[10px] text-[#8696a0]/80 truncate">
                          Album: {song.movie}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Category badge + Add Button */}
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="hidden sm:inline-block text-[10px] text-[#8696a0] px-2 py-0.5 rounded-full bg-[#202c33]">
                      {song.category || "Bollywood"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(song);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 ${
                        isSelected
                          ? "bg-[#25d366] text-[#0b141a]"
                          : "bg-[#25d366]/20 hover:bg-[#25d366] text-[#25d366] hover:text-[#0b141a]"
                      }`}
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
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#25d366] animate-pulse" />
            Tap album art to preview audio
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg bg-[#25d366] text-[#0b141a] font-semibold hover:bg-[#20bd5a] transition cursor-pointer shadow-sm active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default MusicPickerModal;
