import React, {useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import {COLORS} from '../../utils/config';
import {Text} from './Text';

interface LoadingProps {
  size?: 'small' | 'large';
  message?: string;
  color?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  message,
  color = COLORS.primary,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const pulse = useSharedValue(0);

  useEffect(() => {
    // Fade in animation
    opacity.value = withTiming(1, {duration: 300});
    scale.value = withTiming(1, {duration: 300});

    // Pulse animation for the container
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, {duration: 1000}),
        withTiming(0, {duration: 1000}),
      ),
      -1,
      false,
    );
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{scale: scale.value}],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 1]),
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <Animated.View style={[styles.spinnerContainer, pulseAnimatedStyle]}>
        <ActivityIndicator size={size} color={color} />
      </Animated.View>
      {message && (
        <Text variant="caption" color="secondary" style={styles.message}>
          {message}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerContainer: {
    padding: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  message: {
    marginTop: 16,
  },
});
