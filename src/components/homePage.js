import React from 'react';
import './homepage.css'

const Home = ({ loggedInUser }) => {
  return (
    <div className='home-page'>
      <h1>Welcome, {loggedInUser?.name}!</h1>
      <p>Ready? Set. Chat! Let's jump right into things.</p>
    </div>
  );
};

export default Home;
