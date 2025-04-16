
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  PublicClientApplication, 
  AuthenticationResult, 
  AccountInfo 
} from '@azure/msal-browser';
import { appConfig } from '../config/appConfig';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Update authority with actual tenant ID
const msalConfig = {
  ...appConfig.msalConfig,
  auth: {
    ...appConfig.msalConfig.auth,
    authority: `https://login.microsoftonline.com/${appConfig.tenantId}`
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AccountInfo | null>(null);

  useEffect(() => {
    // Check if there's a user already logged in
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      setIsAuthenticated(true);
      setUser(accounts[0]);
    }
  }, []);

  const login = async (): Promise<void> => {
    try {
      // Login with popup, using empty array for scopes
      const response: AuthenticationResult = await msalInstance.loginPopup({
        scopes: []
      });
      
      if (response) {
        setIsAuthenticated(true);
        setUser(response.account);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = (): void => {
    msalInstance.logoutPopup().then(() => {
      setIsAuthenticated(false);
      setUser(null);
      // Clear any local storage
      sessionStorage.clear();
      localStorage.clear();
    }).catch(error => {
      console.error('Logout failed:', error);
    });
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      // Use silent token acquisition if possible
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        return null;
      }

      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: ['https://graph.microsoft.com/.default'],
        account: accounts[0]
      });

      return tokenResponse.accessToken;
    } catch (error) {
      console.error('Failed to get access token silently, trying popup', error);
      
      try {
        // If silent acquisition fails, try popup
        const tokenResponse = await msalInstance.acquireTokenPopup({
          scopes: ['https://graph.microsoft.com/.default']
        });
        return tokenResponse.accessToken;
      } catch (fallbackError) {
        console.error('Failed to get access token with popup', fallbackError);
        return null;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
