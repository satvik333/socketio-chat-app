import LoginPage from './components/loginPage';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ChatPage from './components/chatPage';
import React, { useState } from 'react';
import socketIO from 'socket.io-client';

function App() {
  const socket = socketIO.connect('http://172.16.0.165:3001');
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleLogin = (user) => {
    if (user) setLoggedInUser(user);
  };

  return (
    <Router>
      <Routes>
        <Route exact path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route exact path="/chat" element={<ChatPage loggedInUser={loggedInUser} socket={socket} />} />
      </Routes>
    </Router>
  );
}

export default App;
