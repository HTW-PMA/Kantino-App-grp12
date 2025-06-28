// components/WeatherFoodRecommendation.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
    getBerlinWeather,
    getFoodRecommendation,
    getWeatherEmoji,
    WeatherData,
    FoodRecommendation
} from '@/lib/api/weatherService';
import { getSelectedMensa } from '@/lib/storage';

interface WeatherFoodRecommendationProps {
    onPress?: () => void;
}

export default function WeatherFoodRecommendation({ onPress }: WeatherFoodRecommendationProps) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [recommendation, setRecommendation] = useState<FoodRecommendation | null>(null);
    const [loading, setLoading] = useState(true);
    const [userMensa, setUserMensa] = useState<string>('');
    const router = useRouter();

    // Lade Wetter und Empfehlung nur einmal beim Mount
    useEffect(() => {
        loadWeatherAndRecommendation();
    }, []);

    // Lade Nutzer-Mensa bei jedem Focus (wenn von Profil zurückkommt)
    useFocusEffect(
        React.useCallback(() => {
            loadUserMensa();
        }, [])
    );

    const loadWeatherAndRecommendation = async () => {
        try {
            setLoading(true);
            const weatherData = await getBerlinWeather();
            const foodRec = getFoodRecommendation(weatherData);

            setWeather(weatherData);
            setRecommendation(foodRec);
        } catch (error) {
            console.error('Fehler beim Laden der Wetterempfehlung:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserMensa = async () => {
        try {
            const mensaId = await getSelectedMensa();
            setUserMensa(mensaId || '');
            console.log('User Mensa geladen:', mensaId);
        } catch (error) {
            console.error('Fehler beim Laden der Nutzer-Mensa:', error);
        }
    };

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            // Navigiere zum Speiseplan mit der Nutzer-Mensa
            if (userMensa) {
                router.push({
                    pathname: '/speiseplan',
                    params: { mensaId: userMensa }
                });
            } else {
                router.push('/speiseplan');
            }
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#662a60" />
                <Text style={styles.loadingText}>Lade Wetterempfehlung...</Text>
            </View>
        );
    }

    if (!weather || !recommendation) {
        return null;
    }

    return (
        <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.9}>
            {/* Weather Info */}
            <View style={styles.weatherRow}>
                <Text style={styles.weatherEmoji}>
                    {getWeatherEmoji(weather.condition, weather.temperature)}
                </Text>
                <View style={styles.weatherText}>
                    <Text style={styles.temperature}>{weather.temperature}°C</Text>
                    <Text style={styles.weatherDescription}>{weather.description}</Text>
                </View>
                <View style={styles.locationBadge}>
                    <Text style={styles.locationText}>Berlin</Text>
                </View>
            </View>

            {/* Food Recommendation */}
            <View style={styles.recommendationRow}>
                <Text style={styles.recommendationEmoji}>{recommendation.emoji}</Text>
                <View style={styles.recommendationText}>
                    <Text style={styles.recommendationType}>{recommendation.type}</Text>
                    <Text style={styles.recommendationReason}>{recommendation.reason}</Text>
                </View>
            </View>

            {/* Call to Action */}
            <View style={styles.ctaRow}>
                <Text style={styles.ctaText}>
                    {userMensa ? 'Passende Gerichte für deine Mensa' : 'Passende Gerichte entdecken'}
                </Text>
                <View style={styles.arrowContainer}>
                    <Text style={styles.arrow}>→</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#662a60',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        width: '100%',
        maxWidth: 350,
        shadowColor: '#662a60',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8F4F7',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        width: '100%',
        maxWidth: 350,
        borderWidth: 1,
        borderColor: '#E8D8E5',
    },
    loadingText: {
        marginLeft: 12,
        fontSize: 14,
        color: '#662a60',
        fontWeight: '500',
    },
    weatherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    weatherEmoji: {
        fontSize: 32,
        marginRight: 12,
    },
    weatherText: {
        flex: 1,
    },
    temperature: {
        fontSize: 22,
        fontWeight: '800',
        color: 'white',
        lineHeight: 26,
    },
    weatherDescription: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    locationBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    locationText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
    },
    recommendationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    recommendationEmoji: {
        fontSize: 18,
        marginRight: 10,
        marginTop: 2,
    },
    recommendationText: {
        flex: 1,
    },
    recommendationType: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
    },
    recommendationReason: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 18,
    },
    ctaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    ctaText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    arrowContainer: {
        width: 20,
        height: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    arrow: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});