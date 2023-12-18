import React, { useState, useEffect, useRef } from 'react';
import './chatpage.css';
import { getUsers, logOutUser } from '../services/chatService';
import Avatar from 'react-avatar';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import DoneAllSharpIcon from '@mui/icons-material/DoneAllSharp';
import Home from './homePage';
import AppBar from './appBar';
import SendTwoToneIcon from '@mui/icons-material/SendTwoTone';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { TypeAnimation } from 'react-type-animation';
const moment = require('moment');

function ChatPage({ loggedInUser, socket }) {
  const storedUser = JSON.parse(localStorage.getItem('accountUser'));
  const [accountUser, setAccountUser] = useState(storedUser || loggedInUser || null);
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
      let users = await getUsers();

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
        return group.members.some((member) => member?.id === accountUser?.id);
      });

      setUsersGroup(filteredGroup);

      users = users.filter((user) => user.id !== accountUser.id);
      setUsersArray(users);
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
        socket.emit('close old connections', accountUser);
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
      if (typingInfo.action === 'typing' && typingInfo.from.id !== accountUser.id) {
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
    if (loggedInUser) {
      localStorage.setItem('accountUser', JSON.stringify(loggedInUser));
    }
  }, [loggedInUser]);

  useEffect(() => {
    setFromUser(accountUser);
    setGroups((prevGroups) => {
      const filteredGroups = usersGroup.filter((group) => {
        const isUserInGroup = group.members.some((member) => Number(member.id) === Number(accountUser.id));
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
          console.log(messages,'mmmmmmmmmmmmmmmm')
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
      from: accountUser,
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
      from: accountUser,
    }
    socket.emit('get group messages', chatInfo);
  }

  function clearMessages() {
    setMessages([]);
    setInputMessage('');
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

  async function logOut() {
    socket.emit('close old connections', accountUser);
    localStorage.clear();
    navigate('/login');
    await logOutUser(accountUser?.id);
    window.location.reload();
  }

  function goToHome() {
    window.location.reload();
  }

  const renderTypingAnimation = (text, fontSize, marginLeft) => (
    <TypeAnimation
      sequence={[
        `${text}.`,
        500,
        `${text}..`,
        500,
        `${text}...`,
        500,
        `${text}....`,
        500
      ]}
      wrapper="span"
      speed={75}
      cursor={false}
      style={{ fontSize, display: 'inline-block', marginLeft }}
      repeat={Infinity}
    />
  );
  

  return (
    <>
    <AppBar loggedInUser={accountUser}/>
    <div className="App">
      <div className="UsersList">
        <h3 style={{ marginLeft: '130px', textDecoration: 'underline' }}>Users</h3>
        <ul>
          {usersArray.map((user, index) => (
            <li onClick={() => selectUser(user)} key={index} className={user?.id === toUser?.id ? 'selected' : 'chat-list'}>
              <Avatar className='avatar' name={user.name} round={true} size="30" textSizeRatio={1.75} />
              <strong>{user.name}</strong>
            </li>
          ))}
        </ul>
        <h3 style={{ marginLeft: '130px', textDecoration: 'underline' }}>Groups</h3>
        <ul>
          {usersGroup.map((group, index) => (
            <li onClick={() => selectGroup(group)} key={index} className={toGroupName === group?.name ? 'selected' : 'chat-list'}>
              <Avatar className='avatar' name={group.name} round={true} size="30" textSizeRatio={1.75} />
              <strong>{group.name}</strong>
            </li>
          ))}
        </ul>
        <button className="log-out" onClick={() => logOut()}>
          Log Out
        </button>
      </div>
      {(!toUser && !toGroupName) && <Home loggedInUser={accountUser}/>}
      {(toUser || toGroupName) && <div className="ChatPage">
        <div className="user-info">
          <ArrowBackIcon onClick={() => goToHome()} style={{paddingTop: 12, paddingRight: 20}}/>
          {toUser && <Avatar className='user-avatar' name={toUser?.name || toGroupName} round={true} size="30" textSizeRatio={1.75} />}
          <h3 className='to-user'>{toUser?.name || toGroupName}</h3>
        </div>
        <div className='line'></div>
        <ul className="message-box" ref={messagesRef}>
        {messages &&
          messages.map((msg, index) => (
            <li key={index} className={msg?.from?.id === accountUser.id || msg?.from_user_id === accountUser.id ? 'right' : 'left'}>
              <div>
                <span>({moment(msg?.timestamp).format('DD MMM YYYY H:mm')})</span>
              </div>
              <div>
                <strong>{(msg?.from?.email !== accountUser.email && toGroupName) && msg?.from?.name || (accountUser.id !== msg?.from_user_id && toGroupName) && msg?.user_name}</strong>
                <span>{msg?.message}</span>
                {msg?.message} {(msg?.from?.id === accountUser.id || msg?.from_user_id === accountUser.id) && !msg.is_delivered && <CheckIcon className='status-icons' />}
                {(msg?.from?.id === accountUser.id || msg?.from_user_id === accountUser.id) && (msg.is_delivered && !msg.is_seen) ? <DoneOutlineIcon className='status-icons' /> : null}
                {(msg?.from?.id === accountUser.id || msg?.from_user_id === accountUser.id) && (msg.is_delivered && msg.is_seen) ? <DoneAllSharpIcon className='status-icons' /> : null}
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={handleSendMessage}>
          <>
            {!toGroupName && isTyping && renderTypingAnimation('', '3em', '-200px')}
            {toGroupName && isTyping && renderTypingAnimation(typingUser?.name, '1.25em', '-170px')}
          </>
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
            <button className="send-button" type="submit"> <SendTwoToneIcon style={{ fontSize: 25, color: 'black' }}/></button>
          </div>
        </form>
      </div>}
    </div>
    </>
  );
}

export default ChatPage;
