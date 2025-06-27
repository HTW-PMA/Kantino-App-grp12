import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { getName } from '@/lib/storage';

export default function WelcomeMessage() {
    const [userName, setUserName] = useState<string | null>(null);

    const loadUserName = async () => {
        try {
            const name = await getName();
            console.log('Geladener Name:', name);
            setUserName(name);
        } catch (error) {
            console.error('Fehler beim Laden des Namens:', error);
            setUserName(null);
        }
    };

    // Lädt Name nur einmal beim ersten Rendern
    useEffect(() => {
        loadUserName();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.messageContainer}>
                <Text style={styles.greeting}>
                    {userName ? `Hi ${userName},` : 'Hi,'}
                </Text>
                <Text style={styles.question}>how can I help you?</Text>
            </View>

            <Text style={styles.comingSoon}>Funktion wird bald verfügbar sein</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        backgroundColor: '#fff',
    },
    messageContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    greeting: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#67B32D',
        marginBottom: 8,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    question: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#67B32D',
        lineHeight: 40,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    comingSoon: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
    },
});