import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet, BackHandler, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RootStackParamList, MainTabParamList} from '../types';
import {COLORS, LAYOUT} from '../utils/config';
import {getAuthState, shouldShowOnboarding} from '../utils/auth';
import {setNavigationRef} from '../utils/navigation';
import {
  AppErrorBoundary,
  NetworkErrorBoundary,
  ErrorBoundary,
} from '../components/common';
import {
  useSafeTimeout,
  useSafeEventListener,
  useComponentTracker,
} from '../utils/memoryLeak';

// Import actual screen components
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import DetailsScreen from '../screens/DetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GenrePreferencesScreen from '../screens/GenrePreferencesScreen';
import CategoryContentScreen from '../screens/CategoryContentScreen';
import {TestApiScreen} from '../screens/TestApiScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const PERSISTENCE_KEY = 'NAVIGATION_STATE';

const getTabBarIcon = (routeName: string, focused: boolean) => {
  const iconMap = {
    Home: focused ? '🏠' : '🏡',
    Search: focused ? '🔍' : '🔎',
    Favorites: focused ? '❤️' : '🤍',
    Profile: focused ? '👤' : '👥',
  };
  return iconMap[routeName as keyof typeof iconMap] || '📱';
};

const OnboardingStackScreen = (props: any) => (
  <ErrorBoundary>
    <OnboardingScreen {...props} />
  </ErrorBoundary>
);

const LoginStackScreen = (props: any) => (
  <ErrorBoundary>
    <LoginScreen {...props} />
  </ErrorBoundary>
);

const RegisterStackScreen = (props: any) => (
  <ErrorBoundary>
    <RegisterScreen {...props} />
  </ErrorBoundary>
);

const DetailsStackScreen = (props: any) => (
  <NetworkErrorBoundary>
    <DetailsScreen {...props} />
  </NetworkErrorBoundary>
);

const GenrePreferencesStackScreen = (props: any) => (
  <ErrorBoundary>
    <GenrePreferencesScreen {...props} />
  </ErrorBoundary>
);

const CategoryContentStackScreen = (props: any) => (
  <NetworkErrorBoundary>
    <CategoryContentScreen {...props} />
  </NetworkErrorBoundary>
);

const TestApiStackScreen = (props: any) => (
  <NetworkErrorBoundary>
    <TestApiScreen {...props} />
  </NetworkErrorBoundary>
);

const EditProfileStackScreen = (props: any) => (
  <ErrorBoundary>
    <EditProfileScreen {...props} />
  </ErrorBoundary>
);

const ChangePasswordStackScreen = (props: any) => (
  <ErrorBoundary>
    <ChangePasswordScreen {...props} />
  </ErrorBoundary>
);

const HomeTabScreen = (props: any) => (
  <NetworkErrorBoundary>
    <HomeScreen {...props} />
  </NetworkErrorBoundary>
);

const SearchTabScreen = (props: any) => (
  <NetworkErrorBoundary>
    <SearchScreen {...props} />
  </NetworkErrorBoundary>
);

const FavoritesTabScreen = (props: any) => (
  <ErrorBoundary>
    <FavoritesScreen {...props} />
  </ErrorBoundary>
);

const ProfileTabScreen = (props: any) => (
  <ErrorBoundary>
    <ProfileScreen {...props} />
  </ErrorBoundary>
);

function MainTabs() {
  return (
    <ErrorBoundary resetOnPropsChange={true}>
      <Tab.Navigator
        screenOptions={({route}) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            paddingTop: LAYOUT.spacing.xs,
            paddingBottom:
              Platform.OS === 'ios' ? LAYOUT.spacing.lg : LAYOUT.spacing.sm,
            height: Platform.OS === 'ios' ? 85 : 65,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: LAYOUT.spacing.xs,
          },
          tabBarIcon: ({focused}) => (
            <Text style={{fontSize: 20}}>
              {getTabBarIcon(route.name, focused)}
            </Text>
          ),
          tabBarButton: Platform.OS === 'ios' ? undefined : undefined,
        })}>
        <Tab.Screen
          name="Home"
          component={HomeTabScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarAccessibilityLabel: 'Home tab',
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchTabScreen}
          options={{
            tabBarLabel: 'Search',
            tabBarAccessibilityLabel: 'Search tab',
          }}
        />
        <Tab.Screen
          name="Favorites"
          component={FavoritesTabScreen}
          options={{
            tabBarLabel: 'Favorites',
            tabBarAccessibilityLabel: 'Favorites tab',
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileTabScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarAccessibilityLabel: 'Profile tab',
          }}
        />
      </Tab.Navigator>
    </ErrorBoundary>
  );
}

