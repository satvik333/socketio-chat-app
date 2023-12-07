import React, { useState, useEffect, useRef } from 'react';
import './chatpage.css';
import { usersArray, usersGroup } from './userList';
import { useNavigate } from 'react-router-dom';

function ChatPage({ loggedInUser, socket }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [fromUser, setFromUser] = useState(null);
  const [toUser, setToUser] = useState(null);
  const [toGroupName, setToGroupName] = useState(null);
  const [groups, setGroups] = useState([]);
  const messagesRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedInUser) {
      navigate('/login');
    }
  }, [loggedInUser]);

  useEffect(() => {
    setFromUser(loggedInUser);
    setGroups((prevGroups) => {
      const filteredGroups = usersGroup.filter((group) => {
        const isUserInGroup = group.members.some((member) => Number(member.id) === Number(loggedInUser.id));
        return isUserInGroup;
      });
      return filteredGroups;
    });
  }, [loggedInUser]);

  useEffect(() => {
    const handleReceivedMessage = (msg) => {
      if (msg.message) {
        setMessages((prevMessages) => [...prevMessages, msg]);
        scrollToBottom();
      }
    };

    // Add the event listener
    socket.on('messageResponse', handleReceivedMessage);

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      socket.off('messageResponse', handleReceivedMessage);
    };
  }, [socket]);

  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '') {
      let userMessage = payloadCreator();
      socket.emit('chat message', userMessage);
      setInputMessage('');
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (toUser && fromUser) {
      let userMessage = payloadCreator();
      socket.emit('chat message', userMessage);
    }
  }, [toUser]);

  function selectUser(user) {
    clearMessages();
    setToUser(user);
    setToGroupName(null);
    socket.emit('close old connections');
  }

  function selectGroup(group) {
    clearMessages();
    setToUser(group.members);
    setToGroupName(group.name);
    socket.emit('close old connections');
  }

  function clearMessages() {
    setMessages([]);
  }

  function payloadCreator() {
    return {
      to: toUser,
      from: fromUser,
      message: inputMessage,
      socketID: socket.id,
      groupName: toGroupName,
    };
  }

  function logOut() {
    window.location.reload();
  }

  return (
    <div className="App">
      <div className="UsersList">
        <h1>Users</h1>
        <ul>
          {usersArray.map((user, index) => (
            <li key={index} className={user?.id === toUser?.id ? 'selected' : ''}>
              <strong onClick={() => selectUser(user)}>{user.name}</strong>
            </li>
          ))}
        </ul>
        <h1>Groups</h1>
        <ul>
          {groups.map((group, index) => (
            <li key={index} className={toGroupName === group?.name ? 'selected' : ''}>
              <strong onClick={() => selectGroup(group)}>{group.name}</strong>
            </li>
          ))}
        </ul>
        <button className='log-out' onClick={() => logOut()}>Log Out</button>
      </div>
      <div className="ChatPage">
        <h2 className='from-user'>You: {fromUser?.name}</h2>
        <div className="line"></div>
        <ul className="message-box" ref={messagesRef}>
          {messages &&
            messages.map((msg, index) => (
              <li key={index} className={msg?.from?.email === loggedInUser.email ? 'right' : 'left'}>
                <strong>{(msg?.from?.email !== loggedInUser.email && toGroupName) && msg?.from?.name}</strong>
                <br />
                {msg?.message}
              </li>
            ))}
        </ul>
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Click here to type"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;
