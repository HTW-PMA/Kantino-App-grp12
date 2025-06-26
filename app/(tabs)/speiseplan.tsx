import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { fetchCanteens, fetchMenu } from '@/lib/api/mensaService';

// Format für API-kompatibles Datum
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const today = formatDate(new Date());

// Badge: Icon- oder Emoji-Zuordnung
const getBadgeVisual = (badgeName: string): any => {
    const name = badgeName.toLowerCase();
    if (name.includes('h2o')) return null;

    try {
        if (name.includes('vegan')) {
            return require('@/assets/images/speiseplan/vegan.png');
        }
        if (name.includes('bio') || name.includes('vegetarisch')) {
            return require('@/assets/images/speiseplan/bio.png');
        }
        if (name.includes('co2_bewertung_a')) return require('@/assets/images/speiseplan/co2_green.png');
        if (name.includes('co2_bewertung_b')) return require('@/assets/images/speiseplan/co2_orange.png');
        if (name.includes('co2_bewertung_c')) return require('@/assets/images/speiseplan/co2_red.png');

        // Emojis für Ampelpunkte
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
    const [canteens, setCanteens] = useState<any[]>([]);
    const [selectedCanteen, setSelectedCanteen] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(today);
    const [menu, setMenu] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        fetchCanteens()
            .then((data) => {
                setCanteens(data);
                const firstId = data[0]?.id || data[0]?._id || '';
                setSelectedCanteen(firstId);
            })
            .catch((e) => console.error('❌ Fehler beim Laden der Mensen:', e));
    }, []);

    useEffect(() => {
        if (!selectedCanteen || !selectedDate) return;
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
    }, [selectedCanteen, selectedDate]);

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
                    {[0, 1, 2].map((offset) => {
                        const date = formatDate(new Date(Date.now() + offset * 86400000));
                        return <Picker.Item key={date} label={date} value={date} />;
                    })}
                </Picker>
            </View>

            {loading && <ActivityIndicator size="large" color="#67B32D" />}

            {Object.entries(groupedMeals).length === 0 && !loading ? (
                <Text style={styles.info}>Kein Menü verfügbar für diese Auswahl.</Text>
            ) : (
                Object.entries(groupedMeals).map(([category, meals]) => (
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
                                    !hasBadgeVisual(b.name) &&
                                    !b.name.toLowerCase().includes('h2o')) && (
                                    <Text style={styles.badgeText}>
                                        {meal.badges
                                            .filter((b: any) =>
                                                !hasBadgeVisual(b.name) &&
                                                !b.name.toLowerCase().includes('h2o'))
                                            .map((b: any) => b.name)
                                            .join(', ')
                                        }
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
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10
    },
    info: {
        marginTop: 20,
        fontSize: 16,
        color: 'gray'
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
