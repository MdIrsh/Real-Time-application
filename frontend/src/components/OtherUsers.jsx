import React from "react";
import OtherUser from "./OtherUser";
import useGetOtherUsers from "../hooks/useGetOtherUsers";
import { useSelector } from "react-redux";

const OtherUsers = ({ search = "" }) => {
  useGetOtherUsers();
  const { otherUsers } = useSelector((store) => store.user);

  if (!otherUsers) {
    return (
      <div className="flex items-center justify-center h-40 text-[#8696a0] text-sm">
        Loading contacts...
      </div>
    );
  }

  const filteredUsers = otherUsers.filter((user) => {
    if (!search.trim()) return true;
    return (
      user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (filteredUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-[#8696a0] text-sm px-4 text-center">
        No contacts found
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {filteredUsers.map((user) => (
        <OtherUser key={user._id} user={user} />
      ))}
    </div>
  );
};

export default OtherUsers;
