import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getMensaImage } from '@/utils/getMensaImage';
import {
    isMensaSaved,
    addMensaToSaved,
    removeMensaFromSaved,
} from '@/lib/cache';

interface MensaCardProps {
    mensa: any;
    onPress: (mensa: any) => void;
    onFavoritePress?: (mensa: any) => void;
}

export default function MensaCard({ mensa, onPress, onFavoritePress }: MensaCardProps) {
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const checkFavorite = async () => {
            const saved = await isMensaSaved(mensa.id);
            setIsFavorite(saved);
        };
        checkFavorite();
    }, [mensa.id]);

    const handleFavorite = async () => {
        try {
            if (isFavorite) {
                const success = await removeMensaFromSaved(mensa.id);
                if (success) setIsFavorite(false);
            } else {
                const success = await addMensaToSaved(mensa.id);
                if (success) setIsFavorite(true);
            }

            onFavoritePress?.(mensa); // optionaler Callback
        } catch (error) {
            console.error('Fehler beim Speichern der Favoriten:', error);
        }
    };

    return (
        <TouchableOpacity style={styles.mensaCard} onPress={() => onPress(mensa)}>
            <View style={styles.imageContainer}>
                <Image
                    source={getMensaImage(mensa.id)}
                    style={styles.mensaImage}
                />
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

            <View style={styles.cardContent}>
                <Text style={styles.mensaName} numberOfLines={2}>
                    {mensa.name}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    mensaCard: {
        backgroundColor: 'white',
        width: '48%',
        marginBottom: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: 'hidden',
    },
    imageContainer: {
        height: 120,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    mensaImage: {
        width: '100%',
        height: '100%',
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
    },
    heartImage: {
        width: 22,
        height: 22,
    },
    cardContent: {
        padding: 12,
        minHeight: 50,
    },
    mensaName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        lineHeight: 18,
        textAlign: 'center',
    },
});
