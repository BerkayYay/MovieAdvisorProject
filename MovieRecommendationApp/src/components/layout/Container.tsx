import React from 'react';
import {View, SafeAreaView, StyleSheet, ViewStyle} from 'react-native';
import {COLORS, LAYOUT} from '../../utils/config';

interface ContainerProps {
  children: React.ReactNode;
  safe?: boolean;
  padding?: boolean;
  style?: ViewStyle;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  safe = true,
  padding = true,
  style,
}) => {
  const Component = safe ? SafeAreaView : View;

  return (
    <Component style={[styles.container, padding && styles.padding, style]}>
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  padding: {
    paddingHorizontal: LAYOUT.spacing.lg,
  },
});
