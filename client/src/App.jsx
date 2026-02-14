import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import OtpPage from "./pages/OtpPage";

function App() {
 const { authUser, isCheckingAuth, pendingEmail } = useContext(AuthContext);

  if (isCheckingAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0b141a]">
        <div className="w-10 h-10 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

return (
  <div className="bg-[#0b141a] min-h-screen text-gray-100">
    <Toaster
      toastOptions={{ style: { background: "#202c33", color: "#fff" } }}
    />

    <Routes>
      <Route
        path="/"
        element={authUser ? <HomePage /> : <Navigate to="/login" />}
      />

      <Route
        path="/verify-otp"
        element={pendingEmail ? <OtpPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/login"
        element={!authUser ? <LoginPage /> : <Navigate to="/" />}
      />

      <Route
        path="/profile"
        element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
      />
    </Routes>
  </div>
);

}

export default App;
