import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Colors from '../../constants/Colors';

interface BadgeProps {
  count: number;
  max?: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  testID?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  max = 99,
  color = Colors.error,
  size = 'md',
  style,
  testID,
}) => {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();
  
  const sizeMap = {
    sm: { container: 16, fontSize: 10 },
    md: { container: 20, fontSize: 11 },
    lg: { container: 24, fontSize: 12 },
  };

  const dimensions = sizeMap[size];

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        {
          backgroundColor: color,
          minWidth: dimensions.container,
          height: dimensions.container,
          borderRadius: dimensions.container / 2,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: dimensions.fontSize },
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
});
