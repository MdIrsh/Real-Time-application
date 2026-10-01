export const getAvatarUrl = (user) => {
  if (user?.profilePhoto && !user.profilePhoto.includes("avatar.iran.liara.run")) {
    return user.profilePhoto;
  }
  const seed = encodeURIComponent(user?.username || user?.fullName || "User");
  return user?.gender === "female"
    ? `https://api.dicebear.com/10.x/lorelei/svg?seed=${seed}`
    : `https://api.dicebear.com/10.x/personas/svg?seed=${seed}`;
};

export const handleImageError = (e, name = "User") => {
  e.target.onerror = null;
  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
};
