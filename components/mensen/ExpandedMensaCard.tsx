// components/mensen/ExpandedMensaCard.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { getMensaImage } from '@/utils/getMensaImage';
import {
    isMensaSaved,
    addMensaToSaved,
    removeMensaFromSaved
} from '@/lib/cache';

interface ExpandedMensaCardProps {
    mensa: any;
    onBack: () => void;
    onSpeiseplan: (mensaId: string) => void;
    onLieblingsSpeisen: (mensaId: string) => void;
    onRoute: (mensa: any) => void;
}

export default function ExpandedMensaCard({
                                              mensa,
                                              onBack,
                                              onSpeiseplan,
                                              onLieblingsSpeisen,
                                              onRoute,
                                          }: ExpandedMensaCardProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const loadFavoriteStatus = async () => {
            const saved = await isMensaSaved(mensa.id);
            setIsFavorite(saved);
        };
        loadFavoriteStatus();
    }, [mensa.id]);

    const handleRoute = () => {
        if (!mensa.address) return;
        const { street, zipcode, city } = mensa.address;
        const encodedAddress = encodeURIComponent(`${street}, ${zipcode} ${city}`);
        const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        Linking.openURL(url).catch(err =>
            console.error('Fehler beim Öffnen von Google Maps:', err)
        );
    };

    const handleFavorite = async () => {
        try {
            if (isFavorite) {
                await removeMensaFromSaved(mensa.id);
                setIsFavorite(false);
            } else {
                await addMensaToSaved(mensa.id);
                setIsFavorite(true);
            }
        } catch (error) {
            console.error('Fehler beim Umschalten des Favoritenstatus:', error);
        }
    };

    return (
        <View style={styles.expandedCard}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Text style={styles.backText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.contentRow}>
                <View style={styles.imageSection}>
                    <Image source={getMensaImage(mensa.id)} style={styles.mensaImage} />
                    <TouchableOpacity style={styles.heartIcon} onPress={handleFavorite}>
                        <Image
                            source={
                                isFavorite
                                    ? require('@/assets/images/mensen/icons8-heart-50-full.png')
                                    : require('@/assets/images/mensen/icons8-heart-50-half.png')
                            }
                            style={styles.heartImage}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.textSection}>
                        <Text style={styles.mensaTitle}>{mensa.name}</Text>

                        {mensa.address && (
                            <View style={styles.addressContainer}>
                                <Text style={styles.addressText}>{mensa.address.street}</Text>
                                <Text style={styles.addressText}>
                                    {mensa.address.zipcode} {mensa.address.city}
                                </Text>
                            </View>
                        )}

                        {mensa.contactInfo && (
                            <View style={styles.contactContainer}>
                                {mensa.contactInfo.phone && (
                                    <Text style={styles.contactText}>
                                        Telefon: {mensa.contactInfo.phone}
                                    </Text>
                                )}
                                {mensa.contactInfo.email && (
                                    <Text style={styles.contactText}>
                                        E-Mail: {mensa.contactInfo.email}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.buttonBase, styles.buttonPrimary]}
                            onPress={() =>
                                router.push({
                                    pathname: '/speiseplan',
                                    params: { mensaId: mensa.id },
                                })
                            }
                        >
                            <Text style={styles.buttonTextWhite}>Zum Speiseplan</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.buttonBase, styles.buttonOutline]}
                            onPress={() =>
                                router.push({
                                    pathname: '/saved/lieblingsspeisen/[mensaId]',
                                    params: { mensaId: mensa.id },
                                })
                            }
                        >
                            <Text style={styles.buttonTextDark}>Lieblings Speisen</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.buttonBase, styles.buttonOutline]}
                            onPress={handleRoute}
                        >
                            <Text style={styles.buttonTextDark}>Route hierhin</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    expandedCard: {
        backgroundColor: 'white',
        width: '100%',
        height: 180,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: 'hidden',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        width: 24,
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    backText: {
        fontSize: 14,
        color: '#666',
        fontWeight: 'bold',
    },
    contentRow: {
        flexDirection: 'row',
        flex: 1,
    },
    imageSection: {
        width: 120,
        height: '100%',
        backgroundColor: '#f5f5f5',
        position: 'relative',
    },
    mensaImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e0e0e0',
    },
    heartIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
    },
    heartImage: {
        width: 18,
        height: 18,
    },
    infoSection: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    textSection: {
        flex: 1,
    },
    mensaTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
    addressContainer: {
        marginBottom: 6,
    },
    addressText: {
        fontSize: 12,
        color: '#333',
        marginBottom: 1,
    },
    contactContainer: {
        marginBottom: 6,
    },
    contactText: {
        fontSize: 10,
        color: '#666',
        marginBottom: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 4,
        flexWrap: 'wrap',
    },
    buttonBase: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 4,
        alignItems: 'center',
        flex: 1,
        minWidth: 60,
    },
    buttonPrimary: {
        backgroundColor: '#7cb342',
    },
    buttonOutline: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    buttonTextWhite: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonTextDark: {
        color: '#333',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
