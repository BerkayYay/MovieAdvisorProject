// App configuration constants
export const APP_CONFIG = {
  name: 'Movie Advisor',
  version: '1.0.0',
  description: 'Personalized Movie & TV Show Recommendations',
} as const;

// Theme configuration
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#000000',
  surface: '#1a1a1a',
  card: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textMuted: '#666666',
  border: '#333333',
  disabled: '#555555',
  error: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  white: '#ffffff',
} as const;

// Layout constants
export const LAYOUT = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  headerHeight: 56,
  tabBarHeight: 84,
} as const;

// Animation constants
export const ANIMATION = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

export const API_CONFIG = {
  baseURL: 'https://api.themoviedb.org/3',
  imageBaseURL: 'https://image.tmdb.org/t/p',
  imageSizes: {
    poster: 'w500',
    backdrop: 'w1280',
    profile: 'w185',
  },
  timeout: 10000,
} as const;
