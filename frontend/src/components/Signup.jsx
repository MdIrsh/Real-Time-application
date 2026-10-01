import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
const Signup = () => {
  const [user, setUser] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });
  const navigate=useNavigate();
  const handleCheckbox = (gender) => {
    setUser({ ...user, gender });
  };
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `http://localhost:5000/api/v1/user/register`,
        user,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        navigate("/login");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Signup failed!");
      console.log(error);
    }
    setUser({
      fullName: "",
      username: "",
      password: "",
      confirmPassword: "",
      gender: "",
    });
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#f0f2f5] p-4">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-white border border-gray-200/80">
        <div className="flex flex-col items-center mb-5">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2 font-bold text-2xl">
            💬
          </div>
          <h1 className="text-2xl font-bold text-[#111b21]">Create an Account</h1>
          <p className="text-xs text-gray-500 mt-1">Join to start messaging your friends</p>
        </div>
        <form onSubmit={onSubmitHandler} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <input
              value={user.fullName}
              onChange={(e) => setUser({ ...user, fullName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm text-[#111b21] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              type="text"
              placeholder="Full Name"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Username
            </label>
            <input
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm text-[#111b21] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              type="text"
              placeholder="Username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm text-[#111b21] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              type="password"
              placeholder="Password"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              value={user.confirmPassword}
              onChange={(e) =>
                setUser({ ...user, confirmPassword: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm text-[#111b21] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              type="password"
              placeholder="Confirm Password"
              required
            />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <span className="text-xs font-semibold text-gray-700">Gender:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700">
              <input
                type="radio"
                name="gender"
                checked={user.gender === "male"}
                onChange={() => handleCheckbox("male")}
                className="accent-emerald-600"
              />
              Male
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700">
              <input
                type="radio"
                name="gender"
                checked={user.gender === "female"}
                onChange={() => handleCheckbox("female")}
                className="accent-emerald-600"
              />
              Female
            </label>
          </div>

          <p className="text-center text-xs text-gray-600 pt-1">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
              Login
            </Link>
          </p>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#00a884] hover:bg-[#008f6f] active:scale-98 text-white font-medium text-sm shadow-md transition-all"
            >
              Signup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
