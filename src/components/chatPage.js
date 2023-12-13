import React, { useState, useEffect, useRef } from 'react';
import './chatpage.css';
import { useNavigate } from 'react-router-dom';
import { getUsers } from '../services/chatService';
import Avatar from 'react-avatar';

function ChatPage({ loggedInUser, socket }) {
  const [usersArray, setUsersArray] = useState([]);
  const [usersGroup, setUsersGroup] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [fromUser, setFromUser] = useState(null);
  const [toUser, setToUser] = useState(null);
  const [toGroupName, setToGroupName] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [isIdle, setIsIdle] = useState(false);

  const messagesRef = useRef(null);
  const navigate = useNavigate();

  const fetchUsersAndGroups = async () => {
    try {
      const users = await getUsers();
      setUsersArray(users);

      const updatedGroups = users.reduce((groups, user) => {
        const existingGroup = groups.find((group) => group.name === user.group_id);

        if (existingGroup) {
          existingGroup.members.push(user);
        } else {
          const newGroup = {
            name: user.group_id,
            members: [user],
          };
          groups.push(newGroup);
        }

        return groups;
      }, []);

      const filteredGroup = updatedGroups.filter((group) => {
        return group.members.some((member) => member?.id === loggedInUser?.id);
      });

      setUsersGroup(filteredGroup);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    let idleTimer;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);

      idleTimer = setTimeout(() => {
        setIsIdle(true);
        socket.emit('close old connections', loggedInUser);
      }, 15000); // Adjust the time threshold (in milliseconds) as needed
    };

    const handleUserActivity = () => {
      setIsIdle(false);
      resetIdleTimer();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, []);

  useEffect(() => {
    const handleTyping = (typingInfo) => {
      if (typingInfo.action === 'typing' && typingInfo.from.id !== loggedInUser.id) {
        setIsTyping(true);
        setTypingUser(typingInfo.from);
      } else {
        setIsTyping(false);
        setTypingUser(null);
      }
    };

    socket.on('typing', handleTyping);

    return () => {
      socket.off('typing', handleTyping);
    };
  }, []);

  const startTyping = () => {
    let userMessage = payloadCreator();
    userMessage.action = 'typing';
    socket.emit('typing', userMessage);
  };

  const stopTyping = () => {
    let userMessage = payloadCreator();
    userMessage.action = 'stoppedTyping';
    socket.emit('typing', userMessage);
  };

  useEffect(() => {
    fetchUsersAndGroups();
  }, []);

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
    const handleReceivedMessage = (messages) => {
      messages.forEach((msg) => {
        if (msg?.message) {
          setMessages((prevMessages) => [...prevMessages, msg]);
        }
      });
    };

    socket.on('messageResponse', handleReceivedMessage);

    return () => {
      socket.off('messageResponse', handleReceivedMessage);
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    let chatInfo = {
      to: user,
      from: loggedInUser,
    }
    socket.emit('get user messages', chatInfo);
  }

  function selectGroup(group) {
    clearMessages();
    setToUser(group.members);
    setToGroupName(group.name);
    socket.emit('close old connections');
    let chatInfo = {
      to: group.name,
      from: loggedInUser,
    }
    socket.emit('get group messages', chatInfo);
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
              <Avatar className='avatar' name={user.name} round={true} size="30" textSizeRatio={1.75} />
              <strong onClick={() => selectUser(user)}>{user.name}</strong>
            </li>
          ))}
        </ul>
        <h1>Groups</h1>
        <ul>
          {usersGroup.map((group, index) => (
            <li key={index} className={toGroupName === group?.name ? 'selected' : ''}>
              <Avatar className='avatar' name={group.name} round={true} size="30" textSizeRatio={1.75} />
              <strong onClick={() => selectGroup(group)}>{group.name}</strong>
            </li>
          ))}
        </ul>
        <button className="log-out" onClick={() => logOut()}>
          Log Out
        </button>
      </div>
      {(toUser || toGroupName) && <div className="ChatPage">
        <div className="user-info">
          {toUser && <Avatar className='user-avatar' name={toUser?.name || toGroupName} round={true} size="40" textSizeRatio={1.75} />}
          <h2>{toUser?.name || toGroupName}</h2>
        </div>
        <h2 className="from-user">You: <Avatar className='from-user-avatar' name={loggedInUser?.name} round={true} size="40" textSizeRatio={1.75} />{fromUser?.name}</h2>
        {toGroupName && isTyping && (<h4 className='typing'>{`${typingUser?.name} is typing....`}</h4>)}
        {!toGroupName && isTyping && (<h4 className='typing'>Typing....</h4>)}
        <ul className="message-box" ref={messagesRef}>
          {messages &&
            messages.map((msg, index) => (
              <li key={index} className={msg?.from?.id === loggedInUser.id || msg?.from_user_id === loggedInUser.id ? 'right' : 'left'}>
                <strong>{(msg?.from?.email !== loggedInUser.email && toGroupName) && msg?.from?.name || (loggedInUser.id !== msg?.from_user_id && toGroupName) && msg?.user_name}</strong>
                <br />
                {msg?.message}
              </li>
            ))}
        </ul>
        <div className="line"></div>
        <form onSubmit={handleSendMessage}>
          <div className="chat-container">
            <input
              type="text"
              placeholder="Click here to type"
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                startTyping();
              }}
              onBlur={stopTyping}
              className="chat-input"
            />
            <button className="send-button" type="submit">Send</button>
          </div>
        </form>
      </div>}
    </div>
  );
}

export default ChatPage;
