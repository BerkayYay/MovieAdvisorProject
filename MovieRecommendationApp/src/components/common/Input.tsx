import React, {useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import {COLORS, LAYOUT} from '../../utils/config';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const focusAnimation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnimation.value,
      [0, 1],
      [error ? COLORS.error : COLORS.border, COLORS.primary],
    );

    return {
      borderColor,
      transform: [
        {
          scale: withTiming(focusAnimation.value === 1 ? 1.02 : 1, {
            duration: 200,
          }),
        },
      ],
    };
  });

  const handleFocus = (e: any) => {
    focusAnimation.value = withTiming(1, {duration: 200});
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    focusAnimation.value = withTiming(0, {duration: 200});
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <AnimatedTextInput
        style={[styles.input, error && styles.inputError, animatedStyle, style]}
        placeholderTextColor={COLORS.textSecondary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: LAYOUT.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: LAYOUT.spacing.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: LAYOUT.spacing.md,
    paddingHorizontal: LAYOUT.spacing.lg,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: LAYOUT.spacing.xs,
    marginLeft: LAYOUT.spacing.sm,
  },
});
