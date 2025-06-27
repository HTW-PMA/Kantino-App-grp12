// app/(tabs)/mensen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Alert,
    FlatList
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchCanteensWithCache } from '@/lib/storage';
import MensaCard from '@/components/mensen/MensaCard';
import ExpandedMensaCard from '@/components/mensen/ExpandedMensaCard';
import SearchBar from '@/components/mensen/SearchBar';

export default function MensenScreen() {
    const router = useRouter();
    const [mensen, setMensen] = useState([]);
    const [filteredMensen, setFilteredMensen] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedMensaId, setExpandedMensaId] = useState(null);

    useFocusEffect(
        useCallback(() => {
            loadMensen();
            setExpandedMensaId(null);
        }, [])
    );


    const loadMensen = async () => {
        setLoading(true);
        try {
            const data = await fetchCanteensWithCache();

            if (Array.isArray(data) && data.length > 0) {
                setMensen(data);
                setFilteredMensen(data);
                console.log('Mensen erfolgreich geladen');
            } else {
                throw new Error('Keine Daten verfügbar');
            }

        } catch (error: any) {
            console.error('Fehler beim Laden der Mensen:', error.message);
            Alert.alert(
                'Offline-Modus',
                'Mensen konnten nicht online geladen werden. Es werden ggf. gespeicherte Daten angezeigt.'
            );

            // Versuche aus dem Cache zu laden, auch wenn fetchCanteensWithCache fehlgeschlagen ist
            try {
                const fallbackRaw = await AsyncStorage.getItem('canteens');
                if (fallbackRaw) {
                    const fallback = JSON.parse(fallbackRaw);
                    setMensen(fallback);
                    setFilteredMensen(fallback);
                    console.log('Fallback-Daten aus Cache geladen');
                } else {
                    console.warn('Kein Cache verfügbar');
                }
            } catch (fallbackError) {
                console.error('Kein Fallback möglich:', fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text === '') {
            setFilteredMensen(mensen);
        } else {
            const filtered = mensen.filter(mensa =>
                mensa.name.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredMensen(filtered);
        }
    };

    const handleMensaPress = (mensa: any) => {
        if (expandedMensaId === mensa.id) {
            setExpandedMensaId(null);
        } else {
            setExpandedMensaId(mensa.id);
        }
    };

    const handleBackToList = () => {
        setExpandedMensaId(null);
    };

    const handleFavoritePress = (mensa: any) => {
        console.log('Favorit toggle:', mensa.name);
        // Favoriten-Logik implementieren
    };

    const handleSpeiseplan = (mensaId: string) => {
        console.log('Navigation zum Speiseplan:', mensaId);
        // Navigation implementieren
    };

    const handleLieblingsSpeisen = (mensaId: string) => {
        console.log('Navigation zu Lieblings-Speisen:', mensaId);
        // Navigation implementieren
    };

    const handleRoute = (mensa: any) => {
        console.log('Route zur Mensa:', mensa.name);
        // Google Maps Integration
    };

    // Korrigierte Grid-Logik für FlatList
    const renderMensaGrid = () => {
        const rows = [];
        let currentIndex = 0;

        while (currentIndex < filteredMensen.length) {
            const leftItem = filteredMensen[currentIndex];
            const rightItem = filteredMensen[currentIndex + 1];

            const isLeftExpanded = expandedMensaId === leftItem?.id;
            const isRightExpanded = expandedMensaId === rightItem?.id;

            if (isLeftExpanded) {
                // Linke Karte ist expandiert
                rows.push({
                    id: `expanded-left-${currentIndex}`,
                    type: 'expandedLeft',
                    leftItem: leftItem,
                    index: currentIndex
                });

                // Rechte Karte separat hinzufügen falls vorhanden
                if (rightItem) {
                    rows.push({
                        id: `single-right-${currentIndex + 1}`,
                        type: 'single',
                        item: rightItem,
                        index: currentIndex + 1
                    });
                }
                currentIndex += 2;
            } else if (isRightExpanded) {
                // Linke Karte normal, rechte Karte expandiert
                rows.push({
                    id: `single-left-${currentIndex}`,
                    type: 'single',
                    item: leftItem,
                    index: currentIndex
                });

                rows.push({
                    id: `expanded-right-${currentIndex + 1}`,
                    type: 'expandedRight',
                    rightItem: rightItem,
                    index: currentIndex + 1
                });
                currentIndex += 2;
            } else {
                // Normale Zeile mit 2 Karten
                rows.push({
                    id: `normal-${currentIndex}`,
                    type: 'normal',
                    leftItem: leftItem,
                    rightItem: rightItem,
                    index: currentIndex
                });
                currentIndex += 2;
            }
        }

        return rows;
    };

    const renderGridItem = ({ item }) => {
        if (item.type === 'expandedLeft') {
            return (
                <View style={styles.expandedCardContainer}>
                    <ExpandedMensaCard
                        mensa={item.leftItem}
                        onBack={handleBackToList}
                        onSpeiseplan={handleSpeiseplan}
                        onLieblingsSpeisen={handleLieblingsSpeisen}
                        onRoute={handleRoute}
                    />
                </View>
            );
        }

        if (item.type === 'expandedRight') {
            return (
                <View style={styles.expandedCardContainer}>
                    <ExpandedMensaCard
                        mensa={item.rightItem}
                        onBack={handleBackToList}
                        onSpeiseplan={handleSpeiseplan}
                        onLieblingsSpeisen={handleLieblingsSpeisen}
                        onRoute={handleRoute}
                    />
                </View>
            );
        }

        if (item.type === 'single') {
            return (
                <View style={styles.row}>
                    <MensaCard
                        mensa={item.item}
                        onPress={handleMensaPress}
                        onFavoritePress={handleFavoritePress}
                    />
                    <View style={styles.emptyCard} />
                </View>
            );
        }

        // Normale Zeile
        return (
            <View style={styles.row}>
                <MensaCard
                    mensa={item.leftItem}
                    onPress={handleMensaPress}
                    onFavoritePress={handleFavoritePress}
                />
                {item.rightItem ? (
                    <MensaCard
                        mensa={item.rightItem}
                        onPress={handleMensaPress}
                        onFavoritePress={handleFavoritePress}
                    />
                ) : (
                    <View style={styles.emptyCard} />
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0066cc" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SearchBar
                value={searchQuery}
                onChangeText={handleSearch}
            />

            <FlatList
                data={renderMensaGrid()}
                renderItem={renderGridItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={8}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    listContainer: {
        padding: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    expandedCardContainer: {
        width: '100%',
        marginBottom: 15,
    },
    emptyCard: {
        width: '48%',
    },
});