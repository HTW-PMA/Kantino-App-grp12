import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, Platform, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { fetchCanteensWithCache } from '@/lib/storage';
import { fetchMenuWithCache } from '@/lib/storage';
import * as Network from 'expo-network';
import { getSelectedMensa } from '@/lib/storage';
import {
    addMealToFavoritesWithContext,
    removeMealFromFavoritesWithContext,
    isMealFavoriteWithContext
} from '@/lib/storage';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

// Funktion zum Ermitteln des nächsten Werktags (Montag-Freitag)
const getNextWorkingDay = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sonntag, 1 = Montag, ..., 6 = Samstag

    let daysToAdd = 0;

    if (dayOfWeek === 0) {
        daysToAdd = 1;
    } else if (dayOfWeek === 6) {
        daysToAdd = 2;
    } else {
        daysToAdd = 0;
    }

    const nextWorkingDay = new Date(now.getTime() + daysToAdd * 86400000);
    return formatDate(nextWorkingDay);
};

const today = formatDate(new Date());
const defaultDate = getNextWorkingDay();

// Intelligente Kategorien-Sortierung basierend auf Inhalt
const sortCategories = (groupedMeals: any) => {
    const categories = Object.keys(groupedMeals);

    // Basierend auf Kategorie-Typ
    const sortedCategories = categories.sort((a, b) => {
        const getPriority = (category: string) => {
            const cat = category.toLowerCase();

            if (cat.includes('aktion') || cat.includes('angebot')) return 1;

            if (cat.includes('essen') || cat.includes('hauptgericht')) return 2;

            if (cat.includes('salat')) return 3;

            if (cat.includes('suppe')) return 4;

            if (cat.includes('vorspeise')) return 5;

            if (cat.includes('dessert') || cat.includes('nachspeise')) return 6;

            if (cat.includes('beilage')) return 7;

            if (cat.includes('getränk')) return 8;

            if (cat.includes('snack')) return 9;

            return 10;
        };

        const priorityA = getPriority(a);
        const priorityB = getPriority(b);

        // Wenn gleiche Priorität, alphabetisch sortieren
        if (priorityA === priorityB) {
            return a.localeCompare(b);
        }

        return priorityA - priorityB;
    });

    return sortedCategories;
};

// Generiere die nächsten 7 Tage mit Wochentagen und Status
const getNext7DaysWithStatus = () => {
    const dates = [];
    const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

    for (let i = 0; i < 7; i++) {
        const date = new Date(Date.now() + i * 86400000);
        const dateString = formatDate(date);
        const dayOfWeek = date.getDay();
        const weekdayName = weekdays[dayOfWeek];

        // Mensa ist Mo-Fr geöffnet (1-5), Sa+So geschlossen (0,6)
        const isOpen = dayOfWeek >= 1 && dayOfWeek <= 5;

        dates.push({
            date: dateString,
            weekday: weekdayName,
            isOpen: isOpen,
            dayIndex: i
        });
    }

    return dates;
};

// Formatiere Label mit Wochentag und Datum
const getDateLabel = (dateInfo: any) => {
    const { weekday, date, isOpen, dayIndex } = dateInfo;

    // Datum im Format DD.MM
    const dateObj = new Date(date);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const shortDate = `${day}.${month}`;

    let label = '';
    if (dayIndex === 0) {
        label = `Heute, ${weekday} ${shortDate}`;
    } else {
        label = `${weekday} ${shortDate}`;
    }

    if (!isOpen) {
        return `${label} - Geschlossen`;
    }

    return label;
};

// Badge: Icon- oder Emoji-Zuordnung
const getBadgeVisual = (badgeName: string): any => {
    const name = badgeName.toLowerCase();
    if (name.includes('h2o')) return null;

    try {
        if (name.includes('vegan')) return require('@/assets/images/speiseplan/vegan.png');
        if (name.includes('bio') || name.includes('vegetarisch')) return require('@/assets/images/speiseplan/bio.png');
        if (name.includes('co2_bewertung_a')) return require('@/assets/images/speiseplan/co2_green.png');
        if (name.includes('co2_bewertung_b')) return require('@/assets/images/speiseplan/co2_orange.png');
        if (name.includes('co2_bewertung_c')) return require('@/assets/images/speiseplan/co2_red.png');
        if (name.includes('grüner ampelpunkt')) return '🟢';
        if (name.includes('gelber ampelpunkt')) return '🟡';
        if (name.includes('roter ampelpunkt')) return '🔴';
    } catch (error) {
        console.error('❌ Fehler beim Laden des Badges:', badgeName, error);
    }

    return null;
};

const hasBadgeVisual = (badgeName: string): boolean => {
    return !!getBadgeVisual(badgeName);
};

