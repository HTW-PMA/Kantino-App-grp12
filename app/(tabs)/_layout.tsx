import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: 'white',
                tabBarInactiveTintColor: '#ccc',
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    backgroundColor: '#662a60',
                    height: 70,
                    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                    paddingTop: 5,
                    borderTopWidth: 0,
                    borderRadius: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => (
                        <IconSymbol name="house.fill" color={color} size={28} />
                    ),
                }}
            />
            <Tabs.Screen
                name="saved"
                options={{
                    title: 'Saved',
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={require('../../assets/images/mensen/icons8-heart-50-full.png')}
                            style={{
                                width: 26,
                                height: 26,
                                opacity: focused ? 1 : 0.5,
                            }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="chatbot"
                options={{
                    title: 'Chatbot',
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={require('../../assets/images/mensen/chatbot.png')}
                            style={{
                                width: 26,
                                height: 26,
                                opacity: focused ? 1 : 0.5,
                            }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={require('../../assets/images/mensen/profil.png')}
                            style={{
                                width: 26,
                                height: 26,
                                opacity: focused ? 1 : 0.5,
                            }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
