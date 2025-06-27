// app/(tabs)/saved.tsx
import React, { useState, useCallback } from 'react';
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
    getFavoriteMealsWithContext,
    removeMealFromFavoritesWithContext,
    getFavoriteCategories,
} from '@/lib/storage';
import { getMensaImage } from '@/utils/getMensaImage';

interface FavoriteMealWithContext {
    id: string;
    name: string;
    category?: string;
    badges?: string[];
    additives?: string[];
    prices?: {
        students?: number;
        employees?: number;
        guests?: number;
    };
    // Kontext-Informationen
    mensaId: string;
    mensaName: string;
    dateAdded: string;
    dayOfWeek: string;
    originalDate: string;
}

export default function SavedScreen() {
    const [activeTab, setActiveTab] = useState<'mensen' | 'speisen'>('mensen');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Mensen State
    const [allMensen, setAllMensen] = useState([]);
    const [savedMensenIds, setSavedMensenIds] = useState<string[]>([]);

    // Speisen State
    const [favoriteMeals, setFavoriteMeals] = useState<FavoriteMealWithContext[]>([]);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);

    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            // Lade Mensen
            const allMensenData = await fetchCanteensWithCache();
            const savedMensenData = await getSavedMensen();
            setAllMensen(allMensenData);
            setSavedMensenIds(savedMensenData);

            // Lade Lieblingsspeisen mit Kontext
            await loadFavoriteMeals();
        } catch (err) {
            console.error('Fehler beim Laden der Daten:', err);
            Alert.alert('Fehler', 'Daten konnten nicht geladen werden.');
        }
    };

    const loadFavoriteMeals = async () => {
        try {
            // Lade echte Lieblingsspeisen aus AsyncStorage
            const meals = await getFavoriteMealsWithContext();
            setFavoriteMeals(meals);

            // Lade verfügbare Kategorien
            const categories = await getFavoriteCategories();
            setAvailableCategories(categories);
        } catch (error) {
            console.error('Fehler beim Laden der Lieblingsspeisen:', error);
        }
    };

    const handleRoute = (mensa: any) => {
        if (!mensa?.address) return;
        const { street, zipcode, city } = mensa.address;
        const encodedAddress = encodeURIComponent(`${street}, ${zipcode} ${city}`);
        const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        Linking.openURL(url).catch(err =>
            console.error('Fehler beim Öffnen von Google Maps:', err)
        );
    };

    const toggleMensaFavorite = async (mensaId: string) => {
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

    const handleRemoveMealFromFavorites = async (mealId: string, mealName: string) => {
        const success = await removeMealFromFavoritesWithContext(mealId);
        if (success) {
            // Aktualisiere die lokale Liste
            setFavoriteMeals(prev => prev.filter(meal => meal.id !== mealId));
            // Aktualisiere auch die Kategorien
            const updatedCategories = await getFavoriteCategories();
            setAvailableCategories(updatedCategories);
        }
    };

    // Filter Logik
    const filteredMensen = allMensen
        .filter((mensa) => savedMensenIds.includes(mensa.id))
        .filter((mensa) =>
            mensa.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const filteredMeals = favoriteMeals
        .filter(meal =>
            categoryFilter === 'all' || meal.category === categoryFilter
        )
        .filter(meal =>
            meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            meal.mensaName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            // Sortiere nach dateAdded - neueste zuerst
            const dateA = new Date(a.dateAdded);
            const dateB = new Date(b.dateAdded);
            return dateB.getTime() - dateA.getTime();
        });

    const renderBadges = (badges?: string[]) => {
        if (!badges || badges.length === 0) return null;
        return (
            <View style={styles.badgeContainer}>
                {badges.includes('vegetarian') && <Text style={styles.badge}>🌱</Text>}
                {badges.includes('vegan') && <Text style={styles.badge}>🌿</Text>}
                {badges.includes('co2') && <Text style={styles.badge}>🌍</Text>}
            </View>
        );
    };

    const renderTabButtons = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tabButton, activeTab === 'mensen' && styles.activeTab]}
                onPress={() => setActiveTab('mensen')}
            >
                <Text style={[styles.tabText, activeTab === 'mensen' && styles.activeTabText]}>
                    Lieblingsmensen
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tabButton, activeTab === 'speisen' && styles.activeTab]}
                onPress={() => setActiveTab('speisen')}
            >
                <Text style={[styles.tabText, activeTab === 'speisen' && styles.activeTabText]}>
                    Lieblingsspeisen
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderSearchAndFilter = () => (
        <View style={styles.searchContainer}>
            <TextInput
                placeholder={activeTab === 'mensen' ? 'Suche Mensen...' : 'Suche Speisen...'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
            />

            {activeTab === 'speisen' && availableCategories.length > 0 && (
                <View style={styles.filterContainer}>
                    <Text style={styles.filterLabel}>Kategorie:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[styles.filterChip, categoryFilter === 'all' && styles.activeFilterChip]}
                            onPress={() => setCategoryFilter('all')}
                        >
                            <Text style={[styles.filterChipText, categoryFilter === 'all' && styles.activeFilterChipText]}>
                                Alle
                            </Text>
                        </TouchableOpacity>
                        {availableCategories.map(category => (
                            <TouchableOpacity
                                key={category}
                                style={[styles.filterChip, categoryFilter === category && styles.activeFilterChip]}
                                onPress={() => setCategoryFilter(category)}
                            >
                                <Text style={[styles.filterChipText, categoryFilter === category && styles.activeFilterChipText]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    const renderMensenContent = () => {
        if (filteredMensen.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Keine Lieblingsmensen</Text>
                    <Text style={styles.emptySubtitle}>
                        Füge Mensen zu deinen Favoriten hinzu
                    </Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.contentContainer}>
                {filteredMensen.map((mensa) => (
                    <View key={mensa.id} style={styles.mensaCard}>
                        <View style={styles.mensaImageContainer}>
                            <Image source={getMensaImage(mensa.id)} style={styles.mensaImage} />
                            <TouchableOpacity
                                style={styles.heartIcon}
                                onPress={() => toggleMensaFavorite(mensa.id)}
                            >
                                <Image
                                    source={require('@/assets/images/mensen/icons8-heart-50-full.png')}
                                    style={styles.heartImage}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.mensaInfo}>
                            <Text style={styles.mensaName}>{mensa.name}</Text>
                            {mensa.address && (
                                <Text style={styles.mensaAddress}>
                                    {mensa.address.street}, {mensa.address.zipcode} {mensa.address.city}
                                </Text>
                            )}

                            <View style={styles.mensaButtonRow}>
                                <TouchableOpacity
                                    style={styles.mensaButton}
                                    onPress={() => router.push({
                                        pathname: '/speiseplan',
                                        params: { mensaId: mensa.id },
                                    })}
                                >
                                    <Text style={styles.mensaButtonText}>Speiseplan</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.mensaButton}
                                    onPress={() => handleRoute(mensa)}
                                >
                                    <Text style={styles.mensaButtonText}>Route</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const renderSpeisenContent = () => {
        if (filteredMeals.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Keine Lieblingsspeisen</Text>
                    <Text style={styles.emptySubtitle}>
                        Füge Gerichte aus dem Speiseplan zu deinen Favoriten hinzu
                    </Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.contentContainer}>
                {filteredMeals.map((meal) => (
                    <View key={meal.id} style={styles.mealCard}>
                        <View style={styles.mealHeader}>
                            <Text style={styles.mealName} numberOfLines={2}>
                                {meal.name}
                            </Text>
                            <TouchableOpacity
                                style={styles.removeMealButton}
                                onPress={() => handleRemoveMealFromFavorites(meal.id, meal.name)}
                            >
                                <Text style={styles.removeMealButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.mealContext}>
                            <Text style={styles.mealContextText}>
                                📍 {meal.mensaName} • 📅 {meal.dayOfWeek}, {formatDate(meal.originalDate)}
                            </Text>
                        </View>

                        {/* Preise anzeigen */}
                        {meal.prices && (meal.prices.students || meal.prices.employees || meal.prices.guests) && (
                            <Text style={styles.priceText}>
                                {meal.prices.students && `Studierende: ${meal.prices.students.toFixed(2)}€`}
                                {meal.prices.employees && `${meal.prices.students ? ' • ' : ''}Angestellte: ${meal.prices.employees.toFixed(2)}€`}
                                {meal.prices.guests && `${(meal.prices.students || meal.prices.employees) ? ' • ' : ''}Gäste: ${meal.prices.guests.toFixed(2)}€`}
                            </Text>
                        )}

                        <View style={styles.mealFooter}>
                            {renderBadges(meal.badges)}
                        </View>

                        {meal.additives && meal.additives.length > 0 && (
                            <Text style={styles.mealAdditives}>
                                Zusatzstoffe: {meal.additives.join(', ')}
                            </Text>
                        )}
                    </View>
                ))}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            {renderTabButtons()}
            {renderSearchAndFilter()}
            {activeTab === 'mensen' ? renderMensenContent() : renderSpeisenContent()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        margin: 16,
        borderRadius: 12,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#662a60',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: 'white',
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchInput: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    filterContainer: {
        marginTop: 12,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    filterChip: {
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    activeFilterChip: {
        backgroundColor: '#662a60',
        borderColor: '#662a60',
    },
    filterChipText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    activeFilterChipText: {
        color: 'white',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    // Mensen Styles
    mensaCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    mensaImageContainer: {
        position: 'relative',
    },
    mensaImage: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    heartIcon: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    heartImage: {
        width: 20,
        height: 20,
    },
    mensaInfo: {
        padding: 16,
    },
    mensaName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    mensaAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    mensaButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    mensaButton: {
        flex: 1,
        backgroundColor: '#662a60',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    mensaButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    // Speisen Styles
    mealCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    mealName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 12,
        lineHeight: 22,
    },
    removeMealButton: {
        backgroundColor: '#ff4757',
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeMealButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    mealContext: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
    },
    mealContextText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    mealCategory: {
        fontSize: 12,
        color: '#662a60',
        fontWeight: '600',
        marginBottom: 8,
    },
    mealFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 8,
    },
    priceText: {
        fontSize: 14,
        color: '#495057',
        marginBottom: 6,
        fontWeight: '500'
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        fontSize: 16,
    },
    mealAdditives: {
        fontSize: 11,
        color: '#999',
        marginTop: 8,
        fontStyle: 'italic',
    },
});