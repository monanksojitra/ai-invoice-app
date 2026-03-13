import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', loading = false,
  disabled = false, style, textStyle, testID, icon, size = 'md'
}) => {
  const isDisabled = disabled || loading;
  const heightMap = { sm: 42, md: 52, lg: 58 };
  const fontSizeMap = { sm: 13, md: 15, lg: 17 };

  const bgColor = {
    primary: Colors.primary,
    secondary: Colors.secondary,
    outline: 'transparent',
    danger: Colors.error,
    ghost: 'transparent',
  }[variant];

  const textColor = {
    primary: '#FFFFFF',
    secondary: Colors.primary,
    outline: Colors.primary,
    danger: '#FFFFFF',
    ghost: Colors.textMuted,
  }[variant];

  const borderColor = {
    primary: 'transparent',
    secondary: 'transparent',
    outline: Colors.primary,
    danger: 'transparent',
    ghost: 'transparent',
  }[variant];

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        { backgroundColor: bgColor, borderColor, height: heightMap[size], opacity: isDisabled ? 0.6 : 1 },
        (variant === 'outline' || variant === 'ghost') && styles.bordered,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: textColor, fontSize: fontSizeMap[size], marginLeft: icon ? 8 : 0 }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.radius.lg,
    paddingHorizontal: Layout.spacing.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  bordered: { borderWidth: 1.5 },
  text: { fontWeight: '600', letterSpacing: 0.2 },
});

export default Button;
