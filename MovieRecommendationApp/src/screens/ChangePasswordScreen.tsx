import React, {useState} from 'react';
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
import {getAuthState} from '../utils/auth';
import {backendService} from '../services/backendApi';
import {Container, Text, Button, Input} from '../components';
import {useComponentTracker, useSafeAsync} from '../utils/memoryLeak';

type ChangePasswordNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ChangePassword'
>;

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface PasswordStrength {
  score: number;
  message: string;
  color: string;
}

export default function ChangePasswordScreen() {
  const navigation = useNavigation<ChangePasswordNavigationProp>();
  const [formData, setFormData] = useState<FormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {safeAsync} = useSafeAsync();
  useComponentTracker('ChangePasswordScreen');

  const getPasswordStrength = (password: string): PasswordStrength => {
    if (password.length === 0) {
      return {score: 0, message: '', color: COLORS.textSecondary};
    }

    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;

    if (score < 2) {
      return {score, message: 'Weak', color: COLORS.error};
    } else if (score < 4) {
      return {score, message: 'Fair', color: '#FFA500'};
    } else if (score < 5) {
      return {score, message: 'Good', color: '#32CD32'};
    } else {
      return {score, message: 'Strong', color: '#00FF00'};
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword =
        'New password must be different from current password';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      const authState = await safeAsync(() => getAuthState());
      if (!authState?.userToken) {
        Alert.alert(
          'Error',
          'Authentication token not found. Please log in again.',
        );
        return;
      }

      await safeAsync(() =>
        backendService.profile.changePassword(authState.userToken!, {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      );

      Alert.alert('Success', 'Your password has been changed successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error changing password:', error);

      let errorMessage = 'Failed to change password. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('current password')) {
          errorMessage = 'Current password is incorrect.';
        } else if (error.message.includes('password requirements')) {
          errorMessage = 'New password does not meet requirements.';
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = 'Session expired. Please log in again.';
        }
      }

      Alert.alert('Password Change Failed', errorMessage);
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

  const passwordStrength = getPasswordStrength(formData.newPassword);

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
              Change Password
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Enter your current password and choose a new secure password
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Current Password"
              value={formData.currentPassword}
              onChangeText={value => updateFormData('currentPassword', value)}
              error={errors.currentPassword}
              placeholder="Enter your current password"
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Input
              label="New Password"
              value={formData.newPassword}
              onChangeText={value => updateFormData('newPassword', value)}
              error={errors.newPassword}
              placeholder="Enter your new password"
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            {formData.newPassword.length > 0 && (
              <View style={styles.passwordStrength}>
                <View style={styles.strengthHeader}>
                  <Text variant="caption" color="secondary">
                    Password Strength:
                  </Text>
                  <Text
                    variant="caption"
                    style={[
                      styles.strengthText,
                      {color: passwordStrength.color},
                    ]}>
                    {passwordStrength.message}
                  </Text>
                </View>
                <View style={styles.strengthBar}>
                  {[1, 2, 3, 4, 5].map(level => (
                    <View
                      key={level}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            level <= passwordStrength.score
                              ? passwordStrength.color
                              : COLORS.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.strengthHint}>
                  Use 8+ characters with uppercase, lowercase, numbers, and
                  symbols
                </Text>
              </View>
            )}

            <Input
              label="Confirm New Password"
              value={formData.confirmPassword}
              onChangeText={value => updateFormData('confirmPassword', value)}
              error={errors.confirmPassword}
              placeholder="Confirm your new password"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={saving ? 'Changing Password...' : 'Change Password'}
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
  passwordStrength: {
    marginTop: -LAYOUT.spacing.md,
    marginBottom: LAYOUT.spacing.lg,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.xs,
  },
  strengthText: {
    fontWeight: '600',
  },
  strengthBar: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: LAYOUT.spacing.xs,
  },
  strengthSegment: {
    flex: 1,
    marginRight: 2,
    borderRadius: 2,
  },
  strengthHint: {
    fontSize: 12,
    fontStyle: 'italic',
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
