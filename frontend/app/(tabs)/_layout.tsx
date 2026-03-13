import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';

function TabIcon({ name, focused, label }: { name: string; focused: boolean; label: string }) {
  return (
    <View style={styles.iconContainer}>
      <MaterialCommunityIcons name={name as any} size={22} color={focused ? Colors.primary : Colors.textLight} />
      <Text style={[styles.label, { color: focused ? Colors.primary : Colors.textLight }]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'view-dashboard' : 'view-dashboard-outline'} focused={focused} label="Home" />,
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'receipt-text' : 'receipt-text-outline'} focused={focused} label="Ledger" />,
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.captureFab}>
              <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'store' : 'store-outline'} focused={focused} label="Vendors" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'cog' : 'cog-outline'} focused={focused} label="Settings" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 0,
    shadowOpacity: 0,
  },
  iconContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  label: { fontSize: 10, fontWeight: '500', marginTop: 2 },
  captureFab: {
    width: 56, height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
