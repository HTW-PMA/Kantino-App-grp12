import React, { useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import ChatbotScreen from '@/components/chatbot/ChatbotScreen';

export default function ChatbotTab() {
    const chatbotRef = useRef<any>(null);

    useFocusEffect(
        React.useCallback(() => {
            return () => {
                if (chatbotRef.current && chatbotRef.current.resetChat) {
                    chatbotRef.current.resetChat();
                }
            };
        }, [])
    );

    return <ChatbotScreen ref={chatbotRef} />;
}