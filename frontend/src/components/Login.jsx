import React, { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import {useDispatch} from "react-redux"
import { setAuthUser } from "../redux/userSlice";
import { BASE_URL } from "../config/api";

const Login = () => {
  const [user, setUser] = useState({
    username: "",
    password: "",
  });
  const dispatch=useDispatch();
const navigate=useNavigate();
  const onSubmitHandler =async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${BASE_URL}/api/v1/user/login`,
        user,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
        navigate("/");
        dispatch(setAuthUser(res.data));
        toast.success("Login successful!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Backend offline. Use 'Explore Demo Account' below to test!");
      console.log(error);
    }
    setUser({
      username: "",
      password: ""
    });
  };

  const demoLoginHandler = () => {
    const demoUser = {
      _id: "demo-user-me",
      fullName: "Md Irshad",
      username: "mdirshad",
      gender: "male",
      profilePhoto: ""
    };
    dispatch(setAuthUser(demoUser));
    toast.success("Welcome, Md Irshad (Demo Mode)!");
    navigate("/");
  };

  return (
    <div data-theme="light" className="h-screen w-screen flex items-center justify-center bg-[#f0f2f5] p-4">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-white border border-gray-200/80">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2 font-bold text-2xl">
            💬
          </div>
          <h1 className="text-2xl font-bold text-[#111b21]">Login to Chat</h1>
          <p className="text-xs text-gray-500 mt-1">Connect and message your friends</p>
        </div>
        <form onSubmit={onSubmitHandler} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Username
            </label>
            <input
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 !bg-white !text-[#111b21] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              type="text"
              placeholder="Enter your username"
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
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 !bg-white !text-[#111b21] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>
          <p className="text-center text-xs text-gray-600 pt-1">
            Don't have an account?{" "}
            <Link to="/signup" className="text-emerald-600 font-semibold hover:underline">
              Signup
            </Link>
          </p>
          <div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#00a884] hover:bg-[#008f6f] active:scale-98 text-white font-medium text-sm shadow-md transition-all"
            >
              Login
            </button>
          </div>

          <div className="relative flex items-center justify-center my-2 pt-1">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-2 text-xs text-gray-400">or</span>
            <div className="border-t border-gray-200 w-full"></div>
          </div>

          <div>
            <button
              type="button"
              onClick={demoLoginHandler}
              className="w-full py-2.5 rounded-lg border border-emerald-500/80 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 active:scale-98 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>🚀</span>
              <span>Explore Demo Account (Instant Access)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
