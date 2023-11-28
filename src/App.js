import LoginPage from './components/loginPage';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ChatPage from './components/chatPage';
import React, { useState } from 'react';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleLogin = (user) => {
    if (user) setLoggedInUser(user);
    console.log(user, 'user logged in');
  };

  return (
    <Router>
      <Routes>
        <Route exact path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route exact path="/chat" element={<ChatPage loggedInUser={loggedInUser} />} />
      </Routes>
    </Router>
  );
}

export default App;
