import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPreferences, RootStackParamList} from '../types';
import {COLORS, LAYOUT, APP_CONFIG} from '../utils/config';
import {
  getUserPreferences,
  updateUserPreferences,
  clearAllFavorites,
} from '../utils/storage';
import {logoutUser, getAuthState, AuthState} from '../utils/auth';
import {resetToLogin} from '../utils/navigation';
import {Container, Text, Loading} from '../components';
import {useComponentTracker, useSafeAsync} from '../utils/memoryLeak';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'selection' | 'action' | 'navigation';
  value?: any;
  options?: {label: string; value: any}[];
  onPress?: () => void;
  onValueChange?: (value: any) => void;
  icon?: string;
  danger?: boolean;
}

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Main'
>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [preferences, setPreferences] = useState<UserPreferences>({
    favoriteGenres: [],
    preferredLanguage: 'en',
    adultContent: false,
    sortMethod: 'popularity',
    theme: 'light',
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<AuthState | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const {safeAsync} = useSafeAsync();
  useComponentTracker('ProfileScreen');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userPrefs = await safeAsync(() => getUserPreferences());
      if (userPrefs) {
        setPreferences(userPrefs);
      }

      const authState = await safeAsync(() => getAuthState());
      if (authState && authState.isLoggedIn) {
        setUserProfile(authState);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const userPrefs = await safeAsync(() => getUserPreferences());
      if (userPrefs) {
        setPreferences(userPrefs);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const refreshProfile = async () => {
    setProfileLoading(true);
    try {
      const authState = await safeAsync(() => getAuthState());
      if (authState && authState.isLoggedIn) {
        setUserProfile(authState);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    try {
      const updatedPrefs = {...preferences, [key]: value};
      setPreferences(updatedPrefs);
      await safeAsync(() => updateUserPreferences(updatedPrefs));
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleClearFavorites = () => {
    Alert.alert(
      'Clear All Favorites',
      'Are you sure you want to remove all your favorite movies and TV shows? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await safeAsync(() => clearAllFavorites());
              Alert.alert('Success', 'All favorites have been cleared.');
            } catch (error) {
              console.error('Error clearing favorites:', error);
              Alert.alert('Error', 'Failed to clear favorites');
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await safeAsync(() => logoutUser());
            resetToLogin();
          } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const handleGenrePreferences = () => {
    navigation.navigate('GenrePreferences', {
      source: 'settings',
    });
  };

  const settingSections = [
    {
      title: 'Profile',
      items: userProfile
        ? [
            {
              id: 'user-info',
              title:
                `${userProfile.firstName || ''} ${
                  userProfile.lastName || ''
                }`.trim() || 'User',
              subtitle: userProfile.email || 'No email',
              type: 'navigation' as const,
              icon: '👤',
              onPress: handleEditProfile,
            },
            {
              id: 'edit-profile',
              title: 'Edit Profile',
              subtitle: 'Update your personal information',
              type: 'navigation' as const,
              icon: '✏️',
              onPress: handleEditProfile,
            },
            {
              id: 'change-password',
              title: 'Change Password',
              subtitle: 'Update your account password',
              type: 'navigation' as const,
              icon: '🔒',
              onPress: handleChangePassword,
            },
          ]
        : [
            {
              id: 'profile-loading',
              title: 'Loading Profile...',
              subtitle: 'Please wait',
              type: 'navigation' as const,
              icon: '⏳',
            },
          ],
    },
    {
      title: 'Content Preferences',
      items: [
        {
          id: 'sorting',
          title: 'Default Sorting',
          subtitle: `Currently: ${
            preferences.sortMethod === 'popularity'
              ? 'Popularity'
              : preferences.sortMethod === 'rating'
              ? 'Rating'
              : 'Release Date'
          }`,
          type: 'selection' as const,
          icon: '🔄',
          value: preferences.sortMethod,
          options: [
            {label: 'Popularity', value: 'popularity'},
            {label: 'Rating', value: 'rating'},
            {label: 'Release Date', value: 'release_date'},
          ],
          onPress: () => {
            Alert.alert(
              'Sort Movies & TV Shows By',
              'Choose your preferred sorting method',
              [
                {
                  text: 'Popularity',
                  onPress: () => updatePreference('sortMethod', 'popularity'),
                },
                {
                  text: 'Rating',
                  onPress: () => updatePreference('sortMethod', 'rating'),
                },
                {
                  text: 'Release Date',
                  onPress: () => updatePreference('sortMethod', 'release_date'),
                },
                {text: 'Cancel', style: 'cancel'},
              ],
            );
          },
        },
        {
          id: 'genre-preferences',
          title: 'Genre Preferences',
          subtitle: 'Manage your favorite genres',
          type: 'navigation' as const,
          icon: '🎬',
          onPress: handleGenrePreferences,
        },
      ],
    },
    {
      title: 'Data Management',
      items: [
        {
          id: 'clear-favorites',
          title: 'Clear All Favorites',
          subtitle: 'Remove all saved movies and TV shows',
          type: 'action' as const,
          icon: '🗑️',
          danger: true,
          onPress: handleClearFavorites,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'logout',
          title: 'Logout',
          subtitle: 'Sign out of your account',
          type: 'action' as const,
          icon: '🚪',
          danger: true,
          onPress: handleLogout,
        },
      ],
    },
    {
      title: 'Developer',
      items: [
        {
          id: 'api-test',
          title: 'Test API Calls',
          subtitle: 'Test TMDb and OMDb API integration',
          type: 'navigation' as const,
          icon: '🧪',
          onPress: () => {
            navigation.navigate('TestApi');
          },
        },
      ],
    },
    {
      title: 'App Information',
      items: [
        {
          id: 'version',
          title: 'App Version',
          subtitle: APP_CONFIG.version || '1.0.0',
          type: 'navigation' as const,
          icon: 'ℹ️',
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          subtitle: 'View our terms and conditions',
          type: 'navigation' as const,
          icon: '📄',
          onPress: () => {
            openLink('https://example.com/terms');
          },
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          subtitle: 'How we handle your data',
          type: 'navigation' as const,
          icon: '🔒',
          onPress: () => {
            openLink('https://example.com/privacy');
          },
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingItem,
          item.danger && styles.dangerItem,
          item.type === 'navigation' && !item.onPress && styles.disabledItem,
        ]}
        onPress={item.onPress}
        disabled={item.type === 'navigation' && !item.onPress}>
        <View style={styles.settingItemLeft}>
          <Text style={styles.settingIcon}>{item.icon}</Text>
          <View style={styles.settingItemContent}>
            <Text
              variant="body"
              style={[styles.settingTitle, item.danger && styles.dangerText]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text
                variant="caption"
                color="secondary"
                style={styles.settingSubtitle}>
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>

        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{
              false: COLORS.border,
              true: COLORS.primary + '40',
            }}
            thumbColor={item.value ? COLORS.primary : COLORS.textMuted}
          />
        )}

        {item.type === 'navigation' && item.onPress && (
          <Text style={styles.chevron}>›</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderSection = (section: any) => (
    <View key={section.title} style={styles.section}>
      <Text variant="caption" color="secondary" style={styles.sectionTitle}>
        {section.title.toUpperCase()}
      </Text>
      <View style={styles.sectionContent}>
        {section.items.map(renderSettingItem)}
      </View>
    </View>
  );

  const reloadPreferences = useCallback(() => {
    loadUserPreferences();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, []),
  );

  const renderUserProfileHeader = () => {
    if (!userProfile) {
      return (
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, styles.skeletonAvatar]}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <View style={[styles.skeletonText, styles.skeletonName]} />
            <View style={[styles.skeletonText, styles.skeletonEmail]} />
          </View>
          <View style={[styles.editButton, styles.skeletonButton]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        </View>
      );
    }

    const displayName = `${userProfile.firstName || ''} ${
      userProfile.lastName || ''
    }`.trim();
    const initials = displayName
      ? displayName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
      : userProfile.email?.[0]?.toUpperCase() || 'U';

    return (
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text variant="title" style={styles.profileName}>
            {displayName || 'User Profile'}
          </Text>
          <Text variant="body" color="secondary" style={styles.profileEmail}>
            {userProfile.email || 'No email'}
          </Text>
          {userProfile.username && (
            <Text
              variant="caption"
              color="secondary"
              style={styles.profileUsername}>
              @{userProfile.username}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
          disabled={profileLoading}>
          {profileLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.editButtonText}>Edit</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <Container>
        <Loading message="Loading profile..." />
      </Container>
    );
  }

  return (
    <Container safe={true} padding={false}>
      <View style={styles.header}>
        <Text variant="heading" style={styles.screenTitle}>
          Profile & Settings
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={profileLoading}
            onRefresh={refreshProfile}
          />
        }>
        {renderUserProfileHeader()}

        {settingSections.map(renderSection)}
      </ScrollView>
    </Container>
  );
}
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: LAYOUT.spacing.lg,
    paddingVertical: LAYOUT.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: LAYOUT.spacing.lg,
  },
  section: {
    marginBottom: LAYOUT.spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: LAYOUT.spacing.lg,
    marginBottom: LAYOUT.spacing.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: COLORS.surface,
    marginHorizontal: LAYOUT.spacing.lg,
    borderRadius: LAYOUT.borderRadius.md,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: LAYOUT.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  settingItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: LAYOUT.spacing.md,
  },
  settingItemContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  dangerItem: {
    backgroundColor: COLORS.error + '08',
  },
  dangerText: {
    color: COLORS.error,
  },
  disabledItem: {
    opacity: 0.6,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: LAYOUT.spacing.lg,
    backgroundColor: COLORS.surface,
    marginHorizontal: LAYOUT.spacing.lg,
    marginBottom: LAYOUT.spacing.lg,
    borderRadius: LAYOUT.borderRadius.md,
  },
  avatarContainer: {
    marginRight: LAYOUT.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '20',
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: LAYOUT.spacing.xs,
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: LAYOUT.spacing.xs,
  },
  profileUsername: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  editButton: {
    paddingHorizontal: LAYOUT.spacing.md,
    paddingVertical: LAYOUT.spacing.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius: LAYOUT.borderRadius.sm,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  skeletonAvatar: {
    backgroundColor: COLORS.border,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonText: {
    backgroundColor: COLORS.border,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  skeletonName: {
    height: 20,
    width: '60%',
    marginBottom: LAYOUT.spacing.xs,
  },
  skeletonEmail: {
    height: 16,
    width: '80%',
  },
  skeletonButton: {
    backgroundColor: COLORS.border,
    borderRadius: LAYOUT.borderRadius.sm,
  },
});