export default function AppNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();
  const [initialRouteName, setInitialRouteName] =
    useState<keyof RootStackParamList>('Onboarding');

  const {safeSetTimeout} = useSafeTimeout();
  useComponentTracker('AppNavigator');

  useEffect(() => {
    const restoreState = async () => {
      try {
        const authState = await getAuthState();
        const needsOnboarding = await shouldShowOnboarding();

        let initialRoute: keyof RootStackParamList = 'Onboarding';

        if (!needsOnboarding && authState.hasCompletedOnboarding) {
          if (authState.isLoggedIn) {
            initialRoute = 'Main';
          } else {
            initialRoute = 'Login';
          }
        }

        setInitialRouteName(initialRoute);

        const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
        const state = savedStateString
          ? JSON.parse(savedStateString)
          : undefined;

        if (state !== undefined && authState.isLoggedIn) {
          setInitialState(state);
        }
      } catch (e) {
        console.warn('Failed to restore navigation state:', e);
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          return false;
        },
      );

      return () => backHandler.remove();
    }
  }, []);

  const handleStateChange = (state: any) => {
    AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state)).catch(e => {
      console.warn('Failed to save navigation state:', e);
    });
  };

  const handleAppRestart = () => {
    console.log('App restart requested');
    setIsReady(false);
    setInitialState(undefined);
    setInitialRouteName('Onboarding');
    safeSetTimeout(() => setIsReady(true), 1000);
  };

  const handleAppError = (error: Error, errorInfo: any) => {
    console.error('App-level error:', error);
    console.error('Error info:', errorInfo);
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <AppErrorBoundary onRestart={handleAppRestart} onError={handleAppError}>
      <NavigationContainer
        ref={setNavigationRef}
        initialState={initialState}
        onStateChange={handleStateChange}
        fallback={
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        }>
        <Stack.Navigator
          initialRouteName={initialRouteName}
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.surface,
              borderBottomColor: COLORS.border,
              borderBottomWidth: 1,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: COLORS.text,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
            headerLeftContainerStyle: {
              paddingLeft: LAYOUT.spacing.md,
            },
            headerRightContainerStyle: {
              paddingRight: LAYOUT.spacing.md,
            },
            cardStyleInterpolator: ({current, layouts}) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingStackScreen}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Login"
            component={LoginStackScreen}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterStackScreen}
            options={{
              title: 'Create Account',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Details"
            component={DetailsStackScreen}
            options={({route}) => ({
              title: `${
                route.params?.type === 'movie' ? 'Movie' : 'TV Show'
              } Details`,
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: COLORS.background,
                borderBottomColor: COLORS.border,
                borderBottomWidth: 1,
              },
            })}
          />
          <Stack.Screen
            name="GenrePreferences"
            component={GenrePreferencesStackScreen}
            options={{
              title: 'Genre Preferences',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="CategoryContent"
            component={CategoryContentStackScreen}
            options={{
              title: 'Category Content',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="TestApi"
            component={TestApiStackScreen}
            options={{
              title: 'Test API',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileStackScreen}
            options={{
              title: 'Edit Profile',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordStackScreen}
            options={{
              title: 'Change Password',
              headerBackTitle: 'Back',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppErrorBoundary>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: LAYOUT.spacing.md,
  },
  customHeader: {
    backgroundColor: COLORS.surface,
    paddingVertical: LAYOUT.spacing.md,
    paddingHorizontal: LAYOUT.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
});
