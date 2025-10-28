"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginResponse } from '@/types/LoginResponse';


type User = LoginResponse['user'] | null;

type LoginCredentials = {
  username: string;
  password: string;
  captcha?: string;
};

type AuthContextType = {
  user: User;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const validateSession = async (storedUser: string | null) => {

    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('No token found');
      return false;
    }

    try {
      const response = await fetch('/api/proxy?service=auth&path=auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();

      // Get the stored user data
      const storedUserData = storedUser ? JSON.parse(storedUser) : null;

      // Update user data with the token and preserve id_empresa
      const updatedUser = {
        ...userData,
        token: token,
        // Use the stored id_empresa if it exists, otherwise use the one from the API
        idPersona: storedUserData?.idPersona || userData.idPersona,
        id_empresa: storedUserData?.id_empresa || userData.id_empresa || storedUserData?.user?.id_empresa
      };
      
      const userString = JSON.stringify(updatedUser);
      
      // Update user data in state and storage
      setUser(updatedUser);
      localStorage.setItem('user', userString);
      
      return true;
    } catch (error) {
      // Clear invalid data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      // First try to load user from localStorage for quick display
      const storedUser = localStorage.getItem('user');

      // If we have a stored user, set it immediately for better UX
      if (storedUser) {
        try {
          const userParsed = JSON.parse(storedUser);
          setUser(userParsed);
        } catch (error) {
          localStorage.removeItem('user');
        }
      }

      // Then validate session with server
      try {
        const isValid = await validateSession(storedUser);

        if (!isValid && storedUser) {
          // If we had a stored user but validation failed, clear it
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Set up periodic session validation
    const intervalId = setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(intervalId);
  }, []);

  // Actualizar el localStorage cuando el usuario cambie
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async ({ username, password, captcha }: LoginCredentials): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const requestBody: any = { username, password };

      // If a reCAPTCHA token is provided, include it in the request
      if (captcha) {
        requestBody.recaptchaToken = captcha;
      }

      const response = await fetch(`/api/proxy?service=auth&path=usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(requestBody),
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`Error en el servidor (${response.status})`);
        }
        throw new Error(errorData.message || 'Error en las credenciales');
      }

      const data = await response.json();      
      const token = data.token || data.access_token;
      const userData = data.user || data;
      
      if (token) { 
        
        if (!userData) {
          throw new Error('No user data in response');
        }
        
        // Ensure id_empresa is set from the API response
        const userWithCompany = {
          ...userData,
          token: token,
          // Use the company ID from the user data
          id_empresa: userData.id_empresa
        };
        
        const userString = JSON.stringify(userWithCompany);
        localStorage.setItem('user', userString);
        localStorage.setItem('token', token);
        setUser(userWithCompany);
        
        // Validate the session after successful login
        const isValid = await validateSession(userString);
        if (!isValid) {
          throw new Error('Error al validar la sesión después del inicio de sesión');
        }
      } else {
        throw new Error('No se recibieron datos de usuario en la respuesta');
      }
    } catch (error) {
      setUser(null);
      // Si el error es un mensaje específico del servidor, lo mostramos tal cual
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('usuario no encontrado')) {
          throw new Error('Usuario no encontrado. Verifica tu nombre de usuario.');
        } else if (errorMessage.includes('contraseña incorrecta')) {
          throw new Error('Contraseña incorrecta. Por favor, verifica tus credenciales.');
        }
        throw error;
      }
      // Para otros errores, lanzamos un mensaje genérico
      throw new Error('Error al iniciar sesión. Por favor, verifica tus credenciales e inténtalo de nuevo.');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      // Get the token from localStorage or user object
      const token = localStorage.getItem('token') || user?.token;
      
      // Make the logout request with the token if available
      const response = await fetch(`/api/proxy?service=auth&path=auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // If we get a 401, it might mean the session is already expired, which is fine for logout
      if (!response.ok && response.status !== 401) {
        throw new Error(`Logout failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with cleanup even if the request fails
    } finally {
      // Clear user state
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Clear all cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      });
      
      // Redirect to login
      router.push('/login');
      router.refresh(); // Force a refresh to ensure clean state
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
