import React, {ErrorInfo, useCallback} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {FadeInUp, SlideInRight} from 'react-native-reanimated';
import {ErrorBoundary} from './ErrorBoundary';
import {Text, Button} from './index';
import {LAYOUT, COLORS} from '../../utils/config';

interface NetworkErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  retryDelay?: number;
}

const isNetworkError = (error: Error): boolean => {
  const networkErrorPatterns = [
    'network request failed',
    'fetch',
    'timeout',
    'connection',
    'xhr',
    'request failed',
    'api error',
    'http error',
  ];

  const errorMessage = error.message.toLowerCase();
  return networkErrorPatterns.some(pattern => errorMessage.includes(pattern));
};

export const NetworkErrorBoundary: React.FC<NetworkErrorBoundaryProps> = ({
  children,
  onRetry,
  onError,
  retryDelay = 1000,
}) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleNetworkError = useCallback(
    (error: Error, errorInfo: ErrorInfo) => {
      if (!isNetworkError(error)) {
        throw error;
      }

      console.error('Network error caught:', error);
      console.error('Error info:', errorInfo);

      if (onError) {
        onError(error, errorInfo);
      }

      // analytics().logEvent('network_error', {
      //   error: error.message,
      //   retryCount
      // });
    },
    [onError, retryCount],
  );

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Add delay for better UX
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      if (onRetry) {
        await onRetry();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, retryDelay]);

  const NetworkErrorFallback = (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(500)} style={styles.content}>
        <Animated.View
          entering={SlideInRight.delay(200)}
          style={styles.iconContainer}>
          <Text style={styles.networkIcon}>📡</Text>
        </Animated.View>

        <Text variant="title" style={styles.title}>
          Connection Problem
        </Text>

        <Text variant="body" style={styles.description}>
          We're having trouble connecting to our servers. Please check your
          internet connection and try again.
        </Text>

        {retryCount > 0 && (
          <Text variant="caption" style={styles.retryInfo}>
            Retry attempt: {retryCount}
          </Text>
        )}

        <View style={styles.actionContainer}>
          <Button
            variant="primary"
            title={isRetrying ? 'Retrying...' : 'Try Again'}
            onPress={handleRetry}
            loading={isRetrying}
            disabled={isRetrying}
            style={styles.retryButton}
          />

          {retryCount >= 3 && (
            <Button
              variant="outline"
              title="Go Offline"
              onPress={() => {
                // Handle offline mode
                console.log('Switching to offline mode');
              }}
              style={styles.offlineButton}
            />
          )}
        </View>

        <View style={styles.tipContainer}>
          <Text variant="caption" style={styles.tipText}>
            💡 Tip: Make sure you're connected to Wi-Fi or mobile data
          </Text>
        </View>
      </Animated.View>
    </View>
  );

  return (
    <ErrorBoundary
      fallback={NetworkErrorFallback}
      onError={handleNetworkError}
      showErrorDetails={__DEV__}
      resetOnPropsChange={true}>
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
    padding: LAYOUT.spacing.xl,
    alignItems: 'center',
    maxWidth: 380,
    width: '100%',
    elevation: 4,
    shadowColor: COLORS.warning,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  iconContainer: {
    marginBottom: LAYOUT.spacing.lg,
  },
  networkIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.md,
    color: COLORS.text,
  },
  description: {
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.lg,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  retryInfo: {
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.md,
    color: COLORS.warning,
    fontWeight: '600',
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.lg,
  },
  retryButton: {
    minWidth: 120,
    marginBottom: LAYOUT.spacing.md,
  },
  offlineButton: {
    minWidth: 120,
  },
  tipContainer: {
    backgroundColor: COLORS.background,
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.md,
    width: '100%',
  },
  tipText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});

export default NetworkErrorBoundary;
