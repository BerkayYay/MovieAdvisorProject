import React, {Component, ErrorInfo, ReactNode} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import Animated, {FadeInUp, BounceIn} from 'react-native-reanimated';
import {Text, Button} from './index';
import {LAYOUT, COLORS} from '../../utils/config';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  showErrorDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  testID?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    this.setState({
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.resetTimeoutId = setTimeout(() => {
      this.handleReset();
    }, 10000) as unknown as number;
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const {resetOnPropsChange} = this.props;
    const {hasError} = this.state;

    if (
      resetOnPropsChange &&
      hasError &&
      prevProps.children !== this.props.children
    ) {
      this.handleReset();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: '',
    });
  };

  render() {
    const {hasError, error, errorInfo} = this.state;
    const {children, fallback, showErrorDetails = false, testID} = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }
      return (
        <View style={styles.container} testID={testID || 'error-boundary'}>
          <Animated.View
            entering={FadeInUp.duration(500)}
            style={styles.errorContainer}>
            <Animated.View
              entering={BounceIn.delay(200)}
              style={styles.iconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </Animated.View>

            <Text variant="heading" style={styles.errorTitle}>
              Oops! Something went wrong
            </Text>

            <Text variant="body" style={styles.errorDescription}>
              We encountered an unexpected error. Please try again.
            </Text>

            {showErrorDetails && error && (
              <View style={styles.errorDetails}>
                <TouchableOpacity
                  style={styles.detailsHeader}
                  onPress={() => {}}>
                  <Text variant="caption" style={styles.detailsTitle}>
                    Error Details
                  </Text>
                </TouchableOpacity>

                <View style={styles.detailsContent}>
                  <Text variant="caption" style={styles.errorMessage}>
                    {error.name}: {error.message}
                  </Text>

                  {errorInfo?.componentStack && (
                    <Text variant="caption" style={styles.stackTrace}>
                      {errorInfo.componentStack.slice(0, 300)}...
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.actionContainer}>
              <Button
                variant="primary"
                title="Try Again"
                onPress={this.handleReset}
                style={styles.retryButton}
              />
            </View>
          </Animated.View>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: LAYOUT.spacing.xl,
  },
  errorContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: LAYOUT.spacing.xl,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    elevation: 4,
    shadowColor: COLORS.text,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconContainer: {
    marginBottom: LAYOUT.spacing.lg,
  },
  errorIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.md,
    color: COLORS.text,
  },
  errorDescription: {
    textAlign: 'center',
    marginBottom: LAYOUT.spacing.xl,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: LAYOUT.spacing.lg,
    overflow: 'hidden',
  },
  detailsHeader: {
    backgroundColor: COLORS.error,
    padding: LAYOUT.spacing.sm,
  },
  detailsTitle: {
    color: COLORS.background,
    fontWeight: '600',
  },
  detailsContent: {
    padding: LAYOUT.spacing.md,
  },
  errorMessage: {
    color: COLORS.error,
    marginBottom: LAYOUT.spacing.sm,
    fontFamily: 'monospace',
  },
  stackTrace: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  retryButton: {
    minWidth: 120,
  },
});

export default ErrorBoundary;
