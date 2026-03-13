import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ViewStyle, TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({
  label, error, leftIcon, rightIcon, onRightIconPress,
  containerStyle, testID, secureTextEntry, ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;
  const borderColor = error ? Colors.error : isFocused ? Colors.primary : Colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, { borderColor }]}>
        {leftIcon && (
          <MaterialCommunityIcons name={leftIcon as any} size={20} color={Colors.textMuted} style={styles.leftIcon} />
        )}
        <TextInput
          testID={testID}
          style={[styles.input, leftIcon && styles.inputWithLeft]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor={Colors.textLight}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.rightIcon}>
            <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <MaterialCommunityIcons name={rightIcon as any} size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Layout.spacing.lg },
  label: { fontSize: Layout.fontSize.sm, fontWeight: '600', color: Colors.textMain, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Layout.spacing.lg,
  },
  input: { flex: 1, fontSize: Layout.fontSize.base, color: Colors.textMain },
  inputWithLeft: { marginLeft: Layout.spacing.sm },
  leftIcon: { marginRight: Layout.spacing.sm },
  rightIcon: { padding: 4 },
  error: { color: Colors.error, fontSize: Layout.fontSize.xs, marginTop: 4 },
});

export default Input;
