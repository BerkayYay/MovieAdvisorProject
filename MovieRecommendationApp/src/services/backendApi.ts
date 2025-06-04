// Backend API Service
// Handles all interactions with our Node.js/Nest.js backend

import {BACKEND_API_URL, BACKEND_PORT, BACKEND_HOST} from '@env';
import {Platform} from 'react-native';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
  };
}

export interface RegisterResponse extends AuthResponse {
  message: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Get the appropriate backend URL based on platform and environment variables
const getBackendUrl = (): string => {
  // If full BACKEND_API_URL is set in .env, use it (highest priority)
  if (BACKEND_API_URL && BACKEND_API_URL !== 'your_backend_url_here') {
    return BACKEND_API_URL;
  }

  // Get port from environment or use default
  const port = BACKEND_PORT || '3000';

  // Get host from environment or use platform-specific defaults
  let host: string;
  if (BACKEND_HOST && BACKEND_HOST !== 'your_backend_host_here') {
    host = BACKEND_HOST;
  } else {
    // Use platform-specific defaults
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access localhost on the host machine
      host = '10.0.2.2';
    } else {
      // iOS simulator can use localhost directly
      host = 'localhost';
    }
  }

  return `http://${host}:${port}`;
};

// Configuration
const API_CONFIG = {
  BASE_URL: getBackendUrl(),
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

const makeAuthenticatedRequest = async <T>(
  url: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> => {
  const headers = {
    ...API_CONFIG.HEADERS,
    ...options.headers,
  };

  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  return await response.json();
};

const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  try {
    return await makeAuthenticatedRequest<T>(url, options, token);
  } catch (error) {
    if (error instanceof Error) {
      // Check for network-specific errors
      if (error.message.toLowerCase().includes('network request failed')) {
        throw new Error(
          `Backend API Error: Network request failed. Please check if the backend server is running at ${API_CONFIG.BASE_URL}`,
        );
      }
      throw new Error(`Backend API Error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while communicating with backend');
  }
};

export const authService = {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return await apiFetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    return await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getProfile(token: string): Promise<UserProfile> {
    return await apiFetch<UserProfile>(
      '/auth/profile',
      {
        method: 'GET',
      },
      token,
    );
  },

  async verifyToken(token: string): Promise<{valid: boolean; user: any}> {
    return await apiFetch<{valid: boolean; user: any}>(
      '/auth/verify',
      {
        method: 'GET',
      },
      token,
    );
  },
};

export const profileService = {
  async getProfile(token: string): Promise<UserProfile> {
    return await apiFetch<UserProfile>(
      '/profile',
      {
        method: 'GET',
      },
      token,
    );
  },

  async updateProfile(
    token: string,
    data: Partial<UserProfile>,
  ): Promise<UserProfile> {
    return await apiFetch<UserProfile>(
      '/profile',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      token,
    );
  },

  async changePassword(
    token: string,
    data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    },
  ): Promise<{message: string}> {
    return await apiFetch<{message: string}>(
      '/profile/password',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      token,
    );
  },
};

export const healthService = {
  async check(): Promise<{status: string; timestamp: string}> {
    return await apiFetch<{status: string; timestamp: string}>('/');
  },
};

export const isBackendConfigured = (): boolean => {
  return Boolean(
    API_CONFIG.BASE_URL && API_CONFIG.BASE_URL !== 'your_backend_url_here',
  );
};

export const getBackendStatus = () => {
  return {
    configured: isBackendConfigured(),
    baseUrl: API_CONFIG.BASE_URL,
  };
};

export const backendService = {
  auth: authService,
  profile: profileService,
  health: healthService,
  isConfigured: isBackendConfigured,
  getStatus: getBackendStatus,
};
