import { View, Text, StyleSheet } from 'react-native';

export default function ChatbotScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>🤖 Hallo! Ich bin der Chatbot</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
    },
});
