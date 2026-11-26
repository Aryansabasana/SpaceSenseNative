/**
 * Main Authenticated Navigator
 * Bottom tabs for Home, Rooms, and Profile, wrapped in a Stack for RoomDetails,
 * CreateRoom, and EditProfile.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CreateRoomScreen from '../screens/rooms/CreateRoomScreen';
import FloorPlanScreen from '../screens/rooms/FloorPlanScreen';
import MyRoomsScreen from '../screens/rooms/MyRoomsScreen';
import RoomDetailsScreen from '../screens/rooms/RoomDetailsScreen';
import RoomMeasurementsScreen from '../screens/rooms/RoomMeasurementsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function getTabIcon(routeName, focused) {
  if (routeName === 'Home') {
    return focused ? 'home' : 'home-outline';
  }
  if (routeName === 'Rooms') {
    return focused ? 'cube' : 'cube-outline';
  }
  return focused ? 'person' : 'person-outline';
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={getTabIcon(route.name, focused)}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Rooms" component={MyRoomsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
      <Stack.Screen name="RoomDetails" component={RoomDetailsScreen} />
      <Stack.Screen name="RoomMeasurements" component={RoomMeasurementsScreen} />
      <Stack.Screen name="FloorPlan" component={FloorPlanScreen} />
      <Stack.Screen name="EditProfile" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
