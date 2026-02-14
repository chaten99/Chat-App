import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { useAuth0 } from "@auth0/auth0-react";


const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithRedirect, isLoading: auth0Loading } = useAuth0();


  const { login } = useContext(AuthContext);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (currState === "Sign up" && !isDataSubmitted) {
        setIsDataSubmitted(true);
        return;
      }

      await login(currState === "Sign up" ? "signup" : "login", {
        fullName,
        email,
        password,
        bio,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b141a] px-4">
      <div className="w-full max-w-md bg-[#111b21] p-8 rounded-xl shadow-xl">
        <div className="flex justify-center mb-6">
          <img src={assets.logo_big} alt="" className="w-32" />
        </div>

        <form onSubmit={onSubmitHandler} className="flex flex-col gap-5">
          <h2 className="text-2xl font-semibold text-center text-white">
            {currState}
          </h2>

          {currState === "Sign up" && !isDataSubmitted && (
            <input
              onChange={(e) => setFullName(e.target.value)}
              value={fullName}
              type="text"
              placeholder="Full Name"
              required
              className="px-4 py-2 bg-[#202c33] rounded-md text-white outline-none focus:ring-2 focus:ring-[#00a884]"
            />
          )}

          {!isDataSubmitted && (
            <>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                type="email"
                placeholder="Email Address"
                required
                className="px-4 py-2 bg-[#202c33] rounded-md text-white outline-none focus:ring-2 focus:ring-[#00a884]"
              />
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                type="password"
                placeholder="Password"
                required
                className="px-4 py-2 bg-[#202c33] rounded-md text-white outline-none focus:ring-2 focus:ring-[#00a884]"
              />
            </>
          )}

          {currState === "Sign up" && isDataSubmitted && (
            <textarea
              onChange={(e) => setBio(e.target.value)}
              value={bio}
              rows={4}
              placeholder="Write a short bio..."
              required
              className="px-4 py-2 bg-[#202c33] rounded-md text-white outline-none focus:ring-2 focus:ring-[#00a884]"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-2 bg-[#00a884] hover:bg-[#019f7a] transition rounded-md font-medium text-black flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : currState === "Sign up" ? (
              "Create Account"
            ) : (
              "Login"
            )}
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <input type="checkbox" required className="accent-[#00a884]" />
            <p>Agree to the terms & privacy policy</p>
          </div>

          <p className="text-center text-sm text-gray-400">
            {currState === "Login" ? (
              <>
                Don’t have an account?{" "}
                <span
                  onClick={() => setCurrState("Sign up")}
                  className="text-[#00a884] cursor-pointer hover:underline"
                >
                  Create one
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span
                  onClick={() => setCurrState("Login")}
                  className="text-[#00a884] cursor-pointer hover:underline"
                >
                  Login
                </span>
              </>
            )}
          </p>
        </form>
<div className="flex items-center gap-3 my-4">
  <div className="flex-1 h-px bg-[#2a3942]" />
  <span className="text-xs text-gray-400">OR</span>
  <div className="flex-1 h-px bg-[#2a3942]" />
</div>

<button
  type="button"
  onClick={() => loginWithRedirect()}
  disabled={auth0Loading}
  className="w-full py-2 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
>
  {auth0Loading ? (
    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
  ) : (
    "Continue with Auth0"
  )}
</button>

      </div>
    </div>
  );
};

export default LoginPage;
