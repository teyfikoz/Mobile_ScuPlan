import { Tabs } from 'expo-router';
import { Home, FolderOpen, Users, MessageCircle, BookOpen, Menu } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const tabBarHeight = Platform.select({
    ios: 65 + insets.bottom,
    android: 65,
    web: 65,
    default: 65,
  });

  const tabBarPaddingBottom = Platform.select({
    ios: Math.max(insets.bottom, 10),
    android: 8,
    web: 8,
    default: 8,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.background,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 5,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 0,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          height: 50,
        },
        tabBarHideOnKeyboard: Platform.OS !== 'ios',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ size, color }) => (
            <FolderOpen size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="buddy"
        options={{
          title: 'Buddy',
          tabBarIcon: ({ size, color }) => (
            <Users size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ size, color }) => (
            <Menu size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
