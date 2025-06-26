import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import CustomHeader from '@/components/CustomHeader';

const favoriteMeals = [
    {
        id: '1',
        name: 'Gemüseeintopf',
        image: require('../assets/images/mensen/gemuesesuppe.jpg'),
    },
    {
        id: '2',
        name: 'Nudeln mit Tomatensoße',
        image: require('../assets/images/mensen/nudeln.jpg'),
    },
    {
        id: '3',
        name: 'Kartoffelauflauf',
        image: require('../assets/images/mensen/kartoffeln.jpg'),
    },
];

export default function FavoriteMealsScreen() {
    return (
        <View style={styles.container}>
            <CustomHeader title="Lieblings-Speisen" />
            <Text style={styles.title}>Gespeicherte Gerichte</Text>
            <Text style={styles.subTitle}>Du hast {favoriteMeals.length} Gerichte gespeichert.</Text>

            <ScrollView contentContainerStyle={styles.grid}>
                {favoriteMeals.map((meal) => (
                    <View key={meal.id} style={styles.card}>
                        <Image source={meal.image} style={styles.image} />
                        <Text style={styles.mealName}>{meal.name}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    title: { fontSize: 18, fontWeight: 'bold', margin: 16 },
    subTitle: { marginHorizontal: 16, marginBottom: 10 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
        gap: 10,
    },
    card: {
        width: '40%',
        marginVertical: 10,
        alignItems: 'center',
    },
    image: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 10,
    },
    mealName: {
        marginTop: 5,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
