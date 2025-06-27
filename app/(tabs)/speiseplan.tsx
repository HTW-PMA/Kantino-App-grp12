import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { fetchCanteens, fetchMenu } from '@/lib/api/mensaService';
import { getSelectedMensa } from '@/lib/storage';

const formatDate = (date: Date) => date.toISOString().split('T')[0];
const today = formatDate(new Date());

// Generiere die nächsten 7 Tage mit Wochentagen und Status
const getNext7DaysWithStatus = () => {
    const dates = [];
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

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

    let prefix = '';
    if (dayIndex === 0) prefix = 'Heute, ';

    const baseLabel = `${prefix}${weekday} (${date})`;

    if (!isOpen) {
        return `${baseLabel} - Geschlossen`;
    }

    return baseLabel;
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

export default function SpeiseplanScreen() {
    const { mensaId } = useLocalSearchParams();
    const [canteens, setCanteens] = useState<any[]>([]);
    const [selectedCanteen, setSelectedCanteen] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(today);
    const [menu, setMenu] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Generiere die nächsten 7 Tage mit Status
    const availableDates = getNext7DaysWithStatus();

    // Finde aktuell ausgewähltes Datum-Info
    const selectedDateInfo = availableDates.find(d => d.date === selectedDate);
    const isMensaClosed = selectedDateInfo ? !selectedDateInfo.isOpen : false;

    // Laden der Mensen und Vorauswahl
    useEffect(() => {
        fetchCanteens()
            .then((data) => {
                setCanteens(data);
                const fallbackId = data[0]?.id || data[0]?._id || '';
                setSelectedCanteen((mensaId as string) || fallbackId);
            })
            .catch((e) => console.error('❌ Fehler beim Laden der Mensen:', e));
    }, [mensaId]);

    // Laden der gespeicherten Mensa bei Tab-Fokus
    useFocusEffect(
        React.useCallback(() => {
            const loadSelectedMensa = async () => {
                try {
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
        }, [canteens])
    );

    // Laden des Menüs (nur wenn Mensa offen ist)
    useEffect(() => {
        if (!selectedCanteen || !selectedDate) return;

        // Wenn Mensa geschlossen ist, kein API-Call
        if (isMensaClosed) {
            setMenu([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        fetchMenu(selectedCanteen, selectedDate)
            .then((data) => {
                let meals = [];

                if (Array.isArray(data)) {
                    const dayData = data.find(day => day.date === selectedDate);
                    meals = dayData?.meals || [];
                } else {
                    meals = data?.meals || [];
                }

                setMenu(meals);
            })
            .catch((e) => {
                console.error('❌ Fehler beim Laden des Menüs:', e);
                setMenu([]);
            })
            .finally(() => setLoading(false));
    }, [selectedCanteen, selectedDate, isMensaClosed]);

    const groupedMeals = menu.reduce((groups: any, meal: any) => {
        const cat = meal.category || 'Sonstiges';
        groups[cat] = [...(groups[cat] || []), meal];
        return groups;
    }, {});

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
                    <Text style={styles.closedIcon}>🔒</Text>
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

            {/* Menü anzeigen */}
            {!isMensaClosed && Object.entries(groupedMeals).map(([category, meals]) => (
                <View key={category} style={styles.category}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    {meals.map((meal: any, i: number) => (
                        <View key={`${meal.id || meal.name}-${i}`} style={styles.mealBox}>
                            <View style={styles.titleRow}>
                                <Text style={styles.mealName}>{meal.name}</Text>
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
            ))}
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