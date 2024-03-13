import LoginPage from "./components/loginPage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ChatPage from "./components/chatPage";
import React, { useState } from "react";
import socketIO from "socket.io-client";

function App() {
  let socket;
  try {
      socket = socketIO.connect("http://node.kapture.cx");
  } catch (error) {
      socket = socketIO.connect("http://172.16.0.132:3001");
  }
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleLogin = (user) => {
    if (user) setLoggedInUser(user);
  };

  return (
    <Router>
      <Routes>
        <Route
          exact
          path="/login"
          element={<LoginPage onLogin={handleLogin} />}
        />
        <Route
          exact
          path="/chat"
          element={<ChatPage loggedInUser={loggedInUser} socket={socket} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
