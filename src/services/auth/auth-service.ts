import axios, { AxiosError } from 'axios';

// Get the API URL from environment or default to current server
// const API_URL = process.env.REACT_APP_API_URL || '';
// console.log('Using API URL:', API_URL);

// For direct API call testing - use the Replit URL instead of localhost
const API_TEST_URL = window.location.origin;
console.log('Using API URL:', API_TEST_URL);

// Define a third option - the backend API directly
const DIRECT_API_URL = 'http://localhost:8080';
console.log('Using API URL:', DIRECT_API_URL);

// Create an array of URLs to try in order
const API_URLS: string[] = [
  '/api',
  `${API_TEST_URL}/api`,
  `${DIRECT_API_URL}/api`,
  'http://localhost:8080/api',
  window.location.href.includes('replit') ? `https://${window.location.hostname}/api` : ''
].filter(Boolean); // Remove any empty entries

console.log('Auth service trying these URLs:', API_URLS);

// ----------- TYPES -----------
interface Credentials {
  email: string;
  password: string;
}

interface UserData {
  name: string;
  email: string;
  password: string;
  tenantId?: string | number;
}

// ----------- Helper function -----------
async function tryAllUrls<T>(
  method: 'get' | 'post',
  endpoint: string,
  data: any = null,
  returnNullOn401: boolean = false
): Promise<T | null> {
  let lastError: any = null;

  for (const baseUrl of API_URLS) {
    const url = `${baseUrl}${endpoint}`;
    console.log(`Trying ${method.toUpperCase()} request to: ${url}`);

    try {
      const config = { withCredentials: true };
      let response;

      if (method === 'get') {
        response = await axios.get(url, config);
      } else {
        response = await axios.post(url, data, config);
      }

      console.log(`Success from ${url}:`, response.status);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(`Failed request to ${url}:`, err.message);

      if (returnNullOn401 && err.response && err.response.status === 401) {
        console.log('Returning null for 401 response');
        return null;
      }

      lastError = error;
    }
  }

  console.error('All API URLs failed');
  throw lastError;
}

// ----------- Auth Service -----------
const authService = {
  getCurrentUser: async (): Promise<any | null> => {
    try {
      return await tryAllUrls<any>('get', '/user', null, true);
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  login: async (credentials: Credentials): Promise<any> => {
    try {
      console.log('Sending login request with credentials:', {
        email: credentials.email,
        passwordLength: credentials.password.length,
      });

      return await tryAllUrls<any>('post', '/login', credentials);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },

  register: async (userData: UserData): Promise<any> => {
    try {
      return await tryAllUrls<any>('post', '/register', userData);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  logout: async (): Promise<boolean> => {
    try {
      await tryAllUrls('post', '/logout');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  directLogin: async (url: string, credentials: Credentials): Promise<any> => {
    console.log(`Direct login attempt to ${url}/api/login`);
    try {
      const response = await axios.post(`${url}/api/login`, credentials, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Direct login error:', error);
      throw error;
    }
  },
};

export default authService;
