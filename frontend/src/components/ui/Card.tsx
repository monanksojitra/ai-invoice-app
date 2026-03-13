import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outlined' | 'flat';
  testID?: string;
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default', testID }) => {
  return (
    <View
      testID={testID}
      style={[
        styles.base,
        variant === 'outlined' && styles.outlined,
        variant === 'flat' && styles.flat,
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  outlined: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
    backgroundColor: Colors.surfaceHighlight,
  },
});

export default Card;
