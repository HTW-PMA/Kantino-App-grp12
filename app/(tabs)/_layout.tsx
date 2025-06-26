// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import CustomHeader from '@/components/CustomHeader';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: 'white',
                tabBarInactiveTintColor: '#ccc',
                headerShown: true,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    backgroundColor: '#662a60',
                    height: 80,
                    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                    paddingTop: 5,
                    borderTopWidth: 0,
                    borderRadius: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                },
                header: ({ route }) => (
                    <CustomHeader
                        title={getTabTitle(route.name)}
                        showBack={route.name !== 'index'}
                    />
                ),
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
            // Wird somit nicht bei der Navigation angezeigt
            <Tabs.Screen
                name="speiseplan"
                options={{
                    title: 'Speiseplan',
                    href: null,
                }}
            />

            <Tabs.Screen
                name="mensen"
                options={{
                    title: 'Mensen',
                    href: null,
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
                            source={require('../../assets/images/chatbot.png')}
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
                            source={require('../../assets/images/profil.png')}
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

function getTabTitle(routeName: string): string {
    switch (routeName) {
        case 'index':
            return 'Kantino';
        case 'mensen':
            return 'Mensen';
        case 'speiseplan':
            return 'Speiseplan';
        case 'saved':
            return 'Gespeichert';
        case 'chatbot':
            return 'Chatbot';
        case 'profile':
            return 'Profil';
        default:
            return 'Kantino';
    }
}