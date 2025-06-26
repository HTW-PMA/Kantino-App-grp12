import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import CustomHeader from '@/components/CustomHeader';

const favoriteMeals = [
    {
        id: '1',
        name: 'Gemüseeintopf',
        mensaId: 'ash-berlin',
        image: require('@/assets/images/mensen/gemuesesuppe.jpg'),
        isVegetarian: true,
        hasCO2Info: true,
    },
    {
        id: '2',
        name: 'Nudeln mit Tomatensoße',
        mensaId: 'ash-berlin',
        image: require('@/assets/images/mensen/kartoffeln.jpg'),
        isVegetarian: true,
        hasCO2Info: true,
    },
    {
        id: '3',
        name: 'Kartoffelauflauf',
        mensaId: 'htw-treskowallee',
        image: require('@/assets/images/mensen/nudeln.jpg'),
        isVegetarian: false,
        hasCO2Info: true,
    },
];

export default function LieblingsspeisenScreen() {
    const { mensaId } = useLocalSearchParams();
    const [selectedMensa, setSelectedMensa] = useState(mensaId as string);

    const filteredMeals = favoriteMeals.filter(
        (meal) => meal.mensaId === selectedMensa
    );

    return (
        <ScrollView style={styles.container}>
            <CustomHeader title="Lieblings-Speisen" showBack />

            <View style={styles.dropdownContainer}>
                <Picker
                    selectedValue={selectedMensa}
                    onValueChange={(itemValue) => setSelectedMensa(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Mensa ASH Berlin" value="ash-berlin" />
                    <Picker.Item label="Mensa HTW Treskowallee" value="htw-treskowallee" />
                </Picker>
            </View>

            <Text style={styles.sectionTitle}>Gespeicherte Gerichte</Text>
            <Text style={styles.infoText}>
                Du hast <Text style={styles.bold}>{filteredMeals.length} Gerichte</Text> gespeichert.
            </Text>

            <View style={styles.grid}>
                {filteredMeals.map((meal) => (
                    <View key={meal.id} style={styles.card}>
                        <Image source={meal.image} style={styles.image} />
                        <Text style={styles.name}>{meal.name}</Text>

                        <View style={styles.iconRow}>
                            {meal.hasCO2Info && <Text style={styles.icon}>🌍 CO₂</Text>}
                            {meal.isVegetarian && <Text style={styles.icon}>🌱 Veggie</Text>}
                            <Text style={styles.icon}>💚</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    dropdownContainer: {
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        margin: 16,
        paddingHorizontal: 10,
    },
    picker: {
        height: 44,
        width: '100%',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 16,
        marginTop: 8,
    },
    infoText: {
        fontSize: 14,
        marginBottom: 10,
        marginHorizontal: 16,
    },
    bold: {
        fontWeight: 'bold',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    card: {
        width: '48%',
        marginBottom: 20,
    },
    image: {
        width: '100%',
        height: 120,
        borderRadius: 10,
    },
    name: {
        textAlign: 'center',
        marginTop: 6,
        fontWeight: '600',
    },
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 4,
        gap: 4,
    },
    icon: {
        fontSize: 12,
        marginHorizontal: 2,
    },
});
