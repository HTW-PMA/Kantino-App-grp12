import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Alert,
    FlatList
} from 'react-native';
import { fetchCanteensWithCache } from '@/lib/cache';
import MensaCard from '@/components/mensen/MensaCard';
import ExpandedMensaCard from '@/components/mensen/ExpandedMensaCard';
import SearchBar from '@/components/mensen/SearchBar';

export default function MensenScreen() {
    const [mensen, setMensen] = useState([]);
    const [filteredMensen, setFilteredMensen] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedMensaId, setExpandedMensaId] = useState(null);

    useEffect(() => {
        loadMensen();
    }, []);

    const loadMensen = async () => {
        try {
            setLoading(true);
            const data = await fetchCanteensWithCache();
            console.log('Mensen geladen:', data);
            setMensen(data);
            setFilteredMensen(data);
        } catch (error) {
            console.error('Fehler beim Laden der Mensen:', error);
            Alert.alert(
                'Fehler',
                'Mensen konnten nicht geladen werden. Bitte versuche es später erneut.'
            );
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
        // Später: Favoriten-Logik implementieren
    };

    const handleSpeiseplan = (mensaId: string) => {
        // Später: Navigation implementieren
    };

    const handleLieblingsSpeisen = (mensaId: string) => {
        // Später: Navigation implementieren
    };

    const handleRoute = (mensa: any) => {
        // Google Maps Integration
    };

    // Deine ursprüngliche Grid-Logik, aber optimiert mit useMemo
    const gridRows = useMemo(() => {
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
                    id: `row-${currentIndex}`,
                    type: 'expanded',
                    mensa: leftItem,
                });
                // Rechte Karte wird in die nächste Zeile verschoben
                if (rightItem) {
                    currentIndex += 1;
                } else {
                    currentIndex += 2;
                }
            } else if (isRightExpanded) {
                // Rechte Karte ist expandiert - Linke bleibt klein
                rows.push({
                    id: `row-${currentIndex}`,
                    type: 'leftOnly',
                    leftItem: leftItem,
                });
                rows.push({
                    id: `row-${currentIndex + 1}`,
                    type: 'expanded',
                    mensa: rightItem,
                });
                currentIndex += 2;
            } else {
                // Normale Zeile mit 2 Karten (kleine Cards)
                rows.push({
                    id: `row-${currentIndex}`,
                    type: 'normal',
                    leftItem: leftItem,
                    rightItem: rightItem,
                });
                currentIndex += 2;
            }
        }

        return rows;
    }, [filteredMensen, expandedMensaId]);

    const renderRow = ({ item }: { item: any }) => {
        if (item.type === 'expanded') {
            return (
                <View style={styles.row}>
                    <View style={styles.expandedCardContainer}>
                        <ExpandedMensaCard
                            mensa={item.mensa}
                            onBack={handleBackToList}
                            onSpeiseplan={handleSpeiseplan}
                            onLieblingsSpeisen={handleLieblingsSpeisen}
                            onRoute={handleRoute}
                        />
                    </View>
                </View>
            );
        }

        if (item.type === 'leftOnly') {
            return (
                <View style={styles.row}>
                    <MensaCard
                        mensa={item.leftItem}
                        onPress={handleMensaPress}
                        onFavoritePress={handleFavoritePress}
                    />
                    <View style={styles.emptyCard} />
                </View>
            );
        }

        // Normal row
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

    // Loading State
    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0066cc" />
            </View>
        );
    }

    // Haupt-Listen-View mit FlatList statt ScrollView
    return (
        <View style={styles.container}>
            <SearchBar
                value={searchQuery}
                onChangeText={handleSearch}
            />

            <FlatList
                data={gridRows}
                renderItem={renderRow}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                removeClippedSubviews={true}
                maxToRenderPerBatch={5}
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
    },
    emptyCard: {
        width: '48%',
    },
});