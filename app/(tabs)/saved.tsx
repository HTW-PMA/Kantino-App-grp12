// app/(tabs)/saved.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Linking,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    getSavedMensen,
    fetchCanteensWithCache,
    removeMensaFromSaved,
    isMensaSaved,
    addMensaToSaved,
} from '@/lib/cache';
import { getMensaImage } from '@/utils/getMensaImage';

export default function SavedScreen() {
    const [search, setSearch] = useState('');
    const [allMensen, setAllMensen] = useState([]);
    const [savedMensenIds, setSavedMensenIds] = useState<string[]>([]);
    const router = useRouter();

    const handleRoute = (mensa: any) => {
        if (!mensa?.address) return;

        const { street, zipcode, city } = mensa.address;
        const encodedAddress = encodeURIComponent(`${street}, ${zipcode} ${city}`);
        const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

        Linking.openURL(url).catch(err =>
            console.error('Fehler beim Öffnen von Google Maps:', err)
        );
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const all = await fetchCanteensWithCache();
            const saved = await getSavedMensen();
            setAllMensen(all);
            setSavedMensenIds(saved);
        } catch (err) {
            console.error('Fehler beim Laden gespeicherter Mensen:', err);
            Alert.alert('Fehler', 'Gespeicherte Mensen konnten nicht geladen werden.');
        }
    };

    const toggleFavorite = async (mensaId: string) => {
        const isSaved = await isMensaSaved(mensaId);
        if (isSaved) {
            const success = await removeMensaFromSaved(mensaId);
            if (success) {
                setSavedMensenIds((prev) => prev.filter((id) => id !== mensaId));
            }
        } else {
            const success = await addMensaToSaved(mensaId);
            if (success) {
                setSavedMensenIds((prev) => [...prev, mensaId]);
            }
        }
    };

    const filteredMensen = allMensen
        .filter((mensa) => savedMensenIds.includes(mensa.id))
        .filter((mensa) =>
            mensa.name.toLowerCase().includes(search.toLowerCase())
        );

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Suche"
                value={search}
                onChangeText={setSearch}
                style={styles.search}
            />

            {filteredMensen.length === 0 ? (
                <View style={{ padding: 20 }}>
                    <Text style={{ textAlign: 'center', color: '#666' }}>
                        Es wurden noch keine Lieblingsmensen hinzugefügt!
                    </Text>
                </View>
            ) : (
                <ScrollView style={styles.cardContainer}>
                    {filteredMensen.map((mensa) => (
                        <View key={mensa.id} style={styles.card}>
                            <View style={styles.imageContainer}>
                                <Image source={getMensaImage(mensa.id)} style={styles.image} />
                                <TouchableOpacity
                                    style={styles.heartIcon}
                                    onPress={() => toggleFavorite(mensa.id)}
                                >
                                    <Image
                                        source={require('@/assets/images/mensen/icons8-heart-50-full.png')}
                                        style={styles.heartImage}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.info}>
                                <Text style={styles.mensaName}>{mensa.name}</Text>

                                {mensa.address && (
                                    <Text>
                                        {mensa.address.street}
                                        {'\n'}
                                        {mensa.address.zipcode} {mensa.address.city}
                                    </Text>
                                )}
                                {mensa.contactInfo?.phone && (
                                    <Text>Telefon: {mensa.contactInfo.phone}</Text>
                                )}
                                {mensa.contactInfo?.email && (
                                    <Text>E-Mail: {mensa.contactInfo.email}</Text>
                                )}

                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={styles.button}
                                        onPress={() =>
                                            router.push({
                                                pathname: '/speiseplan',
                                                params: { mensaId: mensa.id },
                                            })
                                        }
                                    >
                                        <Text>Zum Speiseplan</Text>
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

                                    <TouchableOpacity
                                        style={styles.button}
                                        onPress={() => handleRoute(mensa)}
                                    >
                                        <Text>Route hierhin</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
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
        borderRadius: 12,
        padding: 10,
        marginBottom: 20,
        elevation: 2,
        position: 'relative',
    },
    imageContainer: {
        height: 150,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        borderRadius: 10,
        overflow: 'hidden',
    },
    image: { width: '100%', height: '100%' },
    info: { marginTop: 10 },
    mensaName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
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
    heartIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        zIndex: 10,
    },
    heartImage: {
        width: 22,
        height: 22,
    },
});
