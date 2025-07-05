import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    Text,
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
    fetchCanteensWithCache,
    fetchBadgesWithCache,
    fetchAdditivesWithCache
} from '@/lib/storage';

import { GeminiService } from '@/services/GeminiService';
import NetInfo from '@react-native-community/netinfo';

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
    const [additivesCache, setAdditivesCache] = useState<any[] | null>(null);
    const [geminiService] = useState(() => new GeminiService());
    const [isOnline, setIsOnline] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    // Lade Benutzerprofil beim Start
    useEffect(() => {
        loadUserProfile();
    }, []);

    // Internet-Status überwachen
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected === true);
            console.log('Internet Status:', state.isConnected ? 'Online' : 'Offline');
        });

        return () => unsubscribe();
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
        setIsTyping(true);

        try {
            const response = await getIntelligentResponse(message);

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                message: response,
                isUser: false,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Fehler bei der Bot-Antwort:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                message: 'Entschuldigung, da ist etwas schiefgelaufen. Versuche es nochmal!',
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

        if (!userProfile) {
            return "Lade dein Profil... Versuche es gleich nochmal!";
        }

        // Definiere lokale Antwort-Funktionen
        const getLocalResponse = async (): Promise<string> => {
            // ZUTATEN-SUCHE (immer lokal - präziser als AI)
            const ingredientSearch = extractIngredientFromMessage(lowerMessage);
            if (ingredientSearch) {
                return await searchMealsByIngredient(ingredientSearch);
            }

            // ALLERGENE - unterscheide MIT vs OHNE
            if (lowerMessage.includes('allergen') || lowerMessage.includes('allergisch') ||
                lowerMessage.includes('glutenfrei') || lowerMessage.includes('laktosefrei') ||
                lowerMessage.includes('mit laktose') || lowerMessage.includes('mit gluten') ||
                lowerMessage.includes('laktose') || lowerMessage.includes('gluten') ||
                lowerMessage.includes('ei') || lowerMessage.includes('nuss') || lowerMessage.includes('soja')) {

                // Prüfe ob nach Gerichten MIT dem Allergen gesucht wird
                const searchingForContains = lowerMessage.includes('mit ') ||
                    lowerMessage.includes('gibt es') ||
                    lowerMessage.includes('enthält') ||
                    (lowerMessage.includes('was') && !lowerMessage.includes('frei'));

                if (searchingForContains) {
                    // Suche nach Gerichten DIE das Allergen enthalten
                    const allergen = extractAllergenFromMessage(lowerMessage);
                    return await searchMealsByIngredient(allergen);
                } else {
                    // Suche nach Gerichten OHNE das Allergen (frei von)
                    const allergen = extractAllergenFromMessage(lowerMessage);
                    return await getAllergenFreeOptions(allergen);
                }
            }

            // HEUTIGES MENÜ & EMPFEHLUNGEN - ERWEITERTE ERKENNUNG
            if ((lowerMessage.includes('heute') && (
                lowerMessage.includes('essen') ||
                lowerMessage.includes('empfehlung') ||
                lowerMessage.includes('passt') ||
                lowerMessage.includes('passend') ||
                lowerMessage.includes('vorlieben') ||
                lowerMessage.includes('geeignet') ||
                lowerMessage.includes('mensa') ||
                lowerMessage.includes('gibt es') ||
                lowerMessage.includes('menü') ||
                lowerMessage.includes('speiseplan')
            )) && !hasSpecificIngredient(lowerMessage)) {
                return await getTodaysRecommendations();
            }

            // ODER: Direkte Menü-Anfragen
            if ((lowerMessage.includes('was gibt es') || lowerMessage.includes('zeige') || lowerMessage.includes('liste')) &&
                (lowerMessage.includes('heute') || lowerMessage.includes('mensa') || lowerMessage.includes('menü'))) {
                return await getTodaysRecommendations();
            }

            // ODER: Generelle Vorlieben-Anfragen (auch ohne "heute")
            if ((lowerMessage.includes('passt') || lowerMessage.includes('passend')) &&
                (lowerMessage.includes('vorlieben') || lowerMessage.includes('präferenz'))) {
                return await getTodaysRecommendations();
            }

            // MEINE VORLIEBEN
            if (lowerMessage.includes('meine vorlieben') || lowerMessage.includes('was sind meine') ||
                (lowerMessage.includes('vorlieben') && lowerMessage.includes('meine'))) {
                return await getUserPreferences();
            }

            // VEGETARISCH & VEGAN (lokal - strukturierte Daten)
            if (lowerMessage.includes('vegetarisch') || lowerMessage.includes('vegan')) {
                return await getVegetarianOptions();
            }

            // ZUSATZSTOFFE & ALLERGENE
            if (lowerMessage.includes('zusatzstoff') || lowerMessage.includes('additive')) {
                const words = message.split(/\s+/);
                const additiveIndex = words.findIndex(word =>
                    word.toLowerCase().includes('zusatzstoff') ||
                    word.toLowerCase().includes('additive')
                );

                const searchTerm = additiveIndex >= 0 && additiveIndex < words.length - 1
                    ? words[additiveIndex + 1]
                    : '';

                return await searchByAdditives(searchTerm);
            }

            // NACHHALTIGE OPTIONEN (lokal - Badge-basiert)
            if (lowerMessage.includes('nachhaltig') || lowerMessage.includes('fairtrade') ||
                lowerMessage.includes('klima') || lowerMessage.includes('umwelt')) {
                return await getSustainableOptions();
            }

            // GÜNSTIGE OPTIONEN (lokal - Preis-basiert)
            if (lowerMessage.includes('günstig') || lowerMessage.includes('billig') ||
                lowerMessage.includes('budget') || lowerMessage.includes('preiswert')) {
                return await getBudgetOptions();
            }

            // MENSA INFORMATIONEN
            if (lowerMessage.includes('meine mensa') || lowerMessage.includes('ausgewählte mensa')) {
                return await getMensaInfo();
            }

            // ÖFFNUNGSZEITEN
            if (lowerMessage.includes('öffnungszeit') || lowerMessage.includes('geöffnet') ||
                lowerMessage.includes('geschlossen') || lowerMessage.includes('wann offen')) {
                return await getOpeningHours();
            }

            // HILFE
            if (lowerMessage.includes('hilfe') || lowerMessage.includes('help') ||
                lowerMessage.includes('was kannst du') || lowerMessage.includes('befehle')) {
                return getEnhancedHelpMessage();
            }

            // FALLBACK für unbekannte Anfragen
            return `Das verstehe ich noch nicht. Versuche es mit:\n\n• "Was kann ich heute essen?"\n• "Vegetarische Optionen"\n• "Günstige Gerichte"\n• "Hilfe"\n\nOder stelle eine konkrete Frage!`;
        };

        // Prüft ob es eine strukturierte Anfrage
        const isStructuredQuery =
            // User-Daten Anfragen
            (lowerMessage.includes('meine vorlieben') || lowerMessage.includes('meine mensa')) ||
            (lowerMessage.includes('was ist meine') && (lowerMessage.includes('mensa') || lowerMessage.includes('vorlieben'))) ||

            // Filter-Befehle
            (lowerMessage.includes('vegetarische optionen') || lowerMessage.includes('vegane optionen')) ||
            (lowerMessage.includes('günstige gerichte')) ||
            (lowerMessage.includes('was kann ich heute essen')) ||

            // Hilfe
            (lowerMessage.includes('hilfe') || lowerMessage.includes('help')) ||

            // ALLE Zutat/Allergen-Suchen (egal welche Zutat)
            (lowerMessage.includes('gibt es') && lowerMessage.includes('mit ')) ||
            (lowerMessage.includes('was mit ')) ||
            (lowerMessage.includes('gerichte mit ')) ||
            (lowerMessage.includes('laktose') || lowerMessage.includes('gluten') || lowerMessage.includes('ei') ||
                lowerMessage.includes('fisch') || lowerMessage.includes('huhn') || lowerMessage.includes('pasta') ||
                lowerMessage.includes('reis') || lowerMessage.includes('salat') || lowerMessage.includes('suppe') ||
                lowerMessage.includes('fleisch') || lowerMessage.includes('soja') || lowerMessage.includes('nuss')) ||

            // Allergen-freie Anfragen
            (lowerMessage.includes('frei') && (lowerMessage.includes('laktose') || lowerMessage.includes('gluten') || lowerMessage.includes('allergen')));

        if (isStructuredQuery) {
            console.log('Strukturierte Anfrage - verwende lokales System');
            return await getLocalResponse();
        }

        // Hybrid-System: Prüft erst Offline-Status
        if (!isOnline) {
            console.log('Offline - verwende nur lokales System');
            return await getLocalResponse();
        }

        // Online: Verwendet Hybrid-System
        try {
            const hybridResponse = await geminiService.getHybridResponse(
                message,
                userProfile,
                getLocalResponse
            );

            // Debug-Anzeige für Entwicklung
            if (__DEV__) {
                const statusEmoji = hybridResponse.isLocal ? ' (Lokal)' : ' (AI)';
                console.log(`Antwort-Typ: ${hybridResponse.isLocal ? 'Lokales System' : 'Gemini AI'}`);

                // Stellt sicher, dass es ein String ist
                let responseText = typeof hybridResponse.response === 'string'
                    ? hybridResponse.response
                    : String(hybridResponse.response);

                // Verbessert Gemini-Antworten
                if (!hybridResponse.isLocal) {
                    responseText = enhanceGeminiResponse(responseText);
                }

                return responseText + statusEmoji;
            }

            let finalResponse = typeof hybridResponse.response === 'string'
                ? hybridResponse.response
                : String(hybridResponse.response);

            if (!hybridResponse.isLocal) {
                finalResponse = enhanceGeminiResponse(finalResponse);
            }

            return finalResponse;
        } catch (error) {
            console.error('Hybrid-System Fehler:', error);
            // Sicherheits-Fallback
            return await getLocalResponse();
        }
    };

    const enhanceGeminiResponse = (response: string): string => {
        // Entferne unnötige Phrasen
        let enhanced = response
            .replace(/Basierend auf den heutigen Menüdaten[,.]*/gi, '')
            .replace(/Laut dem aktuellen Speiseplan[,.]*/gi, '')
            .replace(/In der heutigen Auswahl[,.]*/gi, '')
            .replace(/Im heutigen Menü der Mensa[,.]*/gi, '')
            .trim();

        // Korrigiere häufige Gemini-Fehler
        enhanced = enhanced
            .replace(/\n\n+/g, '\n\n')
            .replace(/^[•\-]\s*/gm, '')
            .replace(/\s+([.!?])/g, '$1');

        return enhanced;
    };

    const getUserPreferences = async (): Promise<string> => {
        try {
            if (!userProfile?.preferences?.length) {
                return "Du hast noch keine Vorlieben ausgewählt. Gehe zu deinem Profil und setze deine Präferenzen!";
            }

            let response = "Deine aktuellen Vorlieben:\n\n";
            userProfile.preferences.forEach((pref, index) => {
                response += `• ${pref.charAt(0).toUpperCase() + pref.slice(1)}\n`;
            });

            response += `\nIch berücksichtige diese Vorlieben bei meinen Empfehlungen. Du kannst sie in deinem Profil ändern.`;

            return response;
        } catch (error) {
            return "Kann Vorlieben nicht laden.";
        }
    };

    const getMensaInfo = async (): Promise<string> => {
        try {
            if (!userProfile?.selectedMensa) {
                return "Du hast noch keine Lieblings-Mensa ausgewählt. Gehe zu deinem Profil und wähle eine aus!";
            }

            const canteens = await fetchCanteensWithCache();
            const selectedMensa = canteens?.find((m: any) => m.id === userProfile.selectedMensa);

            if (!selectedMensa) {
                return "Kann Informationen zu deiner Mensa nicht laden.";
            }

            let response = `Deine ausgewählte Mensa:\n\n${selectedMensa.name}\n`;

            if (selectedMensa.address) {
                response += `Adresse: ${selectedMensa.address.street}, ${selectedMensa.address.zipcode} ${selectedMensa.address.city}\n`;
            }

            return response;
        } catch (error) {
            return "Kann Mensa-Informationen nicht laden.";
        }
    };

    const getOpeningHours = async (): Promise<string> => {
        try {
            if (!userProfile?.selectedMensa) {
                return "Du hast noch keine Lieblings-Mensa ausgewählt. Gehe zu deinem Profil und wähle eine aus!";
            }

            const canteens = await fetchCanteensWithCache();
            const selectedMensa = canteens?.find((m: any) => m.id === userProfile.selectedMensa);

            if (!selectedMensa?.openingHours) {
                return "Öffnungszeiten für deine Mensa sind leider nicht verfügbar.";
            }

            let response = `Öffnungszeiten von ${selectedMensa.name}:\n\n`;

            Object.entries(selectedMensa.openingHours).forEach(([day, hours]: [string, any]) => {
                if (hours && hours !== 'closed') {
                    response += `${day}: ${hours}\n`;
                } else {
                    response += `${day}: Geschlossen\n`;
                }
            });

            return response;
        } catch (error) {
            return "Kann Öffnungszeiten nicht laden.";
        }
    };

    const searchByAdditives = async (searchTerm: string): Promise<string> => {
        try {
            if (!additivesCache) {
                const additives = await fetchAdditivesWithCache();
                setAdditivesCache(additives || []);
            }

            if (!searchTerm) {
                return "Bitte gib einen Zusatzstoff an, z.B. 'Zusatzstoff 1' oder 'Zusatzstoff Farbstoff'";
            }

            const foundAdditive = additivesCache?.find((additive: any) =>
                additive.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                additive.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (!foundAdditive) {
                return `Zusatzstoff "${searchTerm}" nicht gefunden. Verfügbare Zusatzstoffe kannst du in der App einsehen.`;
            }

            return `Zusatzstoff: ${foundAdditive.name}\nBeschreibung: ${foundAdditive.description || 'Keine Beschreibung verfügbar'}`;
        } catch (error) {
            return "Kann Zusatzstoff-Informationen nicht laden.";
        }
    };

    const searchMealsByIngredient = async (ingredient: string): Promise<string> => {
        try {
            if (!userProfile?.selectedMensa) {
                return "Du hast noch keine Lieblings-Mensa ausgewählt. Gehe zu deinem Profil und wähle eine aus!";
            }

            const today = new Date().toISOString().split('T')[0];
            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

            let meals = [];
            if (Array.isArray(menu)) {
                const dayData = menu.find((day: any) => day.date === today);
                meals = dayData?.meals || [];
            } else if (menu?.meals) {
                meals = menu.meals;
            }

            const matchingMeals = meals.filter((meal: any) =>
                meal.name?.toLowerCase().includes(ingredient.toLowerCase())
            );

            if (matchingMeals.length === 0) {
                return `Heute gibt es leider keine Gerichte mit "${ingredient}".`;
            }

            let response = `Gerichte mit "${ingredient}" heute:\n\n`;
            matchingMeals.slice(0, 8).forEach((meal: any, index: number) => {
                const price = meal.prices?.[0]?.price ? ` - ${meal.prices[0].price}€` : '';
                response += `${index + 1}. ${meal.name}${price}\n`;

                if (meal.category) {
                    response += `   Kategorie: ${meal.category}\n`;
                }

                const relevantBadges = meal.badges?.filter((b: any) =>
                    !['Grüner Ampelpunkt', 'Gelber Ampelpunkt', 'Roter Ampelpunkt', 'CO2_bewertung_A', 'CO2_bewertung_B', 'CO2_bewertung_C', 'H2O_bewertung_A', 'H2O_bewertung_B', 'H2O_bewertung_C'].includes(b?.name)
                );

                if (relevantBadges?.length > 0) {
                    response += `   Eigenschaften: ${relevantBadges.map((b: any) => b.name).join(', ')}\n`;
                }

                response += '\n';
            });

            if (matchingMeals.length > 8) {
                response += `...und ${matchingMeals.length - 8} weitere Gerichte!`;
            }

            return response;
        } catch (error) {
            console.error('Zutaten-Suche Fehler:', error);
            return `Kann nicht nach "${ingredient}" suchen.`;
        }
    };

    const getVegetarianOptions = async (): Promise<string> => {
        try {
            if (!userProfile?.selectedMensa) {
                return "Du hast noch keine Lieblings-Mensa ausgewählt. Gehe zu deinem Profil und wähle eine aus!";
            }

            const today = new Date().toISOString().split('T')[0];
            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

            let meals = [];
            if (Array.isArray(menu)) {
                const dayData = menu.find((day: any) => day.date === today);
                meals = dayData?.meals || [];
            } else if (menu?.meals) {
                meals = menu.meals;
            }

            const vegetarianMeals = meals.filter((meal: any) => {
                const badges = meal.badges?.map((b: any) => b?.name) || [];
                return badges.includes('Vegetarisch') || badges.includes('Vegan');
            });

            if (vegetarianMeals.length === 0) {
                return "Heute gibt es leider keine speziell ausgewiesenen vegetarischen Optionen.";
            }

            let response = "Vegetarische & vegane Optionen heute:\n\n";
            vegetarianMeals.forEach((meal: any, index: number) => {
                const price = meal.prices?.[0]?.price ? ` - ${meal.prices[0].price}€` : '';
                const isVegan = meal.badges?.some((b: any) => b?.name === 'Vegan');
                const vegLabel = isVegan ? ' (Vegan)' : ' (Vegetarisch)';

                response += `${index + 1}. ${meal.name}${price}${vegLabel}\n`;
            });

            return response;
        } catch (error) {
            return "Kann vegetarische Optionen nicht laden.";
        }
    };

    const getAllergenFreeOptions = async (allergen: string): Promise<string> => {
        try {
            if (!userProfile?.selectedMensa) {
                return "Du hast noch keine Lieblings-Mensa ausgewählt. Gehe zu deinem Profil und wähle eine aus!";
            }

            const today = new Date().toISOString().split('T')[0];
            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

            let meals = [];
            if (Array.isArray(menu)) {
                const dayData = menu.find((day: any) => day.date === today);
                meals = dayData?.meals || [];
            } else if (menu?.meals) {
                meals = menu.meals;
            }

            let allergenFreeMeals = meals.filter((meal: any) => {
                const allergens = meal.allergens || [];
                const allergensText = allergens.join(' ').toLowerCase();

                switch (allergen.toLowerCase()) {
                    case 'gluten':
                        return !allergensText.includes('gluten') && !allergensText.includes('weizen') &&
                            !allergensText.includes('gerste') && !allergensText.includes('roggen') &&
                            !allergensText.includes('hafer') && !allergensText.includes('dinkel');
                    case 'laktose':
                        return !allergensText.includes('milch') && !allergensText.includes('laktose');
                    case 'ei':
                    case 'eier':
                        return !allergensText.includes('eier');
                    case 'nuss':
                    case 'nüsse':
                        return !allergensText.includes('nuss') && !allergensText.includes('mandel') &&
                            !allergensText.includes('haselnuss') && !allergensText.includes('walnuss');
                    case 'fisch':
                        return !allergensText.includes('fisch');
                    case 'soja':
                        return !allergensText.includes('soja');
                    case 'sellerie':
                        return !allergensText.includes('sellerie');
                    case 'senf':
                        return !allergensText.includes('senf');
                    case 'sesam':
                        return !allergensText.includes('sesam');
                    default:
                        return !allergensText.includes(allergen.toLowerCase());
                }
            });

            if (allergenFreeMeals.length === 0) {
                return `Heute gibt es leider keine ${allergen}freien Optionen.`;
            }

            let response = `${allergen.charAt(0).toUpperCase() + allergen.slice(1)}freie Optionen heute:\n\n`;
            allergenFreeMeals.slice(0, 8).forEach((meal: any, index: number) => {
                const price = meal.prices?.[0]?.price ? ` - ${meal.prices[0].price}€` : '';
                response += `${index + 1}. ${meal.name}${price}\n`;

                // Zeige positive Eigenschaften (was NICHT enthalten ist, ist gut)
                const allergens = meal.allergens || [];
                if (allergens.length > 0) {
                    response += `   Weitere Allergene: ${allergens.slice(0, 3).join(', ')}${allergens.length > 3 ? '...' : ''}\n`;
                }
            });

            if (allergenFreeMeals.length > 8) {
                response += `\n...und ${allergenFreeMeals.length - 8} weitere!`;
            }

            return response;
        } catch (error) {
            return `Kann allergenfreie Gerichte nicht laden.`;
        }
    };

    const getSustainableOptions = async (): Promise<string> => {
        try {
            if (!userProfile?.selectedMensa) {
                return "Du hast noch keine Lieblings-Mensa ausgewählt. Gehe zu deinem Profil und wähle eine aus!";
            }

            const today = new Date().toISOString().split('T')[0];
            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

            let meals = [];
            if (Array.isArray(menu)) {
                const dayData = menu.find((day: any) => day.date === today);
                meals = dayData?.meals || [];
            } else if (menu?.meals) {
                meals = menu.meals;
            }

            const sustainableMeals = meals.filter((meal: any) => {
                const badges = meal.badges?.map((b: any) => b?.name) || [];
                return badges.some(badge =>
                    ['Fairtrade', 'Klimaessen', 'Nachhaltige Landwirtschaft', 'CO2_bewertung_A'].includes(badge)
                );
            });

            if (sustainableMeals.length === 0) {
                return "Heute gibt es leider keine speziell nachhaltigen Optionen.";
            }

            let response = "Nachhaltige Optionen heute:\n\n";
            sustainableMeals.forEach((meal: any, index: number) => {
                const price = meal.prices?.[0]?.price ? ` - ${meal.prices[0].price}€` : '';
                const sustainableBadges = meal.badges?.filter((b: any) =>
                    ['Fairtrade', 'Klimaessen', 'Nachhaltige Landwirtschaft', 'CO2_bewertung_A'].includes(b?.name)
                );

                response += `${index + 1}. ${meal.name}${price}\n`;
                if (sustainableBadges?.length > 0) {
                    response += `   Nachhaltig: ${sustainableBadges.map((b: any) => b.name).join(', ')}\n`;
                }
                response += '\n';
            });

            return response;
        } catch (error) {
            return "Kann nachhaltige Optionen nicht laden.";
        }
    };

    const getBudgetOptions = async (): Promise<string> => {
        try {
            if (!userProfile?.selectedMensa) {
                return "Du hast noch keine Lieblings-Mensa ausgewählt. Gehe zu deinem Profil und wähle eine aus!";
            }

            const today = new Date().toISOString().split('T')[0];
            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

            let meals = [];
            if (Array.isArray(menu)) {
                const dayData = menu.find((day: any) => day.date === today);
                meals = dayData?.meals || [];
            } else if (menu?.meals) {
                meals = menu.meals;
            }

            const budgetMeals = meals
                .filter((meal: any) => meal.prices?.[0]?.price && meal.prices[0].price <= 4.0)
                .sort((a: any, b: any) => a.prices[0].price - b.prices[0].price);

            if (budgetMeals.length === 0) {
                return "Heute gibt es leider keine besonders günstigen Optionen unter 4€.";
            }

            let response = "Günstige Optionen (unter 4€):\n\n";
            budgetMeals.slice(0, 5).forEach((meal: any, index: number) => {
                response += `${index + 1}. ${meal.name || 'Unbekanntes Gericht'} - ${meal.prices[0].price}€\n`;
            });

            return response;
        } catch (error) {
            return "Kann Preisinformationen nicht laden.";
        }
    };

    const getEnhancedHelpMessage = (): string => {
        return `Ich kann dir bei folgenden Dingen helfen:\n\n` +
            `MENÜ & EMPFEHLUNGEN:\n` +
            `• "Was kann ich heute essen?"\n` +
            `• "Zeige vegetarische Optionen"\n` +
            `• "Günstige Gerichte"\n\n` +
            `ZUTATEN-SUCHE:\n` +
            `• "Was gibt es mit Fisch heute?"\n` +
            `• "Gerichte mit Huhn"\n` +
            `• "Pasta heute"\n` +
            `• "Suppe"\n\n` +
            `ALLERGENE & ZUSATZSTOFFE:\n` +
            `• "Welche Gerichte sind glutenfrei?"\n` +
            `• "Was kann ich bei Laktoseintoleranz essen?"\n` +
            `• "Zusatzstoffe" oder "Allergene"\n\n` +
            `NACHHALTIGKEIT:\n` +
            `• "Nachhaltige Gerichte"\n` +
            `• "Fairtrade Optionen"\n\n` +
            `Tipp: Stelle einfach deine Frage in natürlicher Sprache!`;
    };

    const getTodaysRecommendations = async (): Promise<string> => {
        try {
            if (!userProfile?.selectedMensa) {
                return "Du hast noch keine Lieblings-Mensa ausgewählt. Gehe zu deinem Profil und wähle eine Mensa aus!";
            }

            console.log('=== DEBUG getTodaysRecommendations ===');
            console.log('Debug: Lade Menü für Mensa:', userProfile.selectedMensa);
            console.log('User Präferenzen:', userProfile.preferences);

            const today = new Date().toISOString().split('T')[0];
            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

            let meals = [];
            if (Array.isArray(menu)) {
                const dayData = menu.find(day => day.date === today);
                meals = dayData?.meals || [];
                console.log('Debug: Tagebasierte Struktur, gefunden:', meals.length, 'Gerichte');
            } else if (menu?.meals && Array.isArray(menu.meals)) {
                meals = menu.meals;
                console.log('Debug: Direkte meals Struktur:', meals.length, 'Gerichte');
            }

            if (meals.length === 0) {
                return `Heute gibt es leider kein Menü in deiner Lieblings-Mensa oder sie ist geschlossen.`;
            }

            // Debug: Zeige alle Kategorien
            const categories = [...new Set(meals.map((m: any) => m.category))];
            console.log('Alle vorhandenen Kategorien:', categories);

            // 1. Nach Präferenzen filtern
            console.log('=== SCHRITT 1: Präferenzen-Filter ===');
            const preferenceFilteredMeals = filterMealsByPreferences(meals);
            console.log('Debug: Nach Präferenzen gefiltert:', preferenceFilteredMeals.length);
            console.log('Präferenz-gefilterte Gerichte:', preferenceFilteredMeals.map(m => `"${m.name}" (${m.category})`));

            // 2. Intelligente Kategorie-Filterung
            console.log('=== SCHRITT 2: Hauptgerichte-Filter ===');
            const mainMeals = filterMainMeals(preferenceFilteredMeals);
            console.log('Debug: Hauptgerichte gefiltert:', mainMeals.length);

            if (mainMeals.length === 0) {
                console.log('=== FALLBACK: Suche nach Suppen ===');
                // Fallback: Zeige wenigstens Suppen wenn keine Hauptgerichte
                const fallbackMeals = preferenceFilteredMeals.filter((meal: any) => {
                    const category = (meal.category || '').toLowerCase();
                    const isSuppe = category.includes('supp') || category.includes('eintopf');
                    console.log(`Fallback-Check: "${meal.name}" | Kategorie: "${category}" | Ist Suppe: ${isSuppe}`);
                    return isSuppe;
                });

                console.log('Fallback Suppen gefunden:', fallbackMeals.length);

                if (fallbackMeals.length > 0) {
                    let response = `Heute gibt es passende Suppen für dich:\n\n`;
                    fallbackMeals.slice(0, 3).forEach((meal, index) => {
                        const price = meal.prices?.[0]?.price ? `${meal.prices[0].price}€` : '';
                        response += `${index + 1}. ${meal.name}\n   ${price}\n\n`;
                    });
                    return response;
                }

                return `Heute gibt es leider keine Hauptgerichte, die zu deinen Vorlieben passen. Schau dir das komplette Menü an!\n\nDEBUG: ${preferenceFilteredMeals.length} Gerichte nach Präferenzen, aber 0 nach Hauptgerichte-Filter.`;
            }

            // 3. Nach Wichtigkeit sortieren
            const sortedMeals = sortMealsByImportance(mainMeals);

            let response = '';
            if (sortedMeals.length >= 4) {
                response = `Tolle Auswahl für dich heute:\n\n`;
            } else if (sortedMeals.length >= 2) {
                response = `Passende Gerichte für dich heute:\n\n`;
            } else {
                response = `Für dich gefunden:\n\n`;
            }

            // Zeige max 6 relevante Gerichte
            sortedMeals.slice(0, 6).forEach((meal, index) => {
                const price = meal.prices?.[0]?.price ? `${meal.prices[0].price}€` : '';
                const category = meal.category || '';

                response += `${index + 1}. ${meal.name}\n`;
                response += `   ${price}`;

                if (category && !category.toLowerCase().includes('hauptgericht')) {
                    response += ` | ${category}`;
                }

                // Zeige relevante Badges
                const relevantBadges = meal.badges?.filter((b: any) =>
                    !['Grüner Ampelpunkt', 'Gelber Ampelpunkt', 'Roter Ampelpunkt'].includes(b?.name)
                );

                if (relevantBadges?.length > 0) {
                    response += `\n   ${relevantBadges.map((b: any) => b.name).join(', ')}`;
                }

                response += '\n\n';
            });

            return response;
        } catch (error) {
            console.error('Fehler bei getTodaysRecommendations:', error);
            return "Kann heutige Empfehlungen nicht laden.";
        }
    };

    const filterMealsByPreferences = (meals: any[]): any[] => {
        console.log('Filtere', meals.length, 'Gerichte nach Präferenzen');
        console.log('User Präferenzen:', userProfile?.preferences);

        return meals.filter((meal, index) => {
            // Sammle Badge-Namen für dieses Gericht
            const mealBadgeNames = meal.badges
                ?.map((b: any) => b?.name || '')
                ?.filter(Boolean) || [];

            // Debug für erste paar Gerichte
            if (index < 3) {
                console.log(`Gericht ${index + 1}:`, {
                    name: meal.name?.substring(0, 30) + '...',
                    badges: mealBadgeNames
                });
            }

            // Wenn keine Präferenzen -> zeige alles
            if (!userProfile?.preferences?.length) {
                return true;
            }

            // Exaktes Badge-Matching mit den echten API-Badge-Namen
            const hasMatchingPreference = userProfile.preferences.some(preference => {
                const prefLower = preference.toLowerCase();

                const badgeMatches = mealBadgeNames.some(badgeName => {
                    switch (prefLower) {
                        case 'vegan':
                            return badgeName === 'Vegan';
                        case 'vegetarisch':
                        case 'vegetarian':
                            return badgeName === 'Vegetarisch' || badgeName === 'Vegan';
                        case 'fairtrade':
                            return badgeName === 'Fairtrade';
                        case 'klimaessen':
                        case 'klima':
                            return badgeName === 'Klimaessen';
                        case 'nachhaltig':
                            return badgeName === 'Nachhaltige Landwirtschaft';
                        default:
                            return false;
                    }
                });

                return badgeMatches;
            });

            return hasMatchingPreference;
        });
    };

    // Neue Hilfsfunktion: Filtere nur relevante Hauptgerichte
    const filterMainMeals = (meals: any[]): any[] => {
        console.log('=== DEBUG filterMainMeals ===');
        console.log('Input Gerichte:', meals.length);

        const filtered = meals.filter((meal: any) => {
            const category = (meal.category || '').toLowerCase();
            const name = (meal.name || '').toLowerCase();

            // Debug jeden Filter-Schritt
            console.log(`Prüfe: "${meal.name}" | Kategorie: "${category}"`);

            const excludeCategories = [
                'beilagen',
                'aktionen'
            ];

            if (excludeCategories.includes(category)) {
                console.log(`  -> AUSGESCHLOSSEN: Kategorie "${category}" in Exclude-Liste`);
                return false;
            }

            // ALLE anderen Kategorien sind ok - außer Dressings in Salaten
            if (category === 'salate') {
                // Nur bei Salaten: Dressings rausfiltern
                const isDressing = name.includes('dressing') || name.includes('sauce') || name.includes('vinaigrette');
                if (isDressing) {
                    console.log(`  -> AUSGESCHLOSSEN: Salat ist Dressing/Sauce`);
                    return false;
                } else {
                    console.log(`  -> EINGESCHLOSSEN: Echter Salat`);
                    return true;
                }
            }

            // Alles andere ist erlaubt
            console.log(`  -> EINGESCHLOSSEN: Kategorie "${category}" erlaubt`);
            return true;
        });

        console.log('Output Gerichte nach filterMainMeals:', filtered.length);
        console.log('Gefilterte Gerichte:', filtered.map(m => `"${m.name}" (${m.category})`));
        console.log('=== END DEBUG ===');

        return filtered;
    };

    const sortMealsByImportance = (meals: any[]): any[] => {
        return meals.sort((a: any, b: any) => {
            // Priorität nach Badges
            const aHasSpecialBadge = a.badges?.some((badge: any) =>
                ['Vegan', 'Vegetarisch', 'Fairtrade', 'Klimaessen'].includes(badge?.name)
            );
            const bHasSpecialBadge = b.badges?.some((badge: any) =>
                ['Vegan', 'Vegetarisch', 'Fairtrade', 'Klimaessen'].includes(badge?.name)
            );

            if (aHasSpecialBadge && !bHasSpecialBadge) return -1;
            if (!aHasSpecialBadge && bHasSpecialBadge) return 1;

            // Sekundäre Sortierung nach Preis
            const aPrice = a.prices?.[0]?.price || 999;
            const bPrice = b.prices?.[0]?.price || 999;
            return aPrice - bPrice;
        });
    };

    // Hilfsfunktionen für Zutaten-Erkennung:
    const hasSpecificIngredient = (message: string): boolean => {
        const ingredients = [
            'fisch', 'fish', 'lachs', 'thunfisch', 'kabeljau',
            'fleisch', 'schwein', 'rind', 'beef', 'pork', 'huhn', 'chicken', 'hähnchen', 'pute', 'turkey',
            'pasta', 'nudeln', 'spaghetti', 'reis', 'rice', 'kartoffel', 'potato',
            'salat', 'suppe', 'soup', 'pizza', 'burger',
            'käse', 'cheese', 'milch', 'milk', 'joghurt', 'yogurt',
            'tofu', 'seitan', 'quinoa', 'bulgur', 'couscous',
            'gemüse', 'vegetables', 'tomaten', 'paprika', 'zwiebeln', 'spinat',
            'obst', 'fruit', 'apfel', 'banane', 'orange',
            // Allergene hinzugefügt
            'laktose', 'gluten', 'ei', 'eier', 'nuss', 'nüsse', 'soja', 'sellerie', 'senf', 'sesam'
        ];

        return ingredients.some(ingredient => message.includes(ingredient));
    };

    const extractIngredientFromMessage = (message: string): string | null => {
        const patterns = [
            /(?:mit|von|aus)\s+([a-zA-ZäöüÄÖÜß]+)/g,
            /([a-zA-ZäöüÄÖÜß]+)(?:\s+heute|\s+gerichte?)/g,
            /(fisch|fleisch|huhn|pasta|reis|salat|suppe|laktose|milch|gluten|ei|eier|nuss|soja)/g
        ];

        for (const pattern of patterns) {
            const matches = message.matchAll(pattern);
            for (const match of matches) {
                const ingredient = match[1] || match[0];
                if (ingredient && ingredient.length > 2) {
                    return ingredient.toLowerCase();
                }
            }
        }

        // Spezielle Allergen-Erkennung
        const allergenPatterns = [
            /laktose/g,
            /milch/g,
            /gluten/g,
            /ei|eier/g,
            /nuss|nüsse/g,
            /soja/g,
            /fisch/g,
            /sellerie/g,
            /senf/g,
            /sesam/g
        ];

        for (const pattern of allergenPatterns) {
            const match = message.match(pattern);
            if (match) {
                return match[0].toLowerCase();
            }
        }

        return null;
    };

    const extractAllergenFromMessage = (message: string): string => {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('gluten')) return 'gluten';
        if (lowerMessage.includes('laktose') || lowerMessage.includes('milch')) return 'laktose';
        if (lowerMessage.includes('ei') || lowerMessage.includes('eier')) return 'ei';
        if (lowerMessage.includes('nuss') || lowerMessage.includes('nüsse')) return 'nuss';
        if (lowerMessage.includes('fisch')) return 'fisch';
        if (lowerMessage.includes('soja')) return 'soja';
        if (lowerMessage.includes('sellerie')) return 'sellerie';
        if (lowerMessage.includes('senf')) return 'senf';
        if (lowerMessage.includes('sesam')) return 'sesam';

        return 'allgemein';
    };

    // Header mit Status-Anzeige
    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                    {isOnline ? 'Online AI-Modus' : 'Offline-Modus'}
                </Text>
                {!isOnline && (
                    <Text style={styles.offlineNote}>
                        Lokale Antworten verfügbar
                    </Text>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ChatMessage
                        message={item.message}
                        isUser={item.isUser}
                        timestamp={item.timestamp}
                    />
                )}
                ListHeaderComponent={messages.length === 0 ? <WelcomeMessage /> : null}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContainer}
            />
            {isTyping && <TypingIndicator />}
            <ChatInput onSendMessage={handleSendMessage} />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    headerContainer: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statusContainer: {
        alignItems: 'center',
    },
    statusText: {
        fontSize: 12,
        color: '#28a745',
        fontWeight: '500',
    },
    offlineNote: {
        fontSize: 10,
        color: '#6c757d',
        marginTop: 2,
    },
    messagesList: {
        flex: 1,
    },
    messagesContainer: {
        padding: 16,
        paddingBottom: 100,
    },
});

export default ChatbotScreen;