import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
} from 'react-native';

import ChatMessage from '@/components/chatbot/ChatMessage';
import ChatInput from '@/components/chatbot/ChatInput';
import WelcomeMessage from '@/components/chatbot/WelcomeMessage';
import TypingIndicator from '@/components/chatbot/TypingIndicator';

import {
    getName,
    getSelectedMensa,
    getPreferencesWithMigration,
    fetchMenuWithCache,
    fetchCanteensWithCache
} from '@/lib/storage';

interface Message {
    id: string;
    message: string;
    isUser: boolean;
    timestamp: Date;
}

interface UserProfile {
    name: string;
    selectedMensa: string;
    preferences: string[];
}

const ChatbotScreen = forwardRef<any, {}>((props, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Lade Benutzerprofil beim Start
    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const name = await getName();
            const selectedMensa = await getSelectedMensa();
            const preferences = await getPreferencesWithMigration();

            setUserProfile({
                name: name || '',
                selectedMensa: selectedMensa || '',
                preferences: preferences || []
            });

            console.log('Chatbot: User profile loaded:', { name, selectedMensa, preferences });
        } catch (error) {
            console.error('Fehler beim Laden des Benutzerprofils:', error);
        }
    };

    // Funktion zum Zurücksetzen des Chats
    const resetChat = () => {
        setMessages([]);
        setIsTyping(false);
    };

    // Expose leere Funktion via ref - Chat wird NICHT bei Tab-Wechsel zurückgesetzt
    useImperativeHandle(ref, () => ({
        resetChat: () => {
        }
    }));

    const handleSendMessage = async (message: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            message,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);

        // Scroll zum Ende
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Intelligente Bot-Antwort
        await processUserMessage(message);
    };

    const processUserMessage = async (message: string) => {
        setIsTyping(true);

        try {
            // Simuliere Typing-Delay für bessere UX
            await new Promise(resolve => setTimeout(resolve, 1500));

            const response = await getIntelligentResponse(message);

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                message: response,
                isUser: false,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Chatbot error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                message: 'Entschuldigung, es ist ein Fehler aufgetreten. Versuche es bitte erneut.',
                isUser: false,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);

            // Scroll zum Ende
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    const getIntelligentResponse = async (message: string): Promise<string> => {
        const lowerMessage = message.toLowerCase();

        // Profil-Check
        if (!userProfile) {
            return "Lade dein Profil... Versuche es gleich nochmal!";
        }

        // Intelligente Keyword-Erkennung
        if (lowerMessage.includes('heute') || lowerMessage.includes('essen') || lowerMessage.includes('empfehlung')) {
            return await getTodaysRecommendations();
        }

        if (lowerMessage.includes('vegetarisch') || lowerMessage.includes('vegan')) {
            return await getVegetarianOptions();
        }

        if (lowerMessage.includes('mensa') || lowerMessage.includes('lieblings')) {
            return await getFavoriteMensaMenu();
        }

        if (lowerMessage.includes('preis') || lowerMessage.includes('günstig') || lowerMessage.includes('billig')) {
            return await getBudgetOptions();
        }

        if (lowerMessage.includes('hallo') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return `Hallo ${userProfile.name || 'dort'}! Wie kann ich dir heute bei der Essensauswahl helfen?`;
        }

        if (lowerMessage.includes('hilfe') || lowerMessage.includes('help')) {
            return getHelpMessage();
        }

        // Fallback für unbekannte Anfragen
        return "Das verstehe ich nicht ganz. Versuche es mal mit:\n\n• \"Was kann ich heute essen?\"\n• \"Zeige vegetarische Optionen\"\n• \"Was gibt es in meiner Mensa?\"\n• \"Günstige Gerichte\"\n• \"Hilfe\"";
    };

    const getTodaysRecommendations = async (): Promise<string> => {
        try {
            if (!userProfile?.selectedMensa) {
                return "Du hast noch keine Lieblings-Mensa ausgewählt. Gehe zu deinem Profil und wähle eine Mensa aus!";
            }

            console.log('🔍 Debug: Lade Menü für Mensa:', userProfile.selectedMensa);

            const today = new Date().toISOString().split('T')[0];
            console.log('🔍 Debug: Datum:', today);

            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);
            console.log('🔍 Debug: Rohe API-Antwort:', JSON.stringify(menu, null, 2));

            // Prüfe verschiedene Menü-Strukturen
            let meals = [];
            if (Array.isArray(menu)) {
                // Struktur: Array von Tagen
                const dayData = menu.find(day => day.date === today);
                meals = dayData?.meals || [];
                console.log('🔍 Debug: Tagebasierte Struktur, gefunden:', meals.length, 'Gerichte');
            } else if (menu?.meals && Array.isArray(menu.meals)) {
                // Struktur: { meals: [...] }
                meals = menu.meals;
                console.log('🔍 Debug: Direkte meals Struktur:', meals.length, 'Gerichte');
            } else {
                console.log('🔍 Debug: Unbekannte Menü-Struktur:', Object.keys(menu || {}));
            }

            if (meals.length === 0) {
                return `Heute gibt es leider kein Menü in deiner Lieblings-Mensa oder sie ist geschlossen.\n\nDebug Info:\n- Mensa ID: ${userProfile.selectedMensa}\n- Datum: ${today}`;
            }

            // Debug: Zeige Struktur der ersten Mahlzeit
            if (meals[0]) {
                console.log('🔍 Debug: Erste Mahlzeit Struktur:', {
                    name: meals[0].name,
                    badges: meals[0].badges,
                    prices: meals[0].prices,
                    allKeys: Object.keys(meals[0])
                });
            }

            // Filtere nach Vorlieben
            const filteredMeals = filterMealsByPreferences(meals);
            console.log('🔍 Debug: Gefilterte Gerichte:', filteredMeals.length);

            if (filteredMeals.length === 0) {
                return `Heute gibt es leider keine Gerichte, die perfekt zu deinen Vorlieben passen. Schau dir trotzdem das komplette Menü an!\n\nVerfügbare Gerichte: ${meals.length}`;
            }

            let response = `Perfekt für dich heute:\n\n`;
            filteredMeals.slice(0, 3).forEach((meal, index) => {
                const price = meal.prices?.[0]?.price ? `${meal.prices[0].price}€` : 'Preis unbekannt';
                response += `${index + 1}. ${meal.name || 'Unbekanntes Gericht'}\n`;
                response += `   ${price} | ${meal.category || 'Hauptgericht'}\n\n`;
            });

            if (filteredMeals.length > 3) {
                response += `...und ${filteredMeals.length - 3} weitere passende Gerichte!`;
            }

            return response;
        } catch (error) {
            console.error('🔍 Debug: Menü-Fehler:', error);
            return `Kann das heutige Menü nicht laden.\n\nDebug Info:\n- Fehler: ${error.message}\n- Überprüfe deine Internetverbindung und API-Konfiguration.`;
        }
    };

    const getVegetarianOptions = async (): Promise<string> => {
        if (!userProfile?.selectedMensa) {
            return "Wähle zuerst eine Lieblings-Mensa in deinem Profil aus!";
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

            // Extrahiere Mahlzeiten (gleiche Logik wie in getTodaysRecommendations)
            let meals = [];
            if (Array.isArray(menu)) {
                const dayData = menu.find(day => day.date === today);
                meals = dayData?.meals || [];
            } else if (menu?.meals && Array.isArray(menu.meals)) {
                meals = menu.meals;
            }

            const vegetarianMeals = meals.filter((meal: any) =>
                meal.badges?.some((badge: any) =>
                    // Verwende echte Badge-Namen aus der API
                    (badge?.name || '') === 'Vegetarisch' ||
                    (badge?.name || '') === 'Vegan'
                )
            );

            if (vegetarianMeals.length === 0) {
                return "Heute gibt es leider keine explizit als vegetarisch/vegan markierten Gerichte.";
            }

            let response = "Vegetarische & Vegane Optionen:\n\n";
            vegetarianMeals.forEach((meal, index) => {
                const price = meal.prices?.[0]?.price ? `${meal.prices[0].price}€` : '';

                const isVegan = meal.badges?.some((b: any) =>
                    (b?.name || '') === 'Vegan'
                );
                const type = isVegan ? '(vegan)' : '(vegetarisch)';

                response += `${meal.name || 'Unbekanntes Gericht'} ${type}\n`;
                if (price) response += `   ${price}\n`;
                response += '\n';
            });

            return response;
        } catch (error) {
            console.error('🔍 Debug: Vegetarische Optionen Fehler:', error);
            return "Kann vegetarische Optionen nicht laden.";
        }
    };

    const getFavoriteMensaMenu = async (): Promise<string> => {
        if (!userProfile?.selectedMensa) {
            return "Du hast noch keine Lieblings-Mensa ausgewählt!";
        }

        try {
            const canteens = await fetchCanteensWithCache();
            const mensa = canteens.find((c: any) => c.id === userProfile.selectedMensa);
            const mensaName = mensa?.name || 'Deine Lieblings-Mensa';

            return `${mensaName}\n\nFrage mich nach dem heutigen Menü oder spezifischen Gerichten!`;
        } catch (error) {
            return "Kann Mensa-Informationen nicht laden.";
        }
    };

    const getBudgetOptions = async (): Promise<string> => {
        if (!userProfile?.selectedMensa) {
            return "Wähle zuerst eine Mensa aus!";
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

            // Extrahiere Mahlzeiten
            let meals = [];
            if (Array.isArray(menu)) {
                const dayData = menu.find(day => day.date === today);
                meals = dayData?.meals || [];
            } else if (menu?.meals && Array.isArray(menu.meals)) {
                meals = menu.meals;
            }

            const budgetMeals = meals
                .filter((meal: any) => meal.prices?.[0]?.price && meal.prices[0].price <= 4.0)
                .sort((a: any, b: any) => a.prices[0].price - b.prices[0].price);

            if (budgetMeals.length === 0) {
                return "Heute gibt es leider keine besonders günstigen Optionen unter 4€.";
            }

            let response = "Günstige Optionen (unter 4€):\n\n";
            budgetMeals.slice(0, 5).forEach((meal, index) => {
                response += `${index + 1}. ${meal.name || 'Unbekanntes Gericht'} - ${meal.prices[0].price}€\n`;
            });

            return response;
        } catch (error) {
            return "Kann Preisinformationen nicht laden.";
        }
    };

    const getHelpMessage = (): string => {
        return `Ich kann dir bei folgenden Dingen helfen:\n\n"Was kann ich heute essen?"\n   → Personalisierte Empfehlungen\n\n"Vegetarische Optionen"\n   → Veggie & vegane Gerichte\n\n"Günstige Gerichte"\n   → Budget-Optionen unter 4€\n\n"Meine Mensa"\n   → Info über deine Lieblings-Mensa\n\nStelle einfach deine Frage!`;
    };

    const filterMealsByPreferences = (meals: any[]): any[] => {
        console.log('🔍 Filtere', meals.length, 'Gerichte nach Präferenzen');
        console.log('👤 User Präferenzen:', userProfile?.preferences);

        return meals.filter((meal, index) => {
            // Sammle Badge-Namen für dieses Gericht
            const mealBadgeNames = meal.badges
                ?.map((b: any) => b?.name || '')
                ?.filter(Boolean) || [];

            // Debug für erste paar Gerichte
            if (index < 3) {
                console.log(`🔍 Gericht ${index + 1}:`, {
                    name: meal.name?.substring(0, 30) + '...',
                    badges: mealBadgeNames
                });
            }

            // Wenn keine Präferenzen -> zeige alles
            if (!userProfile?.preferences?.length) {
                return true;
            }

            // Exaktes Badge-Matching mit echten API-Badge-Namen
            const hasMatchingPreference = userProfile.preferences.some(preference => {
                const prefLower = preference.toLowerCase();

                const badgeMatches = mealBadgeNames.filter(badgeName => {
                    // Verwende echte Badge-Namen aus der API (case-sensitive!)
                    switch (prefLower) {
                        case 'vegetarisch':
                            return badgeName === 'Vegetarisch';

                        case 'vegan':
                            return badgeName === 'Vegan';

                        case 'klimaessen':
                            return badgeName === 'Klimaessen';

                        case 'fairtrade':
                            return badgeName === 'Fairtrade';

                        case 'nachhaltig':
                            return badgeName === 'Nachhaltige Landwirtschaft';

                        case 'fisch_nachhaltig':
                            return badgeName === 'Nachhaltige Fischerei';

                        default:
                            console.warn('Unbekannte Präferenz:', preference);
                            return false;
                    }
                });

                if (badgeMatches.length > 0) {
                    console.log(`✅ Match für "${preference}":`, meal.name, '→', badgeMatches);
                    return true;
                }

                return false;
            });

            return hasMatchingPreference;
        });
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