import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
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

    // Lädt Name beim ersten Rendern
    useEffect(() => {
        loadUserName();
    }, []);

    // Lädt Name erneut, wenn der Tab fokussiert wird
    useFocusEffect(
        React.useCallback(() => {
            loadUserName();
        }, [])
    );

    return (
        <View style={styles.container}>
            <View style={styles.messageContainer}>
                <Text style={styles.greeting}>
                    {userName ? `Hi ${userName},` : 'Hi,'}
                </Text>
                <Text style={styles.question}>how can I help you?</Text>
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>Ich kann dir helfen bei:</Text>
                <Text style={styles.infoItem}>• "Was kann ich heute essen?"</Text>
                <Text style={styles.infoItem}>• "Zeige mir vegetarische Gerichte"</Text>
                <Text style={styles.infoItem}>• "Was gibt es in meiner Lieblings-Mensa?"</Text>
                <Text style={styles.infoItem}>• "Günstige Gerichte"</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        backgroundColor: '#f4f5f6',
    },
    messageContainer: {
        marginBottom: 40,
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
    infoContainer: {
        backgroundColor: '#f4f5f6',
        padding: 20,
        borderRadius: 12,
        width: '100%',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    infoItem: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
        paddingLeft: 8,
    },
});