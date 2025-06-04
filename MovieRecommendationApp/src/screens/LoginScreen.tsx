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
import {loginUser} from '../utils/auth';
import {Container, Button, Input, Text} from '../components';

type LoginNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavigationProp>();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const success = await loginUser(formData.email, formData.password);

      if (success) {
        Alert.alert('Login Successful', 'Welcome to Movie Advisor!', [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Main'),
          },
        ]);
      } else {
        Alert.alert(
          'Login Failed',
          'Unable to login. Please check your credentials and try again.',
          [{text: 'OK'}],
        );
      }
    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = 'Something went wrong. Please try again.';

      if (error instanceof Error) {
        const errorText = error.message.toLowerCase();

        if (errorText.includes('invalid email or password')) {
          errorMessage =
            'Invalid email or password. Please check your credentials.';
        } else if (errorText.includes('account is deactivated')) {
          errorMessage =
            'Your account has been deactivated. Please contact support.';
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

      Alert.alert('Login Error', errorMessage, [{text: 'OK'}]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterNavigation = () => {
    navigation.navigate('Register');
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
            <Text variant="heading" color="primary" style={styles.appName}>
              {APP_CONFIG.name}
            </Text>
            <Text variant="title" color="secondary" style={styles.subtitle}>
              Welcome Back!
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={text => updateFormData('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              error={errors.email}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={text => updateFormData('password', text)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              error={errors.password}
              containerStyle={styles.inputContainer}
            />

            <Button
              title={isLoading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              variant="primary"
              style={styles.loginButton}
            />

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() =>
                Alert.alert(
                  'Forgot Password',
                  'This feature will be available in Phase 2',
                )
              }>
              <Text variant="body" color="primary">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text variant="body" color="secondary" style={styles.footerText}>
              Don't have an account?
            </Text>
            <TouchableOpacity
              onPress={handleRegisterNavigation}
              disabled={isLoading}>
              <Text variant="body" color="primary" style={styles.registerText}>
                Sign Up
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
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.spacing.lg,
    paddingVertical: LAYOUT.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.xl * 2,
  },
  appName: {
    marginBottom: LAYOUT.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: LAYOUT.spacing.xl,
  },
  inputContainer: {
    marginBottom: LAYOUT.spacing.lg,
  },
  loginButton: {
    marginTop: LAYOUT.spacing.lg,
    marginBottom: LAYOUT.spacing.md,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: LAYOUT.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: LAYOUT.spacing.lg,
  },
  footerText: {
    marginRight: LAYOUT.spacing.xs,
  },
  registerText: {
    fontWeight: '600',
  },
});
