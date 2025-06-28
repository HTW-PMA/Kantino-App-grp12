import { Link } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import WeatherFoodRecommendation from '@/components/WeatherFoodRecommendation';
import MensaStats from '@/components/MensaStats';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            {/* Wetter-Empfehlung */}
            <WeatherFoodRecommendation />

            {/* Live-Stats */}
            <MensaStats />

            {/* Speiseplan Button */}
            <Link href="/speiseplan" asChild>
                <TouchableOpacity style={styles.modernButton} activeOpacity={0.9}>
                    <View style={styles.buttonContent}>
                        <View style={styles.iconContainer}>
                            <Image
                                source={require('@/assets/images/fork-and-knife.png')}
                                style={styles.iconImage}
                            />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.buttonTitle}>Speiseplan</Text>
                            <Text style={styles.buttonSubtitle}>Schaue was heute auf dem Menü steht</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Link>

            {/* Mensen Button */}
            <Link href="/mensen" asChild>
                <TouchableOpacity style={styles.modernButton} activeOpacity={0.9}>
                    <View style={styles.buttonContent}>
                        <View style={styles.iconContainer}>
                            <Image
                                source={require('@/assets/images/cafeteria.png')}
                                style={styles.iconImage}
                            />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.buttonTitle}>Mensen</Text>
                            <Text style={styles.buttonSubtitle}>Entdecke alle Berliner Mensen</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        gap: 16,
    },
    modernButton: {
        backgroundColor: '#67B32D',
        width: '100%',
        maxWidth: 350,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        width: 64,
        height: 64,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    iconImage: {
        width: 32,
        height: 32,
        tintColor: 'white',
    },
    textContainer: {
        flex: 1,
    },
    buttonTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    buttonSubtitle: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
    },
});