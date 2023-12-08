import axios from 'axios';

// Define the base API URL
const baseUrl = 'http://localhost:3001';

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

export { getUsers };
