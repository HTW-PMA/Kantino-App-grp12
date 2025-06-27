import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { storeName, getName, storeSelectedMensa, getSelectedMensa } from '@/lib/storage';
import LocationPicker from '@/components/profil/LocationPicker';

export default function ProfileScreen() {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', ''

    useEffect(() => {
        const loadInitial = async () => {
            try {
                const storedName = await getName();
                const storedMensa = await getSelectedMensa();

                if (storedName) setName(storedName);
                if (storedMensa) setLocation(storedMensa);
            } catch (error) {
                console.error('Fehler beim Laden der Profildaten:', error);
            }
        };
        loadInitial();
    }, []);

    const handleSave = async () => {
        setSaveStatus('saving');

        try {
            // Name speichern (falls vorhanden)
            if (name.trim()) {
                await storeName(name.trim());
            }

            // Ausgewählte Mensa speichern (falls vorhanden)
            if (location) {
                await storeSelectedMensa(location);
            }

            setSaveStatus('saved');
            console.log('Profildaten gespeichert - Name:', name, 'Mensa:', location);

            // Status nach 2 Sekunden zurücksetzen
            setTimeout(() => {
                setSaveStatus('');
            }, 2000);

        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            setSaveStatus('error');
            setTimeout(() => {
                setSaveStatus('');
            }, 2000);
        }
    };

    const getSaveButtonStyle = () => {
        if (saveStatus === 'saving') {
            return [styles.saveButton, styles.saveButtonSaving];
        }
        if (saveStatus === 'saved') {
            return [styles.saveButton, styles.saveButtonSaved];
        }
        if (saveStatus === 'error') {
            return [styles.saveButton, styles.saveButtonError];
        }
        return styles.saveButton;
    };

    const getSaveButtonText = () => {
        if (saveStatus === 'saving') return 'Speichere...';
        if (saveStatus === 'saved') return '✓ Gespeichert';
        if (saveStatus === 'error') return '✗ Fehler';
        return 'Speichern';
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarCircle}>
                        <Image
                            source={require('@/assets/images/profil.png')}
                            style={styles.avatar}
                        />
                    </View>
                </View>

                <Text style={styles.title}>Personal Information</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Max Muster"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.label}>Lieblings-Mensa</Text>
                    <LocationPicker value={location} onChange={setLocation} />

                    <TouchableOpacity
                        style={getSaveButtonStyle()}
                        onPress={handleSave}
                        disabled={saveStatus === 'saving'}
                    >
                        <Text style={styles.saveButtonText}>
                            {getSaveButtonText()}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        alignItems: 'center',
        padding: 24,
    },
    avatarContainer: {
        marginBottom: 20,
    },
    avatarCircle: {
        backgroundColor: '#e0f2e9',
        borderRadius: 60,
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        tintColor: '#67b32d',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#333',
    },
    form: {
        width: '100%',
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#444',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    saveButton: {
        backgroundColor: '#67b32d',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonSaving: {
        backgroundColor: '#94a3b8', // Grau während Speichern
    },
    saveButtonSaved: {
        backgroundColor: '#662b60', // Grün für Erfolg
    },
    saveButtonError: {
        backgroundColor: '#ef4444', // Rot für Fehler
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});