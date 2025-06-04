import React from 'react';
import {Text as RNText, StyleSheet, TextProps} from 'react-native';
import {COLORS} from '../../utils/config';

interface CustomTextProps extends TextProps {
  variant?: 'heading' | 'title' | 'body' | 'caption' | 'error';
  color?: 'primary' | 'secondary' | 'error' | 'text';
  children: React.ReactNode;
}

export const Text: React.FC<CustomTextProps> = ({
  variant = 'body',
  color = 'text',
  style,
  children,
  ...props
}) => {
  return (
    <RNText
      style={[styles[variant], styles[`${color}Color`], style]}
      {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 38,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },

  primaryColor: {
    color: COLORS.primary,
  },
  secondaryColor: {
    color: COLORS.textSecondary,
  },
  errorColor: {
    color: COLORS.error,
  },
  textColor: {
    color: COLORS.text,
  },
});
