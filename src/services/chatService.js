import axios from 'axios';
import configParams from '../frontendConfig';

// Defined the base API URL
let baseUrl = `${configParams.appEnv}`;

if (baseUrl !== 'http://node.kapture.cx')  baseUrl = `${configParams.appEnv}:3001`;

async function getData(route) {
  try {
    const response = await axios.get(`${baseUrl}/${route}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${route}:`, error);
    throw error;
  }
}

async function getUsers() {
  try {
    const users = await getData('users');
    return users;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

async function checkLoginUser(email) {
  try {
    const response = await axios.post(`${baseUrl}/login`, { email: email });
    return response.data;
  } catch (error) {
    console.error(`Error while logging in`, error);
    throw error;
  }
}

async function logOutUser(id) {
  try {
    await axios.post(`${baseUrl}/logout`, { id: id });
  } catch (error) {
    throw error;
  }
}

export { getUsers, checkLoginUser, logOutUser };
