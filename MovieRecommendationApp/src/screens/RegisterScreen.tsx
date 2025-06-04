import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import {COLORS, LAYOUT, APP_CONFIG} from '../utils/config';
import {registerUser} from '../utils/auth';
import {Container, Button, Input, Text} from '../components';

type RegisterNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Register'
>;

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNavigationProp>();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const success = await registerUser(
        formData.name,
        formData.email,
        formData.password,
      );

      if (success) {
        Alert.alert(
          'Registration Successful',
          'Welcome to Movie Advisor! Your account has been created.',
          [
            {
              text: 'Get Started',
              onPress: () => navigation.navigate('Main'),
            },
          ],
        );
      } else {
        Alert.alert(
          'Registration Failed',
          'Unable to create account. Please try again.',
          [{text: 'OK'}],
        );
      }
    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = 'Something went wrong. Please try again.';

      if (error instanceof Error) {
        const errorText = error.message.toLowerCase();

        if (errorText.includes('user with this email already exists')) {
          errorMessage =
            'An account with this email already exists. Please try logging in instead.';
        } else if (errorText.includes('password must be at least')) {
          errorMessage =
            'Password must be at least 8 characters long with uppercase, lowercase, number, and special character.';
        } else if (errorText.includes('valid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (
          errorText.includes('network') ||
          errorText.includes('fetch')
        ) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else if (errorText.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        }
      }

      Alert.alert('Registration Error', errorMessage, [{text: 'OK'}]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginNavigation = () => {
    navigation.navigate('Login');
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));

    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  return (
    <Container safe={true} padding={false}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text variant="heading" color="primary">
              {APP_CONFIG.name}
            </Text>
            <Text variant="title" color="secondary" style={styles.subtitle}>
              Create Your Account
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={text => updateFormData('name', text)}
              error={errors.name}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={text => updateFormData('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              containerStyle={styles.inputContainer}
            />

            <View style={styles.inputContainer}>
              <Input
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChangeText={text => updateFormData('password', text)}
                error={errors.password}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <Text
                variant="caption"
                color="secondary"
                style={styles.passwordHint}>
                Must contain uppercase, lowercase, and number
              </Text>
            </View>

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={text => updateFormData('confirmPassword', text)}
              error={errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              containerStyle={styles.inputContainer}
            />

            <Button
              title={isLoading ? 'Creating Account...' : 'Create Account'}
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
            />

            <View style={styles.termsContainer}>
              <Text
                variant="caption"
                color="secondary"
                style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text
                  variant="caption"
                  color="primary"
                  style={styles.termsLink}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  variant="caption"
                  color="primary"
                  style={styles.termsLink}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text variant="body" color="secondary">
              Already have an account?
            </Text>
            <TouchableOpacity
              onPress={handleLoginNavigation}
              disabled={isLoading}>
              <Text variant="body" color="primary" style={styles.loginText}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: LAYOUT.spacing.lg,
    paddingVertical: LAYOUT.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.xl * 1.5,
    marginTop: LAYOUT.spacing.lg,
  },
  subtitle: {
    marginTop: LAYOUT.spacing.sm,
  },
  formContainer: {
    marginBottom: LAYOUT.spacing.xl,
  },
  inputContainer: {
    marginBottom: LAYOUT.spacing.lg,
  },
  passwordHint: {
    marginTop: LAYOUT.spacing.xs,
    marginLeft: LAYOUT.spacing.sm,
  },
  registerButton: {
    marginTop: LAYOUT.spacing.md,
  },
  termsContainer: {
    marginTop: LAYOUT.spacing.lg,
    paddingHorizontal: LAYOUT.spacing.sm,
  },
  termsText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: LAYOUT.spacing.lg,
  },
  loginText: {
    fontWeight: '600',
    marginLeft: LAYOUT.spacing.xs,
  },
});
