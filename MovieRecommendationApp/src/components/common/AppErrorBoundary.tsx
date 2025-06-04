import React, {ErrorInfo} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {ErrorBoundary} from './ErrorBoundary';
import {Text, Button} from './index';
import {LAYOUT, COLORS} from '../../utils/config';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  onRestart?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({
  children,
  onRestart,
  onError,
}) => {
  const handleAppError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('App-level error caught:', error);
    console.error('Component stack:', errorInfo.componentStack);

    if (onError) {
      onError(error, errorInfo);
    }

    // crashlytics().recordError(error);
    // analytics().logEvent('app_error', { error: error.message });
  };

  const handleRestart = () => {
    if (onRestart) {
      onRestart();
    } else {
      console.log('App restart triggered');
    }
  };

  const AppErrorFallback = (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.crashIcon}>💥</Text>
        </View>

        <Text variant="heading" style={styles.title}>
          App Crashed
        </Text>

        <Text variant="body" style={styles.description}>
          We're sorry! The app encountered a critical error and needs to
          restart.
        </Text>

        <Text variant="caption" style={styles.subtitle}>
          Your data has been saved and a crash report has been sent to help us
          fix this issue.
        </Text>

        <View style={styles.actionContainer}>
          <Button
            variant="primary"
            title="Restart App"
            onPress={handleRestart}
            style={styles.restartButton}
          />
        </View>
      </Animated.View>
    </View>
  );

  return (
    <ErrorBoundary
      fallback={AppErrorFallback}
      onError={handleAppError}
      showErrorDetails={__DEV__}
      resetOnPropsChange={false}>
      {children}
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: LAYOUT.spacing.xl,
  },
  content: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: LAYOUT.spacing.xl * 1.5,
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    elevation: 8,
    shadowColor: COLORS.error,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  iconContainer: {
    marginBottom: LAYOUT.spacing.xl,
  },
  crashIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.lg,
    color: COLORS.text,
  },
  description: {
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.lg,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.xl * 1.5,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  restartButton: {
    minWidth: 140,
    backgroundColor: COLORS.error,
  },
});

export default AppErrorBoundary;
