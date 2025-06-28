// components/MensaStats.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchCanteensWithCache, fetchMenuWithCache } from '@/lib/storage';

export default function MensaStats() {
    const [loading, setLoading] = useState(true);
    const [mensaCount, setMensaCount] = useState(0);
    const [mealCount, setMealCount] = useState(0);
    const [openMensaCount, setOpenMensaCount] = useState(0);
    const [isWeekend, setIsWeekend] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);

            // Check if weekend
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Sonntag, 6 = Samstag
            const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
            setIsWeekend(isWeekendDay);

            // Load all canteens
            const canteens = await fetchCanteensWithCache();

            // Filter wie im Profil - nur echte Mensen, keine Backshops/Spätis
            const selectableMensas = canteens.filter((m: any) => {
                const name = m.name?.toLowerCase();
                return name &&
                    !name.includes('backshop') &&
                    !name.includes('späti') &&
                    !name.includes('café') &&
                    !name.includes('bistro');
            });

            setMensaCount(selectableMensas.length);

            if (isWeekendDay) {
                // Am Wochenende: Zeige nur Gesamt-Zahlen, keine API-Calls
                setOpenMensaCount(0);
                setMealCount(0);
            } else {
                // An Werktagen: Lade nur eine Stichprobe (nicht alle!)
                await loadSampleStats(selectableMensas);
            }

        } catch (error) {
            console.error('Fehler beim Laden der Stats:', error);

            setMensaCount(25);
            setMealCount(isWeekend ? 0 : 150);
            setOpenMensaCount(isWeekend ? 0 : 20);
        } finally {
            setLoading(false);
        }
    };

    const loadSampleStats = async (canteens: any[]) => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Lade nur eine Stichprobe von 8-10 Mensen
            const sampleSize = Math.min(10, canteens.length);
            const sampleMensas = canteens.slice(0, sampleSize);

            let totalMeals = 0;
            let openMensas = 0;

            console.log(`Lade Stichprobe von ${sampleSize} Mensen für Stats...`);

            // Sequenziell laden (nicht parallel) um Rate Limits zu vermeiden
            for (const canteen of sampleMensas) {
                try {
                    const mensaId = canteen.id || canteen._id;

                    // Kleine Pause zwischen Requests
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const menuData = await fetchMenuWithCache(mensaId, today);

                    let meals = [];
                    if (Array.isArray(menuData)) {
                        const dayData = menuData.find(day => day.date === today);
                        meals = dayData?.meals || [];
                    } else {
                        meals = menuData?.meals || [];
                    }

                    // Filter nur echte Hauptgerichte (keine Beilagen, Getränke, etc.)
                    const mainMeals = meals.filter((meal: any) => {
                        const category = meal.category?.toLowerCase() || '';
                        const name = meal.name?.toLowerCase() || '';

                        // Beilagen, Getränke, Snacks etc. raus
                        return !category.includes('beilage') &&
                            !category.includes('getränk') &&
                            !category.includes('snack') &&
                            !category.includes('nachtisch') &&
                            !category.includes('dessert') &&
                            !category.includes('soße') &&
                            !category.includes('sauce') &&
                            !name.includes('wasser') &&
                            !name.includes('kaffee') &&
                            !name.includes('tee') &&
                            !name.includes('saft') &&
                            !name.includes('cola') &&
                            !name.includes('apfel') &&
                            !name.includes('orange') &&
                            category !== 'getränke' &&
                            category !== 'beilagen';
                    });

                    if (mainMeals.length > 0) {
                        openMensas++;
                        totalMeals += mainMeals.length;
                    }

                } catch (error) {
                    console.log(`Stats: Fehler bei Mensa ${canteen.name}:`, error);
                    // Ignoriert einzelne Fehler, zähle aber weiter
                }
            }

            // Hochrechnung basierend auf Stichprobe
            const totalMensas = canteens.length;
            const samplingRatio = totalMensas / sampleSize;

            const estimatedOpenMensas = Math.round(openMensas * samplingRatio);
            const estimatedTotalMeals = Math.round(totalMeals * samplingRatio);

            // Zeige immer als "X+" um zu zeigen, dass es eine Schätzung ist
            setOpenMensaCount(Math.max(estimatedOpenMensas, openMensas));
            setMealCount(Math.max(estimatedTotalMeals, totalMeals));

            console.log(`Stats: ${openMensas}/${sampleSize} Stichprobe → ${estimatedOpenMensas}+/${totalMensas} geschätzt`);

        } catch (error) {
            console.error('Fehler beim Laden der Stichproben-Stats:', error);
            // Fallback zu realistischen Schätzwerten
            setOpenMensaCount(Math.round(canteens.length * 0.8));
            setMealCount(Math.round(canteens.length * 6));
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#67B32D" />
                <Text style={styles.loadingText}>Lade aktuelle Zahlen...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.statsRow}>
                {/* Mensen Gesamt */}
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{mensaCount}</Text>
                    <Text style={styles.statLabel}>Mensen in Berlin</Text>
                </View>

                {/* Conditional Stats basierend auf Wochentag */}
                {isWeekend ? (
                    <>
                        {/* Am Wochenende: Öffnungszeiten */}
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>Mo-Fr</Text>
                            <Text style={styles.statLabel}>Öffnungszeiten</Text>
                        </View>

                        {/* Angebote insgesamt */}
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>150+</Text>
                            <Text style={styles.statLabel}>Angebote täglich</Text>
                        </View>
                    </>
                ) : (
                    <>
                        {/* Heute geöffnet */}
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{openMensaCount}+</Text>
                            <Text style={styles.statLabel}>Heute geöffnet</Text>
                        </View>

                        {/* Angebote heute */}
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{mealCount}+</Text>
                            <Text style={styles.statLabel}>Angebote heute</Text>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        width: '100%',
        maxWidth: 350,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginBottom: 20,
        width: '100%',
        maxWidth: 350,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '800',
        color: '#67B32D',
        marginBottom: 2,
        lineHeight: 28,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 16,
    },
});