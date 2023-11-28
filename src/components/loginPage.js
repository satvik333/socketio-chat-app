import React, { useState } from 'react';
import './loginpage.css';
import { usersArray } from './userList';
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

  const checkForTheUser = () => {
    const loginUser = usersArray.find((user) => user.email === email);
    return loginUser;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const loggedInUser = checkForTheUser();
    if (loggedInUser) {
      onLogin(loggedInUser);
      navigate('/chat')
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
