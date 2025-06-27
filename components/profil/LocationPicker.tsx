// components/profil/LocationPicker.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { fetchCanteensWithCache } from '@/lib/storage';

interface LocationPickerProps {
    value: string;
    onChange: (mensaId: string) => void;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
    const [mensen, setMensen] = useState<any[]>([]);

    useEffect(() => {
        fetchCanteensWithCache()
            .then(data => {
                const echteMensen = data.filter((m: any) => {
                    const name = m.name?.toLowerCase();
                    return name && !name.includes('backshop') && !name.includes('späti');
                });
                setMensen(echteMensen);
            })
            .catch(error => {
                console.error('Fehler beim Laden der Mensen:', error);
            });
    }, []);

    return (
        <View style={styles.wrapper}>
            <Picker
                selectedValue={value}
                onValueChange={(itemValue) => onChange(itemValue)}
                style={styles.picker}
                dropdownIconColor="#333"
            >
                <Picker.Item label="Bitte Mensa wählen" value="" />
                {mensen.map((mensa) => {
                    const mensaId = mensa.id || mensa._id;
                    return (
                        <Picker.Item
                            key={mensaId}
                            label={mensa.name}
                            value={mensaId}
                        />
                    );
                })}
            </Picker>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 20,
        zIndex: 10,
    },
    picker: {
        backgroundColor: '#fafafa',
    },
});