function BadgeIcon({ badge }: { badge: { name: string; description?: string } }) {
    const visual = getBadgeVisual(badge.name);
    if (!visual) return null;

    if (typeof visual === 'string') {
        return (
            <View style={styles.badgeContainer}>
                <Text style={styles.emoji}>{visual}</Text>
            </View>
        );
    }

    return (
        <View style={styles.badgeContainer}>
            <Image source={visual} style={styles.badgeImage} resizeMode="contain" />
        </View>
    );
}

// Like-Button Komponente
function LikeButton({
                        meal,
                        mensaInfo
                    }: {
    meal: any;
    mensaInfo: { mensaId: string; mensaName: string; date: string; }
}) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkFavoriteStatus = async () => {
            try {
                const favoriteStatus = await isMealFavoriteWithContext(meal.id || meal.name);
                setIsFavorite(favoriteStatus);
            } catch (error) {
                console.error('Error checking favorite status:', error);
            }
        };

        checkFavoriteStatus();
    }, [meal.id, meal.name]);

    // Prüfe Favoriten-Status auch bei Tab-Fokus
    useFocusEffect(
        useCallback(() => {
            const recheckFavoriteStatus = async () => {
                try {
                    const favoriteStatus = await isMealFavoriteWithContext(meal.id || meal.name);
                    setIsFavorite(favoriteStatus);
                } catch (error) {
                    console.error('Error rechecking favorite status:', error);
                }
            };

            recheckFavoriteStatus();
        }, [meal.id, meal.name])
    );

    const handleToggleFavorite = async () => {
        setIsLoading(true);
        try {
            const mealToSave = {
                id: meal.id || meal.name || `meal-${Date.now()}`,
                name: meal.name,
                category: meal.category,
                badges: meal.badges?.map((b: any) => b.name) || [],
                additives: meal.additives?.map((a: any) => a.text) || [],
                prices: meal.prices?.length > 0 ? {
                    students: meal.prices.find((p: any) => p.priceType?.toLowerCase().includes('stud'))?.price,
                    employees: meal.prices.find((p: any) =>
                        p.priceType?.toLowerCase().includes('angestellte') ||
                        p.priceType?.toLowerCase().includes('mitarb') ||
                        p.priceType?.toLowerCase().includes('employee')
                    )?.price,
                    guests: meal.prices.find((p: any) => p.priceType?.toLowerCase().includes('gäst'))?.price,
                } : undefined,
            };

            if (isFavorite) {
                // Aus Favoriten entfernen
                const success = await removeMealFromFavoritesWithContext(mealToSave.id);
                if (success) {
                    setIsFavorite(false);
                }
            } else {
                // Zu Favoriten hinzufügen
                const success = await addMealToFavoritesWithContext(mealToSave, {
                    mensaId: mensaInfo.mensaId,
                    mensaName: mensaInfo.mensaName,
                    originalDate: mensaInfo.date,
                });

                if (success) {
                    setIsFavorite(true);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TouchableOpacity
            style={styles.likeButton}
            onPress={handleToggleFavorite}
            disabled={isLoading}
        >
            {isLoading ? (
                <Text style={styles.loadingText}>⏳</Text>
            ) : (
                <Image
                    source={
                        isFavorite
                            ? require('@/assets/images/mensen/icons8-heart-50-full.png')
                            : require('@/assets/images/mensen/icons8-heart-50-half.png')
                    }
                    style={styles.heartImage}
                />
            )}
        </TouchableOpacity>
    );
}

export default function SpeiseplanScreen() {
    const { mensaId } = useLocalSearchParams();
    const [canteens, setCanteens] = useState<any[]>([]);
    const [selectedCanteen, setSelectedCanteen] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
    const [menu, setMenu] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Generiere die nächsten 7 Tage mit Status
    const availableDates = getNext7DaysWithStatus();

    // Finde aktuell ausgewähltes Datum-Info
    const selectedDateInfo = availableDates.find(d => d.date === selectedDate);
    const isMensaClosed = selectedDateInfo ? !selectedDateInfo.isOpen : false;

    // Laden der Mensen und Vorauswahl
    useEffect(() => {
        fetchCanteensWithCache()
            .then((data) => {
                // Filter: nur Mensen mit echtem Speiseplan
                const filtered = data.filter((m: any) => {
                    const name = m.name?.toLowerCase();
                    return name && !name.includes('backshop') && !name.includes('späti');
                });

                setCanteens(filtered);

                const fallbackId = filtered[0]?.id || filtered[0]?._id || '';
                setSelectedCanteen((mensaId as string) || fallbackId);
            })
            .catch((e) => console.error('❌ Fehler beim Laden der Mensen:', e));
    }, [mensaId]);

    // Laden der gespeicherten Mensa bei Tab-Fokus
    useFocusEffect(
        React.useCallback(() => {
            const loadSelectedMensa = async () => {
                try {
                    // Wenn eine mensaId als Parameter übergeben wurde, verwende diese
                    if (mensaId && canteens.length > 0) {
                        const mensaExists = canteens.find(c =>
                            (c.id === mensaId) || (c._id === mensaId)
                        );
                        if (mensaExists) {
                            setSelectedCanteen(mensaId as string);
                            console.log('Navigation Parameter Mensa geladen:', mensaId);
                            return; // Früher return - verwende nicht die gespeicherte Mensa
                        }
                    }

                    // Nur wenn keine mensaId Parameter da ist, verwende gespeicherte Mensa
                    const savedMensaId = await getSelectedMensa();
                    if (savedMensaId && canteens.length > 0) {
                        const mensaExists = canteens.find(c =>
                            (c.id === savedMensaId) || (c._id === savedMensaId)
                        );

                        if (mensaExists) {
                            setSelectedCanteen(savedMensaId);
                            console.log('Gespeicherte Mensa geladen:', savedMensaId);
                        }
                    }
                } catch (error) {
                    console.error('Fehler beim Laden der gespeicherten Mensa:', error);
                }
            };

            if (canteens.length > 0) {
                loadSelectedMensa();
            }
        }, [canteens, mensaId])
    );

    // Laden des Menüs (nur wenn Mensa offen ist) - GEÄNDERT: Jetzt mit Cache-Funktionen
    useEffect(() => {
        const loadMenu = async () => {
            if (!selectedCanteen || !selectedDate) return;

            if (isMensaClosed) {
                setMenu([]);
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const network = await Network.getNetworkStateAsync();
                const isOnline = network.isConnected && network.isInternetReachable;

                if (!isOnline && selectedDate !== today) {
                    Alert.alert(
                        'Offline',
                        'Menüdaten für zukünftige Tage können nur mit Internetverbindung angezeigt werden.',
                        [{ text: 'OK' }]
                    );
                    setMenu([]);
                    return;
                }

                const data = await fetchMenuWithCache(selectedCanteen, selectedDate);
                let meals = [];

                if (Array.isArray(data)) {
                    const dayData = data.find(day => day.date === selectedDate);
                    meals = dayData?.meals || [];
                } else {
                    meals = data?.meals || [];
                }

                setMenu(meals);

            } catch (e: any) {
                console.error('❌ Fehler beim Laden des Menüs:', e);
                setMenu([]);
                Alert.alert(
                    'Fehler',
                    'Das Menü konnte nicht geladen werden.',
                    [{ text: 'OK' }]
                );
            } finally {
                setLoading(false);
            }
        };

        loadMenu();
    }, [selectedCanteen, selectedDate, isMensaClosed]);

    const groupedMeals = menu.reduce((groups: any, meal: any) => {
        const cat = meal.category || 'Sonstiges';
        groups[cat] = [...(groups[cat] || []), meal];
        return groups;
    }, {});

    // Mensa-Info für Like-Button
    const selectedMensaData = canteens.find(c => (c.id === selectedCanteen) || (c._id === selectedCanteen));
    const mensaInfo = {
        mensaId: selectedCanteen,
        mensaName: selectedMensaData?.name || 'Unbekannte Mensa',
        date: selectedDate,
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedCanteen}
                    onValueChange={setSelectedCanteen}
                    style={styles.picker}
                >
                    {canteens.map((c) => {
                        const id = c.id || c._id || c.name;
                        return <Picker.Item key={id} label={c.name} value={id} />;
                    })}
                </Picker>
            </View>

            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedDate}
                    onValueChange={setSelectedDate}
                    style={styles.picker}
                >
                    {availableDates.map((dateInfo) => (
                        <Picker.Item
                            key={dateInfo.date}
                            label={getDateLabel(dateInfo)}
                            value={dateInfo.date}
                            enabled={dateInfo.isOpen}
                            color={dateInfo.isOpen ? '#333' : '#dc3545'}
                        />
                    ))}
                </Picker>
            </View>

            {/* Wenn Mensa geschlossen ist */}
            {isMensaClosed && (
                <View style={styles.closedContainer}>
                    <Text style={styles.closedTitle}>Mensa geschlossen</Text>
                    <Text style={styles.closedSubtitle}>
                        Am {selectedDateInfo?.weekday} ist die Mensa geschlossen.
                    </Text>
                    <Text style={styles.closedHint}>
                        Die meisten Mensen haben Mo-Fr geöffnet.
                    </Text>
                </View>
            )}

            {/* Loading Indicator */}
            {loading && <ActivityIndicator size="large" color="#67B32D" />}

            {/* Wenn keine Gerichte verfügbar sind (aber Mensa offen) */}
            {!isMensaClosed && Object.entries(groupedMeals).length === 0 && !loading && (
                <View style={styles.noMenuContainer}>
                    <Text style={styles.noMenuTitle}>Kein Menü verfügbar</Text>
                    <Text style={styles.noMenuSubtitle}>
                        Für {selectedDateInfo?.weekday} ({selectedDate}) ist leider kein Speiseplan verfügbar.
                    </Text>
                    <Text style={styles.noMenuHint}>
                        💡 Versuche ein anderes Datum oder eine andere Mensa
                    </Text>
                </View>
            )}

            {/* Menü anzeigen mit sortierter Reihenfolge */}
            {!isMensaClosed && (() => {
                const sortedCategories = sortCategories(groupedMeals);

                return sortedCategories.map((category) => (
                    <View key={category} style={styles.category}>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        {groupedMeals[category].map((meal: any, i: number) => (
                            <View key={`${meal.id || meal.name}-${i}`} style={styles.mealBox}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.mealName}>{meal.name}</Text>
                                    <View style={styles.rightSection}>
                                        {/* NEU: Like-Button hinzugefügt */}
                                        <LikeButton meal={meal} mensaInfo={mensaInfo} />
                                        {meal.badges?.length > 0 && (
                                            <View style={styles.badgeRow}>
                                                {meal.badges
                                                    .filter((badge: any) =>
                                                        hasBadgeVisual(badge.name) &&
                                                        !badge.name.toLowerCase().includes('h2o')
                                                    )
                                                    .slice(0, 5)
                                                    .map((badge: any, index: number) => (
                                                        <BadgeIcon key={index} badge={badge} />
                                                    ))}
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {meal.prices?.length > 0 && (
                                    <Text style={styles.priceText}>
                                        {meal.prices.map((p: any) => `${p.priceType}: ${p.price}€`).join(' / ')}
                                    </Text>
                                )}

                                {meal.badges?.some((b: any) =>
                                    !hasBadgeVisual(b.name) && !b.name.toLowerCase().includes('h2o')) && (
                                    <Text style={styles.badgeText}>
                                        {meal.badges
                                            .filter((b: any) =>
                                                !hasBadgeVisual(b.name) &&
                                                !b.name.toLowerCase().includes('h2o'))
                                            .map((b: any) => b.name)
                                            .join(', ')}
                                    </Text>
                                )}

                                {meal.additives?.length > 0 && (
                                    <Text style={styles.additives}>
                                        Zusatzstoffe: {meal.additives.map((a: any) => a.text).join(', ')}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                ));
            })()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10
    },
    closedContainer: {
        marginTop: 40,
        marginHorizontal: 20,
        padding: 32,
        backgroundColor: '#fff3cd',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffeaa7',
    },
    closedIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    closedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 8,
        textAlign: 'center',
    },
    closedSubtitle: {
        fontSize: 16,
        color: '#856404',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 22,
    },
    closedHint: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    noMenuContainer: {
        marginTop: 40,
        marginHorizontal: 20,
        padding: 24,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    noMenuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#495057',
        marginBottom: 8,
        textAlign: 'center',
    },
    noMenuSubtitle: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 20,
    },
    noMenuHint: {
        fontSize: 12,
        color: '#67B32D',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    category: {
        marginBottom: 20
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 5,
        color: '#333'
    },
    mealBox: {
        backgroundColor: '#f8f9fa',
        padding: 14,
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9ecef'
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    mealName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        flex: 1,
        marginRight: 12,
        lineHeight: 22,
    },
    // NEU: Styles für Like-Button und Right-Section
    rightSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    likeButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    heartImage: {
        width: 22,
        height: 22,
    },
    loadingText: {
        fontSize: 16,
    },
    priceText: {
        fontSize: 14,
        color: '#495057',
        marginBottom: 6,
        fontWeight: '500'
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
    badgeContainer: {
        width: 28,
        height: 28,
        marginLeft: 4,
        marginBottom: 2,
        backgroundColor: '#fff',
        borderRadius: 6,
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    badgeImage: {
        width: 20,
        height: 20,
    },
    emoji: {
        fontSize: 18,
    },
    badgeText: {
        fontSize: 12,
        color: '#28a745',
        fontWeight: '500',
        marginBottom: 4,
    },
    additives: {
        fontSize: 11,
        color: '#6c757d',
        marginTop: 4,
        fontStyle: 'italic'
    },
    pickerContainer: {
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    picker: {
        height: Platform.OS === 'android' ? 50 : undefined,
        paddingVertical: Platform.OS === 'android' ? 12 : 6,
        color: '#333',
        justifyContent: 'center',
    },
});