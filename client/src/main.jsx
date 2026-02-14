import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProdiver } from "../context/AuthContext.jsx";

import { ChatProvider } from "../context/ChatContext.jsx";
import { Auth0Provider } from "@auth0/auth0-react";
import { BrowserRouter as Router } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
    }}
  >
    <Router>
      <AuthProdiver>
        <ChatProvider>
          <App />
        </ChatProvider>
      </AuthProdiver>
    </Router>
  </Auth0Provider>
  
);
