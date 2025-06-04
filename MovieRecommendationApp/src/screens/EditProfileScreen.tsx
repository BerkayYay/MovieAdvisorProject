import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {COLORS, LAYOUT} from '../utils/config';
import {getAuthState, saveAuthState} from '../utils/auth';
import {backendService} from '../services/backendApi';
import {Container, Text, Button, Input, Loading} from '../components';
import {useComponentTracker, useSafeAsync} from '../utils/memoryLeak';

type EditProfileNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EditProfile'
>;

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
}

export default function EditProfileScreen() {
  const navigation = useNavigation<EditProfileNavigationProp>();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {safeAsync} = useSafeAsync();
  useComponentTracker('EditProfileScreen');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const authState = await safeAsync(() => getAuthState());
      if (authState && authState.isLoggedIn) {
        setFormData({
          firstName: authState.firstName || '',
          lastName: authState.lastName || '',
          username: authState.username || '',
          email: authState.email || '',
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (formData.username.trim() && formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    if (formData.username.includes(' ')) {
      newErrors.username = 'Username cannot contain spaces';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      const currentAuthState = await safeAsync(() => getAuthState());
      if (!currentAuthState?.userToken) {
        Alert.alert(
          'Error',
          'Authentication token not found. Please log in again.',
        );
        return;
      }

      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim() || undefined,
      };

      await safeAsync(() =>
        backendService.profile.updateProfile(
          currentAuthState.userToken!,
          updateData,
        ),
      );

      if (currentAuthState) {
        const updatedAuthState = {
          ...currentAuthState,
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          username: updateData.username,
        };
        await safeAsync(() => saveAuthState(updatedAuthState));
      }

      Alert.alert('Success', 'Your profile has been updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);

      let errorMessage = 'Failed to update profile. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('email')) {
          errorMessage = 'This email address is already in use.';
        } else if (error.message.includes('username')) {
          errorMessage = 'This username is already taken.';
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = 'Session expired. Please log in again.';
        }
      }

      Alert.alert('Update Failed', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text variant="heading" style={styles.title}>
              Edit Profile
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Update your personal information
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="First Name"
              value={formData.firstName}
              onChangeText={value => updateFormData('firstName', value)}
              error={errors.firstName}
              placeholder="Enter your first name"
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Input
              label="Last Name"
              value={formData.lastName}
              onChangeText={value => updateFormData('lastName', value)}
              error={errors.lastName}
              placeholder="Enter your last name"
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Input
              label="Username (Optional)"
              value={formData.username}
              onChangeText={value => updateFormData('username', value)}
              error={errors.username}
              placeholder="Choose a username"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Input
              label="Email Address"
              value={formData.email}
              onChangeText={value => updateFormData('email', value)}
              error={errors.email}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              editable={false}
              containerStyle={styles.disabledInput}
            />

            <Text variant="caption" color="secondary" style={styles.emailNote}>
              Email address cannot be changed. Contact support if needed.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={saving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            variant="primary"
            style={styles.saveButton}
          />

          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            disabled={saving}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: LAYOUT.spacing.lg,
  },
  header: {
    paddingTop: LAYOUT.spacing.xl,
    paddingBottom: LAYOUT.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: LAYOUT.spacing.sm,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    flex: 1,
    paddingBottom: LAYOUT.spacing.xl,
  },
  disabledInput: {
    opacity: 0.6,
  },
  emailNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: -LAYOUT.spacing.md,
    marginBottom: LAYOUT.spacing.lg,
    textAlign: 'center',
  },
  footer: {
    padding: LAYOUT.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  saveButton: {
    marginBottom: LAYOUT.spacing.md,
  },
  cancelButton: {},
});
