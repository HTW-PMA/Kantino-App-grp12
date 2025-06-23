// app/+not-found.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function NotFound() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>404 – Seite nicht gefunden</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { fontSize: 20, fontWeight: 'bold' },
});
