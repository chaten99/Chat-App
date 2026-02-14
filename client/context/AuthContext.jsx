import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProdiver = ({ children }) => {

  const {
    logout: auth0Logout,
    isAuthenticated,
    user,
    isLoading: auth0Loading,
  } = useAuth0();

  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [pendingEmail, setPendingEmail] = useState(null);
  const navigate = useNavigate();

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");

      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      console.log(error.message);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);

      if (data.success) {
        if (data.message === "OTP sent to email") {
          setPendingEmail(data.email);
          toast.success("OTP sent to your email");
          navigate("/verify-otp");
          return;
        }

        setAuthUser(data.userData);
        connectSocket(data.userData);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const verifyOtp = async (otp) => {
    try {
      const { data } = await axios.post("/api/auth/verify-otp", {
        email: pendingEmail,
        otp,
      });

      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
        setPendingEmail(null);
        toast.success("Account verified");
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);

      if (data.success && data.user) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");

      setAuthUser(null);
      setOnlineUsers([]);
      socket?.disconnect();

      if (isAuthenticated) {
        auth0Logout({
          logoutParams: {
            returnTo: window.location.origin,
          },
        });
        return;
      }

      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error(error.message);
    }
  };

  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
      withCredentials: true,
    });

    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => setOnlineUsers(userIds));
  };

  useEffect(() => {
    if (!auth0Loading) {
      checkAuth();
    }
  }, [auth0Loading]);

  useEffect(() => {
    const syncAuth0User = async () => {
      try {
        if (
          isAuthenticated &&
          user &&
          !authUser &&
          !auth0Loading &&
          !pendingEmail
        ) {
          const { data } = await axios.post("/api/auth/auth0", {
            email: user.email,
            name: user.name,
            picture: user.picture,
            sub: user.sub,
          });

          if (data.success) {
            setAuthUser(data.userData);
            connectSocket(data.userData);
            toast.success("Logged in with Auth0");
          }
        }
      } catch (err) {
        console.log("Auth0 sync error:", err.message);
      }
    };

    syncAuth0User();
  }, [isAuthenticated, user, authUser, auth0Loading, pendingEmail]);


  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
    isCheckingAuth,
    pendingEmail,
    verifyOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
