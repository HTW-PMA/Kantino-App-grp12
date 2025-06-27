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
    Alert,
} from 'react-native';
import { storeName, getName } from '@/lib/storage';
import LocationPicker from '@/components/profil/LocationPicker';

export default function ProfileScreen() {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');

    useEffect(() => {
        const loadInitial = async () => {
            const storedName = await getName();
            if (storedName) setName(storedName);
        };
        loadInitial();
    }, []);

    const handleSave = async () => {
        if (name.trim()) {
            await storeName(name.trim());
        }
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

                    <LocationPicker value={location} onChange={setLocation} />

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Speichern</Text>
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
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
