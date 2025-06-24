import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    Alert,
} from 'react-native';

import ChatMessage from '@/components/chatbot/ChatMessage';
import ChatInput from '@/components/chatbot/ChatInput';
import WelcomeMessage from '@/components/chatbot/WelcomeMessage';
import TypingIndicator from '@/components/chatbot/TypingIndicator';

interface Message {
    id: string;
    message: string;
    isUser: boolean;
    timestamp: Date;
}

const ChatbotScreen = forwardRef<any, {}>((props, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Funktion zum Zurücksetzen des Chats
    const resetChat = () => {
        setMessages([]);
        setIsTyping(false);
    };

    // Expose resetChat function via ref
    useImperativeHandle(ref, () => ({
        resetChat
    }));


    const handleSendMessage = (message: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            message,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);

        // Simuliere Bot-Antwort (später durch echte API ersetzen)
        simulateBotResponse(message);

        // Scroll zum Ende
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const simulateBotResponse = (userMessage: string) => {
        setIsTyping(true);

        // Simuliere Typing-Delay
        setTimeout(() => {
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                message: getBotResponse(userMessage),
                isUser: false,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);

            // Scroll zum Ende
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }, 1500);
    };

    const getBotResponse = (userMessage: string): string => {
        return '🤖 Diese Funktion wird bald freigeschaltet! Der Chat-Assistant ist noch in Entwicklung und wird in einem kommenden Update verfügbar sein.';
    };

    const handleClearChat = () => {
        Alert.alert(
            'Chat löschen',
            'Möchtest du wirklich alle Nachrichten löschen?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Löschen',
                    style: 'destructive',
                    onPress: () => setMessages([])
                }
            ]
        );
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <ChatMessage
            message={item.message}
            isUser={item.isUser}
            timestamp={item.timestamp}
        />
    );

    const renderFooter = () => {
        if (isTyping) {
            return <TypingIndicator />;
        }
        return null;
    };

    return (
        <View style={styles.container}>
            {messages.length === 0 ? (
                <WelcomeMessage />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    style={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={renderFooter}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isTyping}
            />
        </View>
    );
});

export default ChatbotScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    messagesList: {
        flex: 1,
        paddingVertical: 8,
    },
});