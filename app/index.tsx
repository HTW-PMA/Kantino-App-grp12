import { Link } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            {/* Speiseplan Button */}
            <Link href="/speiseplan" asChild>
                <TouchableOpacity style={styles.mainButton}>
                    <View style={styles.iconContainer}>
                        <Image
                            source={require('@/assets/images/fork-and-knife.png')}
                            style={styles.iconImage}
                        />
                    </View>
                    <Text style={styles.buttonText}>Speiseplan</Text>
                </TouchableOpacity>
            </Link>

            {/* Mensen Button */}
            <Link href="/mensen" asChild>
                <TouchableOpacity style={styles.mainButton}>
                    <View style={styles.iconContainer}>
                        <Image
                            source={require('@/assets/images/cafeteria.png')}
                            style={styles.iconImage}
                        />
                    </View>
                    <Text style={styles.buttonText}>Mensen</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E7E7E7',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 40,
    },
    mainButton: {
        backgroundColor: '#67B32D',
        width: '100%',
        maxWidth: 250,
        paddingVertical: 20,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconContainer: {
        marginBottom: 10,
    },
    iconImage: {
        width: 50,
        height: 50,
    },
    buttonText: {
        color: 'white',
        fontSize: 30,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // iOS nutzt System, Android Roboto
    },
});