import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { fetchCanteens, fetchMenu } from '@/lib/api/mensaService';
import { format } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');

export default function SpeiseplanScreen() {
    const [canteens, setCanteens] = useState<any[]>([]);
    const [selectedCanteen, setSelectedCanteen] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(today);
    const [menu, setMenu] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // ✅ Mensen laden
    useEffect(() => {
        async function loadCanteens() {
            try {
                const data = await fetchCanteens();
                console.log('🌐 Alle Mensen:', data); // Optional zur Kontrolle
                setCanteens(data);
                setSelectedCanteen(data[0]?._id || '');
            } catch (e) {
                console.error('Fehler beim Laden der Mensen:', e);
            }
        }
        loadCanteens();
    }, []);

    // ✅ Menü laden
    useEffect(() => {
        async function loadMenu() {
            if (!selectedCanteen || !selectedDate) return;
            setLoading(true);
            try {
                console.log('📦 Lade Menü für:', selectedCanteen, selectedDate);
                const data = await fetchMenu(selectedCanteen, selectedDate);
                setMenu(data?.meals || []);
            } catch (error) {
                console.error('Fehler beim Laden des Menüs:', error);
                setMenu([]);
            } finally {
                setLoading(false);
            }
        }
        loadMenu();
    }, [selectedCanteen, selectedDate]);

    // ✅ Gruppierung nach Kategorie
    const groupedMeals = menu.reduce((groups: any, meal: any) => {
        const cat = meal.category || 'Sonstiges';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(meal);
        return groups;
    }, {});

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Speiseplan</Text>

            {/* 📍 Aktuelle Auswahl anzeigen */}
            <Text style={styles.debug}>Mensa-ID: {selectedCanteen}</Text>
            <Text style={styles.debug}>Datum: {selectedDate}</Text>

            {/* 🔽 Mensa Dropdown */}
            <Picker selectedValue={selectedCanteen} onValueChange={setSelectedCanteen}>
                {canteens.map((c) => (
                    <Picker.Item key={c._id} label={c.name} value={c._id} />
                ))}
            </Picker>

            {/* 📅 Datum Dropdown */}
            <View style={{ marginVertical: 12 }}>
                <Picker selectedValue={selectedDate} onValueChange={setSelectedDate}>
                    {[0, 1, 2].map((offset) => {
                        const date = format(new Date(Date.now() + offset * 86400000), 'yyyy-MM-dd');
                        return <Picker.Item key={date} label={date} value={date} />;
                    })}
                </Picker>
            </View>

            {/* ⏳ Ladeanzeige */}
            {loading && <ActivityIndicator size="large" color="#67B32D" />}

            {/* 🍽️ Anzeige der Speisen */}
            {Object.entries(groupedMeals).length === 0 && !loading ? (
                <Text style={styles.info}>Kein Menü verfügbar für diese Auswahl.</Text>
            ) : (
                Object.entries(groupedMeals).map(([category, meals]) => (
                    <View key={category} style={styles.category}>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        {meals.map((meal: any, i: number) => (
                            <View key={`${meal._id || meal.name}-${i}`} style={styles.mealBox}>
                                <Text style={styles.mealName}>{meal.name}</Text>
                                <Text style={styles.priceText}>
                                    {meal.prices?.map((p: any) => `${p.priceType}: ${p.price}€`).join(' / ')}
                                </Text>
                                {meal.badges?.length > 0 && (
                                    <Text style={styles.badges}>
                                        Badges: {meal.badges.map((b: any) => b.name).join(', ')}
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
    container: { flex: 1, backgroundColor: '#fff', padding: 10 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    debug: { fontSize: 12, color: 'gray' },
    info: { marginTop: 20, fontSize: 16, color: 'gray' },
    category: { marginBottom: 20 },
    categoryTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 5 },
    mealBox: {
        backgroundColor: '#f5f5f5',
        padding: 10,
        marginTop: 5,
        borderRadius: 8,
    },
    mealName: { fontSize: 16, fontWeight: '600' },
    priceText: { fontSize: 14, color: '#333' },
    badges: { fontSize: 13, color: 'green' },
    additives: { fontSize: 12, color: '#999' },
});
