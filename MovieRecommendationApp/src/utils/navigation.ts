import {NavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList} from '../types';

export let navigationRef: NavigationContainerRef<RootStackParamList> | null =
  null;

export const setNavigationRef = (
  ref: NavigationContainerRef<RootStackParamList>,
) => {
  navigationRef = ref;
};

export const navigate = (name: keyof RootStackParamList, params?: any) => {
  if (navigationRef?.isReady()) {
    (navigationRef as any).navigate(name, params);
  }
};

export const goBack = () => {
  if (navigationRef?.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
};

export const resetToScreen = (name: keyof RootStackParamList, params?: any) => {
  if (navigationRef?.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{name: name as any, params}],
    });
  }
};

export const getCurrentRoute = () => {
  if (navigationRef?.isReady()) {
    return navigationRef.getCurrentRoute();
  }
  return null;
};

export const getCurrentRouteName = (): string | null => {
  const route = getCurrentRoute();
  return route?.name || null;
};

export const canGoBack = (): boolean => {
  if (navigationRef?.isReady()) {
    return navigationRef.canGoBack();
  }
  return false;
};

export const isOnAuthScreen = (): boolean => {
  const routeName = getCurrentRouteName();
  return ['Onboarding', 'Login', 'Register'].includes(routeName || '');
};

export const isOnMainApp = (): boolean => {
  const routeName = getCurrentRouteName();
  return routeName === 'Main';
};

export const navigateToMovieDetails = (id: number) => {
  navigate('Details', {type: 'movie', id});
};

export const navigateToTVDetails = (id: number) => {
  navigate('Details', {type: 'tv', id});
};

export const navigateToLogin = () => {
  navigate('Login');
};

export const navigateToMain = () => {
  navigate('Main');
};

export const logoutAndNavigateToLogin = () => {
  resetToScreen('Login');
};

export const resetToLogin = () => {
  resetToScreen('Login');
};
