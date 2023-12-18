import React, { useState } from 'react';
import './loginpage.css';
import { checkLoginUser } from '../services/chatService';
import { useNavigate } from 'react-router-dom';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const checkForTheUser = async () => {
    const { user } = await checkLoginUser(email);
    return user;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const loggedInUser = await checkForTheUser();
    if (loggedInUser) {
      onLogin(loggedInUser);
      navigate('/chat')
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1 style={{ backgroundColor: 'e03038', color: '#e03038' }}>Kapture Internal Chat Application</h1>
      <label>
        Username:
        <input type="text" value={username} onChange={handleUsernameChange} />
      </label>
      <br />
      <label>
        Email:
        <input type="text" value={email} onChange={handleEmailChange} />
      </label>
      <br />
      <button type="submit">Login</button>
      <br />
    </form>
  );
}

export default LoginPage;
