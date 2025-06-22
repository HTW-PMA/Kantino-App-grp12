import { View, Text, StyleSheet } from 'react-native';

export default function SavedScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Saved Items</Text>
            <Text style={styles.description}>
                This is where your saved content will appear.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});
