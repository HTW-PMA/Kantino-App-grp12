import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { storeName, getName, removeName } from '@/lib/cache';

export default function ProfileScreen() {
    const [name, setName] = useState('');
    const [savedName, setSavedName] = useState<string | null>(null);

    useEffect(() => {
        loadSavedName();
    }, []);

    const loadSavedName = async () => {
        const storedName = await getName();
        setSavedName(storedName);
        if (storedName) {
            setName(storedName);
        }
    };

    const handleSaveName = async () => {
        if (name.trim()) {
            await storeName(name.trim());
            setSavedName(name.trim());
            Alert.alert('Erfolg', 'Name wurde gespeichert!');
        } else {
            Alert.alert('Fehler', 'Bitte gib einen Namen ein.');
        }
    };

    const handleClearName = async () => {
        Alert.alert(
            'Name löschen',
            'Möchtest du deinen Namen wirklich löschen?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Löschen',
                    style: 'destructive',
                    onPress: async () => {
                        await removeName();
                        setName('');
                        setSavedName(null);
                        Alert.alert('Erfolg', 'Name wurde gelöscht!');
                    }
                }
            ]
        );
    };

    return (
        <View>
            <Text>Hier wird Profil implementiert.</Text>
        </View>
    );
}