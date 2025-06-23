import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView
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
            //console.log('Mensen geladen:', data);
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
        // console.log('Mensa geklickt:', mensa.name, 'ID:', mensa.id);
        // console.log('Aktuell expandiert:', expandedMensaId);

        if (expandedMensaId === mensa.id) {
            // Collapse if already expanded
            // console.log('Schließe expandierte Karte');
            setExpandedMensaId(null);
        } else {
            // Expand this card
            // console.log('Expandiere Karte mit ID:', mensa.id);
            setExpandedMensaId(mensa.id);
        }
    };

    const handleBackToList = () => {
        setExpandedMensaId(null);
    };

    const handleFavoritePress = (mensa: any) => {
        // console.log('Favorit toggle:', mensa.name);
        // Später: Favoriten-Logik implementieren
    };

    const handleSpeiseplan = (mensaId: string) => {
        // console.log('Navigation zum Speiseplan:', mensaId);
        // Später: Navigation implementieren
    };

    const handleLieblingsSpeisen = (mensaId: string) => {
        // console.log('Navigation zu Lieblings-Speisen:', mensaId);
        // Später: Navigation implementieren
    };

    const handleRoute = (mensa: any) => {
        // console.log('Route zur Mensa:', mensa.name);
        // Später: Google Maps Integration
    };

    const renderMensaGrid = () => {
        const rows = [];
        let currentIndex = 0;

        while (currentIndex < filteredMensen.length) {
            const leftItem = filteredMensen[currentIndex];
            const rightItem = filteredMensen[currentIndex + 1];

            const isLeftExpanded = expandedMensaId === leftItem?.id;
            const isRightExpanded = expandedMensaId === rightItem?.id;

            // console.log(`Row ${currentIndex}: Left=${leftItem?.name} (${leftItem?.id}) expanded=${isLeftExpanded}, Right=${rightItem?.name} (${rightItem?.id}) expanded=${isRightExpanded}`);

            if (isLeftExpanded) {
                // Linke Karte ist expandiert
                rows.push(
                    <View key={`row-${currentIndex}`} style={styles.row}>
                        <View style={styles.expandedCardContainer}>
                            <ExpandedMensaCard
                                mensa={leftItem}
                                onBack={handleBackToList}
                                onSpeiseplan={handleSpeiseplan}
                                onLieblingsSpeisen={handleLieblingsSpeisen}
                                onRoute={handleRoute}
                            />
                        </View>
                    </View>
                );
                // Rechte Karte wird in die nächste Zeile verschoben
                if (rightItem) {
                    currentIndex += 1;
                } else {
                    currentIndex += 2;
                }
            } else if (isRightExpanded) {
                // Rechte Karte ist expandiert - Linke bleibt klein
                rows.push(
                    <View key={`row-${currentIndex}`} style={styles.row}>
                        <MensaCard
                            mensa={leftItem}
                            onPress={handleMensaPress}
                            onFavoritePress={handleFavoritePress}
                        />
                        <View style={styles.emptyCard} />
                    </View>
                );
                rows.push(
                    <View key={`row-${currentIndex + 1}`} style={styles.row}>
                        <View style={styles.expandedCardContainer}>
                            <ExpandedMensaCard
                                mensa={rightItem}
                                onBack={handleBackToList}
                                onSpeiseplan={handleSpeiseplan}
                                onLieblingsSpeisen={handleLieblingsSpeisen}
                                onRoute={handleRoute}
                            />
                        </View>
                    </View>
                );
                currentIndex += 2;
            } else {
                // Normale Zeile mit 2 Karten (kleine Cards)
                rows.push(
                    <View key={`row-${currentIndex}`} style={styles.row}>
                        <MensaCard
                            mensa={leftItem}
                            onPress={handleMensaPress}
                            onFavoritePress={handleFavoritePress}
                        />
                        {rightItem && (
                            <MensaCard
                                mensa={rightItem}
                                onPress={handleMensaPress}
                                onFavoritePress={handleFavoritePress}
                            />
                        )}
                        {/* Falls nur eine Karte in der Zeile, leeren Platz füllen */}
                        {!rightItem && <View style={styles.emptyCard} />}
                    </View>
                );
                currentIndex += 2;
            }
        }

        return rows;
    };

    // Loading State
    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0066cc" />
            </View>
        );
    }

    // Haupt-Listen-View
    return (
        <View style={styles.container}>
            <SearchBar
                value={searchQuery}
                onChangeText={handleSearch}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            >
                {renderMensaGrid()}
            </ScrollView>
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
    scrollView: {
        flex: 1,
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