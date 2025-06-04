import AsyncStorage from '@react-native-async-storage/async-storage';
import {backendService} from '../services/backendApi';

const AUTH_STORAGE_KEY = 'USER_AUTH_STATE';
const ONBOARDING_STORAGE_KEY = 'ONBOARDING_COMPLETED';

export interface AuthState {
  isLoggedIn: boolean;
  userToken?: string;
  userId?: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  hasCompletedOnboarding: boolean;
}

export const getAuthState = async (): Promise<AuthState> => {
  try {
    const authStateString = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    const onboardingCompleted = await AsyncStorage.getItem(
      ONBOARDING_STORAGE_KEY,
    );

    const defaultState: AuthState = {
      isLoggedIn: false,
      hasCompletedOnboarding: onboardingCompleted === 'true',
    };

    if (!authStateString) {
      return defaultState;
    }

    const authState = JSON.parse(authStateString);
    return {
      ...defaultState,
      ...authState,
      hasCompletedOnboarding: onboardingCompleted === 'true',
    };
  } catch (error) {
    console.error('Error getting auth state:', error);
    return {
      isLoggedIn: false,
      hasCompletedOnboarding: false,
    };
  }
};

export const saveAuthState = async (
  authState: Partial<AuthState>,
): Promise<void> => {
  try {
    const currentState = await getAuthState();
    const newState = {...currentState, ...authState};

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));

    if (newState.hasCompletedOnboarding) {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    }
  } catch (error) {
    console.error('Error saving auth state:', error);
  }
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<boolean> => {
  try {
    const response = await backendService.auth.login({
      email,
      password,
    });

    await saveAuthState({
      isLoggedIn: true,
      userToken: response.access_token,
      userId: response.user.id,
      email: response.user.email,
      username: response.user.username || undefined,
      firstName: response.user.firstName || undefined,
      lastName: response.user.lastName || undefined,
      hasCompletedOnboarding: true,
    });

    return true;
  } catch (error) {
    console.error('Error logging in user:', error);
    return false;
  }
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
): Promise<boolean> => {
  try {
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const response = await backendService.auth.register({
      email,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });

    await saveAuthState({
      isLoggedIn: true,
      userToken: response.access_token,
      userId: response.user.id,
      email: response.user.email,
      username: response.user.username || undefined,
      firstName: response.user.firstName || undefined,
      lastName: response.user.lastName || undefined,
      hasCompletedOnboarding: true,
    });

    return true;
  } catch (error) {
    console.error('Error registering user:', error);
    return false;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await saveAuthState({
      isLoggedIn: false,
      userToken: undefined,
      userId: undefined,
      email: undefined,
      username: undefined,
      firstName: undefined,
      lastName: undefined,
    });
  } catch (error) {
    console.error('Error logging out user:', error);
  }
};

export const verifyUserToken = async (): Promise<boolean> => {
  try {
    const authState = await getAuthState();

    if (!authState.userToken) {
      return false;
    }

    const response = await backendService.auth.verifyToken(authState.userToken);

    if (response.valid) {
      await saveAuthState({
        isLoggedIn: true,
      });
      return true;
    } else {
      await logoutUser();
      return false;
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    await logoutUser();
    return false;
  }
};

export const getUserProfile = async (): Promise<any | null> => {
  try {
    const authState = await getAuthState();

    if (!authState.userToken) {
      return null;
    }

    const profile = await backendService.auth.getProfile(authState.userToken);

    await saveAuthState({
      userId: profile.id,
      email: profile.email,
      username: profile.username || undefined,
      firstName: profile.firstName || undefined,
      lastName: profile.lastName || undefined,
    });

    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const completeOnboarding = async (): Promise<void> => {
  try {
    await saveAuthState({
      hasCompletedOnboarding: true,
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
  }
};

export const shouldShowOnboarding = async (): Promise<boolean> => {
  try {
    const authState = await getAuthState();
    return !authState.hasCompletedOnboarding;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return true;
  }
};

export const isUserAuthenticated = async (
  verifyToken: boolean = false,
): Promise<boolean> => {
  try {
    const authState = await getAuthState();

    if (!authState.isLoggedIn || !authState.userToken) {
      return false;
    }

    if (verifyToken) {
      return await verifyUserToken();
    }

    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};
