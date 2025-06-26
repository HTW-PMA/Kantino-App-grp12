// LocationPicker.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { fetchCanteens } from '@/lib/api/mensaService.ts';

interface LocationPickerProps {
    value: string;
    onChange: (newLocation: string) => void;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
    const [mensen, setMensen] = useState<any[]>([]);

    useEffect(() => {
        fetchCanteens().then(setMensen).catch(console.error);
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
                {mensen.map((mensa) => (
                    <Picker.Item key={mensa.id} label={mensa.name} value={mensa.name} />
                ))}
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
