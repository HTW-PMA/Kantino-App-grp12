import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export default function SpeiseplanScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Hier wird der Speiseplan implementiert.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 20,
    },
    text: {
        fontSize: 18,
        textAlign: 'center',
        color: '#333',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
});