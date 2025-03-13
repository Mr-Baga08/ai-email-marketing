// // client/src/contexts/AuthContext.jsx
// import React, { createContext, useState, useContext, useEffect } from 'react';
// import api from '../services/api';

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(localStorage.getItem('token'));
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchUser = async () => {
//       if (token) {
//         try {
//           // Set token in axios headers
//           api.setAuthToken(token);
          
//           // Fetch user profile
//           const response = await api.auth.getProfile();
//           setUser(response);
//         } catch (error) {
//           console.error('Error fetching user:', error);
//           // Handle token expiration or invalid token
//           if (error.response?.status === 401) {
//             localStorage.removeItem('token');
//             setToken(null);
//           }
//         }
//       }
//       setLoading(false);
//     };

//     fetchUser();
//   }, [token]);

//   const login = (newToken, userData) => {
//     localStorage.setItem('token', newToken);
//     setToken(newToken);
//     api.setAuthToken(newToken);
//     setUser(userData);
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     setToken(null);
//     setUser(null);
//     api.setAuthToken(null);
//   };

//   const updateUser = (newData) => {
//     setUser(prev => ({
//       ...prev,
//       ...newData
//     }));
//   };

//   const isAuthenticated = !!token && !!user;

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         token,
//         isAuthenticated,
//         login,
//         logout,
//         updateUser,
//         loading
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/apiSetup';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch the current user
  const fetchUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Add the token to Axios headers manually
      // This replaces the missing api.setAuthToken function
      const response = await api.auth.getProfile();
      setUser(response.data);
    } catch (err) {
      console.error('Error fetching user:', err);
      // Clear token if invalid
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        logout();
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData || null);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Update user function
  const updateUser = (updatedData) => {
    setUser(prevUser => ({ ...prevUser, ...updatedData }));
  };

  // Check if user is authenticated on mount and when token changes
  useEffect(() => {
    fetchUser();
  }, [token]);

  // Context value
  const contextValue = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;