import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatMessageProps {
    message: string;
    isUser: boolean;
    timestamp?: Date;
}

export default function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <View style={[
            styles.messageContainer,
            isUser ? styles.userMessageContainer : styles.botMessageContainer
        ]}>
            <View style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.botBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    isUser ? styles.userText : styles.botText
                ]}>
                    {message}
                </Text>

                {timestamp && (
                    <Text style={[
                        styles.timestamp,
                        isUser ? styles.userTimestamp : styles.botTimestamp
                    ]}>
                        {formatTime(timestamp)}
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    messageContainer: {
        marginVertical: 4,
        marginHorizontal: 16,
    },
    userMessageContainer: {
        alignItems: 'flex-end',
    },
    botMessageContainer: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
    },
    userBubble: {
        backgroundColor: '#67B32D',
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: '#F0F0F0',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    userText: {
        color: '#fff',
    },
    botText: {
        color: '#333',
    },
    timestamp: {
        fontSize: 12,
        marginTop: 4,
        opacity: 0.7,
    },
    userTimestamp: {
        color: '#fff',
        textAlign: 'right',
    },
    botTimestamp: {
        color: '#666',
        textAlign: 'left',
    },
});