// app/(tabs)/saved.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import CustomHeader from '@/components/CustomHeader';
import { useRouter } from 'expo-router';

export default function SavedScreen() {
    const [search, setSearch] = useState('');
    const router = useRouter();

    const filteredMensen = [
        {
            id: 'ash-berlin', // mensaId für die Navigation
            name: 'Mensa ASH Hellersdorf',
            address: 'Alice-Salomon-Platz 5\n12627 Berlin',
            phone: '+49(30)393939',
            email: 'mensen@stw.berlin',
            image: require('../../assets/images/mensen/mensa_ash.jpg'),
        },
    ];

    return (
        <View style={styles.container}>
            <CustomHeader title="Lieblings-Mensa" onMenuPress={() => console.log('Menü gedrückt')} />

            <TextInput
                placeholder="Suche"
                value={search}
                onChangeText={setSearch}
                style={styles.search}
            />

            <ScrollView style={styles.cardContainer}>
                {filteredMensen.map((mensa) => (
                    <View key={mensa.id} style={styles.card}>
                        <Image source={mensa.image} style={styles.image} />
                        <View style={styles.info}>
                            <Text>{mensa.address}</Text>
                            <Text>Telefon: {mensa.phone}</Text>
                            <Text>E-Mail: {mensa.email}</Text>
                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={styles.button}>
                                    <Text>Zum Speiseplan</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.button}>
                                    <Text>Route hierhin</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/saved/lieblingsspeisen/[mensaId]',
                                            params: { mensaId: mensa.id },
                                        })
                                    }
                                >
                                    <Text>Lieblings-Speisen</Text>
                                </TouchableOpacity>


                            </View>
                        </View>
                        <Text style={styles.mensaName}>{mensa.name}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    search: {
        margin: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    cardContainer: { paddingHorizontal: 10 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        marginBottom: 20,
        elevation: 2,
    },
    image: { width: '100%', height: 150, borderRadius: 10 },
    info: { marginTop: 10 },
    mensaName: { marginTop: 10, fontWeight: 'bold' },
    buttonRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    button: {
        padding: 8,
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 5,
        marginBottom: 5,
    },
});
