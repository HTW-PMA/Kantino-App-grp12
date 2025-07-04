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
    fetchCanteensWithCache,
    fetchBadgesWithCache,
    fetchAdditivesWithCache
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
    const [additivesCache, setAdditivesCache] = useState<any[] | null>(null);
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

        if (!userProfile) {
            return "Lade dein Profil... Versuche es gleich nochmal!";
        }

        // HEUTIGES MENÜ & EMPFEHLUNGEN - ERWEITERTE ERKENNUNG
        if ((lowerMessage.includes('heute') && (
            lowerMessage.includes('essen') ||
            lowerMessage.includes('empfehlung') ||
            lowerMessage.includes('passt') ||
            lowerMessage.includes('passend') ||
            lowerMessage.includes('vorlieben') ||
            lowerMessage.includes('geeignet')
        )) && !hasSpecificIngredient(lowerMessage)) {
            return await getTodaysRecommendations();
        }

        // ODER: Generelle Vorlieben-Anfragen (auch ohne "heute")
        if ((lowerMessage.includes('passt') || lowerMessage.includes('passend')) &&
            (lowerMessage.includes('vorlieben') || lowerMessage.includes('präferenz'))) {
            return await getTodaysRecommendations();
        }

        // ZUTATEN-SUCHE
        const ingredientSearch = extractIngredientFromMessage(lowerMessage);
        if (ingredientSearch) {
            return await searchMealsByIngredient(ingredientSearch);
        }

        // VEGETARISCH & VEGAN
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
                : undefined;

            return await getAdditiveInfo(searchTerm);
        }

        if (lowerMessage.includes('allergen') || lowerMessage.includes('allergien')) {
            return await getAllergenInfo();
        }

        // ALLERGENFREIE GERICHTE
        const allergenFreePatterns = [
            { pattern: /glutenfrei|ohne gluten/i, allergen: 'gluten' },
            { pattern: /laktosefrei|ohne laktose|ohne milch/i, allergen: 'laktose' },
            { pattern: /ohne ei|eifrei/i, allergen: 'ei' },
            { pattern: /ohne fisch|fischfrei/i, allergen: 'fisch' },
            { pattern: /ohne erdnuss|erdnussfrei/i, allergen: 'erdnuss' },
            { pattern: /ohne nuss|nussfrei/i, allergen: 'nuss' },
            { pattern: /ohne soja|sojafrei/i, allergen: 'soja' }
        ];

        for (const { pattern, allergen } of allergenFreePatterns) {
            if (pattern.test(message)) {
                return await getAllergenFreeMeals(allergen);
            }
        }

        // PREIS & BUDGET
        if (lowerMessage.includes('preis') || lowerMessage.includes('günstig') || lowerMessage.includes('billig') || lowerMessage.includes('budget')) {
            return await getBudgetOptions();
        }

        // MENSA-INFO
        if (lowerMessage.includes('mensa') || lowerMessage.includes('lieblings')) {
            return await getFavoriteMensaMenu();
        }

        // NACHHALTIGKEIT
        if (lowerMessage.includes('nachhaltig') || lowerMessage.includes('klimaessen') || lowerMessage.includes('fairtrade') || lowerMessage.includes('umwelt')) {
            return await getSustainableOptions();
        }

        // BEGRÜSSUNG
        if (lowerMessage.includes('hallo') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return `Hallo ${userProfile.name || 'dort'}!\n\nWie kann ich dir heute bei der Essensauswahl helfen?\n\nProbiere: "Was gibt es heute mit Fisch?" oder "Welche Gerichte sind glutenfrei?"`;
        }

        // HILFE
        if (lowerMessage.includes('hilfe') || lowerMessage.includes('help') || lowerMessage.includes('was kannst du')) {
            return getEnhancedHelpMessage();
        }

        // FALLBACK
        return `Das verstehe ich nicht ganz. Versuche es mal mit:\n\n• "Was gibt es heute mit Fisch?"\n• "Zeige vegetarische Optionen"\n• "Welche Gerichte sind glutenfrei?"\n• "Zusatzstoffe"\n• "Hilfe"\n\nIch kann nach spezifischen Zutaten suchen!`;
    };

    const searchMealsByIngredient = async (ingredient: string): Promise<string> => {
        if (!userProfile?.selectedMensa) {
            return "Wähle zuerst eine Lieblings-Mensa aus!";
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

            let meals = [];
            if (Array.isArray(menu)) {
                const dayData = menu.find(day => day.date === today);
                meals = dayData?.meals || [];
            } else if (menu?.meals && Array.isArray(menu.meals)) {
                meals = menu.meals;
            }

            // Parse Suchbegriffe (entweder JSON-Array oder einzelner Begriff)
            let searchTerms: string[] = [];
            try {
                searchTerms = JSON.parse(ingredient);
            } catch {
                searchTerms = [ingredient.toLowerCase()];
            }

            console.log(`Suche nach Begriffen: [${searchTerms.join(', ')}] in ${meals.length} Gerichten`);

            const matchingMeals = meals.filter((meal: any) => {
                // 1. Suche im Namen mit ALLEN Begriffen
                const nameMatch = searchTerms.some(term =>
                    meal.name && meal.name.toLowerCase().includes(term)
                );

                // 2. Suche in Zusatzstoffen/Allergenen mit ALLEN Begriffen
                const additiveMatch = meal.additives?.some((additive: any) =>
                    searchTerms.some(term =>
                        (additive.name || additive.text || '').toLowerCase().includes(term)
                    )
                );

                // 3. Suche in der Kategorie mit ALLEN Begriffen
                const categoryMatch = searchTerms.some(term =>
                    meal.category && meal.category.toLowerCase().includes(term)
                );

                if (nameMatch || additiveMatch || categoryMatch) {
                    console.log(`Match gefunden: "${meal.name}" - Name: ${nameMatch}, Zusatzstoff: ${additiveMatch}, Kategorie: ${categoryMatch}`);
                }

                return nameMatch || additiveMatch || categoryMatch;
            });

            console.log(`Gefundene Gerichte mit "${searchTerms.join(', ')}": ${matchingMeals.length}`);

            if (matchingMeals.length === 0) {
                return `Heute gibt es leider keine Gerichte mit "${searchTerms.join(' oder ')}".\n\nTipp: Versuche es mit anderen Begriffen oder schaue in einer anderen Mensa.`;
            }

            let response = `Gerichte mit "${searchTerms[0]}" (${matchingMeals.length}):\n\n`;

            matchingMeals.slice(0, 8).forEach((meal, index) => {
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
            'obst', 'fruit', 'apfel', 'banane', 'orange'
        ];

        return ingredients.some(ingredient => message.includes(ingredient));
    };

    const extractIngredientFromMessage = (message: string): string | null => {
        const ingredientPatterns = [
            // Fisch & Meeresfrüchte - ERWEITERT
            {
                pattern: /\b(fisch|fish|lachs|salmon|seelachs|thunfisch|tuna|kabeljau|cod|forelle|trout|scholle|garnele|shrimp|muschel|krabben)\b/i,
                terms: ['fisch', 'lachs', 'salmon', 'seelachs', 'thunfisch', 'tuna', 'kabeljau', 'cod', 'forelle', 'trout', 'scholle', 'garnele', 'shrimp', 'muschel', 'krabben']
            },

            // Fleisch - ERWEITERT
            {
                pattern: /\b(fleisch|meat|schwein|pork|rind|beef|kalb|veal|lamm|lamb|wurst|sausage|speck|bacon|schnitzel|steak)\b/i,
                terms: ['fleisch', 'schwein', 'pork', 'rind', 'beef', 'kalb', 'veal', 'lamm', 'lamb', 'wurst', 'sausage', 'speck', 'bacon', 'schnitzel', 'steak']
            },

            // Geflügel - ERWEITERT
            {
                pattern: /\b(huhn|chicken|hähnchen|hühnchen|geflügel|pute|turkey|ente|duck|gans)\b/i,
                terms: ['huhn', 'hähnchen', 'chicken', 'pute', 'turkey', 'ente', 'duck', 'gans', 'geflügel']
            },

            // Pasta & Kohlenhydrate
            {
                pattern: /\b(pasta|nudeln|spaghetti|penne|linguine|tagliatelle|ravioli)\b/i,
                terms: ['pasta', 'nudeln', 'spaghetti', 'penne', 'linguine', 'tagliatelle', 'ravioli']
            },

            {
                pattern: /\b(reis|rice|risotto|paella)\b/i,
                terms: ['reis', 'rice', 'risotto', 'paella']
            },

            {
                pattern: /\b(kartoffel|potato|pommes|fries|kartoffelbrei)\b/i,
                terms: ['kartoffel', 'potato', 'pommes', 'fries', 'kartoffelbrei']
            },

            // Vegetarisch/Vegan
            {
                pattern: /\b(tofu|seitan|tempeh|quinoa|bulgur|couscous|kichererbsen)\b/i,
                terms: ['tofu', 'seitan', 'tempeh', 'quinoa', 'bulgur', 'couscous', 'kichererbsen']
            },

            // Gemüse
            {
                pattern: /\b(salat|lettuce|tomaten|tomato|paprika|pepper|zwiebeln|onion|spinat|spinach|brokkoli|broccoli|karotten|pilze|mushroom)\b/i,
                terms: ['salat', 'tomaten', 'paprika', 'zwiebeln', 'spinat', 'brokkoli', 'karotten', 'pilze']
            },

            // Milchprodukte
            {
                pattern: /\b(käse|cheese|mozzarella|parmesan|gouda|feta|milch|milk|joghurt|yogurt|sahne|cream|butter)\b/i,
                terms: ['käse', 'cheese', 'mozzarella', 'parmesan', 'gouda', 'feta', 'milch', 'joghurt', 'sahne', 'butter']
            },

            // Allgemeine Kategorien
            {
                pattern: /\b(suppe|soup|eintopf|brühe|curry|pizza|burger|sandwich)\b/i,
                terms: ['suppe', 'soup', 'eintopf', 'brühe', 'curry', 'pizza', 'burger', 'sandwich']
            },
        ];

        for (const { pattern, terms } of ingredientPatterns) {
            const match = message.match(pattern);
            if (match) {
                console.log(`Erkannte Zutat: "${match[1]}" -> Suchbegriffe: [${terms.join(', ')}]`);
                return JSON.stringify(terms); // Gib alle Suchbegriffe als JSON zurück
            }
        }

        return null;
    };

    const getSustainableOptions = async (): Promise<string> => {
        if (!userProfile?.selectedMensa) {
            return "Wähle zuerst eine Lieblings-Mensa aus!";
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

            let meals = [];
            if (Array.isArray(menu)) {
                const dayData = menu.find(day => day.date === today);
                meals = dayData?.meals || [];
            } else if (menu?.meals && Array.isArray(menu.meals)) {
                meals = menu.meals;
            }

            const sustainableMeals = meals.filter((meal: any) =>
                meal.badges?.some((badge: any) => {
                    const badgeName = badge?.name || '';
                    return ['Fairtrade', 'Klimaessen', 'Nachhaltige Landwirtschaft', 'Nachhaltige Fischerei', 'CO2_bewertung_A', 'Grüner Ampelpunkt'].includes(badgeName);
                })
            );

            if (sustainableMeals.length === 0) {
                return "Heute gibt es leider keine explizit als nachhaltig markierten Gerichte.";
            }

            let response = "Nachhaltige Optionen heute:\n\n";
            sustainableMeals.forEach((meal, index) => {
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

                if (category && !['Essen', 'Hauptgericht', 'Hauptgerichte'].includes(category)) {
                    response += ` | ${category}`;
                }

                const importantBadges = meal.badges?.filter((b: any) =>
                    ['Vegan', 'Vegetarisch', 'Fairtrade', 'Klimaessen', 'Nachhaltige Landwirtschaft', 'Nachhaltige Fischerei'].includes(b?.name)
                );
                if (importantBadges?.length > 0) {
                    response += ` | ${importantBadges.map((b: any) => b.name).join(', ')}`;
                }

                response += '\n\n';
            });

            if (sortedMeals.length > 6) {
                response += `...und ${sortedMeals.length - 6} weitere Gerichte!`;
            }

            return response;
        } catch (error) {
            console.error('Debug: Menü-Fehler:', error);
            return `Kann das heutige Menü nicht laden.`;
        }
    };

    const getVegetarianOptions = async (): Promise<string> => {
        if (!userProfile?.selectedMensa) {
            return "Wähle zuerst eine Lieblings-Mensa in deinem Profil aus!";
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

            let meals = [];
            if (Array.isArray(menu)) {
                const dayData = menu.find(day => day.date === today);
                meals = dayData?.meals || [];
            } else if (menu?.meals && Array.isArray(menu.meals)) {
                meals = menu.meals;
            }

            const vegetarianMeals = meals.filter((meal: any) =>
                meal.badges?.some((badge: any) => {
                    const badgeName = badge?.name || '';
                    return badgeName === 'Vegetarisch' || badgeName === 'Vegan';
                })
            );

            if (vegetarianMeals.length === 0) {
                return "Heute gibt es leider keine explizit als vegetarisch/vegan markierten Gerichte.";
            }

            let response = "Vegetarische & Vegane Optionen:\n\n";
            vegetarianMeals.forEach((meal, index) => {
                const price = meal.prices?.[0]?.price ? `${meal.prices[0].price}€` : '';

                const isVegan = meal.badges?.some((b: any) => b?.name === 'Vegan');
                const type = isVegan ? '(vegan)' : '(vegetarisch)';

                response += `${meal.name || 'Unbekanntes Gericht'} ${type}\n`;
                if (price) response += `   ${price}\n`;

                const sustainableBadges = meal.badges?.filter((b: any) =>
                    ['Fairtrade', 'Klimaessen', 'Nachhaltige Landwirtschaft', 'CO2_bewertung_A'].includes(b?.name)
                );
                if (sustainableBadges?.length > 0) {
                    response += `   Nachhaltig: ${sustainableBadges.map((b: any) => b.name).join(', ')}\n`;
                }

                response += '\n';
            });

            return response;
        } catch (error) {
            console.error('Vegetarische Optionen Fehler:', error);
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
                            return badgeName === 'Nachhaltige Landwirtschaft' ||
                                badgeName === 'Nachhaltige Fischerei';
                        case 'co2':
                        case 'klimafreundlich':
                            return badgeName === 'CO2_bewertung_A' || badgeName === 'Grüner Ampelpunkt';
                        case 'wassersparend':
                            return badgeName === 'H2O_bewertung_A';
                        default:
                            // Fallback für andere Präferenzen
                            return badgeName.toLowerCase().includes(prefLower);
                    }
                });

                // Zusätzlich: Name-basierte Suche für Fälle wo Badges fehlen
                const nameMatches = meal.name && meal.name.toLowerCase().includes(prefLower);

                return badgeMatches || nameMatches;
            });

            return hasMatchingPreference;
        });
    };

    // ZUSATZSTOFF-FUNKTIONEN (INNERHALB DER KOMPONENTE)
    const getAdditiveInfo = async (searchTerm?: string): Promise<string> => {
        try {
            // Lade Zusatzstoffe nur einmal
            if (!additivesCache) {
                const data = await fetchAdditivesWithCache();
                setAdditivesCache(data);
            }

            const currentCache = additivesCache || await fetchAdditivesWithCache();

            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const foundAdditive = currentCache.find((additive: any) =>
                    (additive.name || '').toLowerCase().includes(searchLower) ||
                    (additive.code || '').toLowerCase().includes(searchLower)
                );

                if (foundAdditive) {
                    return `Zusatzstoff "${foundAdditive.name || foundAdditive.code}":\n\n${foundAdditive.description || 'Keine weitere Beschreibung verfügbar.'}`;
                } else {
                    return `Zusatzstoff "${searchTerm}" nicht gefunden.\n\nVerfügbare Zusatzstoffe:\n` +
                        currentCache.slice(0, 8).map((a: any) => `• ${a.name || a.code}`).join('\n') +
                        `\n\nTipp: Frage nach "Allergene" für häufige Unverträglichkeiten.`;
                }
            } else {
                const allergenes = currentCache.filter((a: any) =>
                    ['Glutenhaltiges Getreide', 'Milch und Milchprodukte (inkl. Laktose)', 'Eier', 'Fisch', 'Erdnüsse', 'Soja', 'Schalenfrüchte'].includes(a.name)
                );

                const additives = currentCache.filter((a: any) =>
                    ['Farbstoff', 'Konserviert', 'Antioxidationsmittel', 'Geschmacksverstärker', 'Süßungsmittel'].includes(a.name)
                );

                let response = `Zusatzstoffe & Allergene (${currentCache.length} insgesamt):\n\n`;

                if (allergenes.length > 0) {
                    response += `Häufige Allergene:\n`;
                    allergenes.slice(0, 5).forEach((a: any) => {
                        response += `• ${a.name}\n`;
                    });
                    response += '\n';
                }

                if (additives.length > 0) {
                    response += `Zusatzstoffe:\n`;
                    additives.slice(0, 5).forEach((a: any) => {
                        response += `• ${a.name}\n`;
                    });
                    response += '\n';
                }

                response += `Frage nach spezifischen Stoffen wie "Gluten" oder "Milch"`;
                return response;
            }
        } catch (error) {
            console.error('Zusatzstoff-Fehler:', error);
            return 'Kann Zusatzstoff-Informationen nicht laden.';
        }
    };

    const getAllergenInfo = async (): Promise<string> => {
        try {
            if (!additivesCache) {
                const data = await fetchAdditivesWithCache();
                setAdditivesCache(data);
            }

            const currentCache = additivesCache || await fetchAdditivesWithCache();

            const majorAllergens = [
                'Glutenhaltiges Getreide',
                'Milch und Milchprodukte (inkl. Laktose)',
                'Eier',
                'Fisch',
                'Erdnüsse',
                'Soja',
                'Schalenfrüchte',
                'Sellerie',
                'Senf',
                'Sesam'
            ];

            const foundAllergens = currentCache.filter((a: any) =>
                majorAllergens.includes(a.name)
            );

            let response = `Hauptallergene in der Mensa:\n\n`;
            foundAllergens.forEach((allergen: any, index: number) => {
                response += `${index + 1}. ${allergen.name}\n`;
            });

            response += `\nFrage mich: "Welche Gerichte sind glutenfrei?" oder "Was kann ich bei Laktoseintoleranz essen?"`;

            return response;
        } catch (error) {
            return 'Kann Allergen-Informationen nicht laden.';
        }
    };

    const getAllergenFreeMeals = async (allergen: string): Promise<string> => {
        if (!userProfile?.selectedMensa) {
            return "Wähle zuerst eine Lieblings-Mensa aus!";
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

            let meals = [];
            if (Array.isArray(menu)) {
                const dayData = menu.find(day => day.date === today);
                meals = dayData?.meals || [];
            } else if (menu?.meals && Array.isArray(menu.meals)) {
                meals = menu.meals;
            }

            const allergenMapping: { [key: string]: string[] } = {
                'gluten': ['Glutenhaltiges Getreide', 'Weizen', 'Roggen', 'Gerste', 'Hafer', 'Dinkel'],
                'milch': ['Milch und Milchprodukte (inkl. Laktose)'],
                'laktose': ['Milch und Milchprodukte (inkl. Laktose)'],
                'ei': ['Eier'],
                'fisch': ['Fisch'],
                'erdnuss': ['Erdnüsse'],
                'nuss': ['Schalenfrüchte', 'Mandeln', 'Haselnuss', 'Walnuss'],
                'soja': ['Soja'],
                'sellerie': ['Sellerie'],
                'senf': ['Senf'],
                'sesam': ['Sesam']
            };

            const searchTerms = allergenMapping[allergen.toLowerCase()] || [allergen];

            const allergenFreeMeals = meals.filter((meal: any) => {
                const hasAllergen = meal.additives?.some((additive: any) =>
                    searchTerms.some(term =>
                        (additive.name || '').includes(term)
                    )
                );
                return !hasAllergen;
            });

            if (allergenFreeMeals.length === 0) {
                return `Heute gibt es leider keine Gerichte ohne ${allergen}.\n\nTipp: Frage nach anderen Allergenen oder schaue morgen wieder vorbei!`;
            }

            let response = `Gerichte ohne ${allergen} (${allergenFreeMeals.length}):\n\n`;
            allergenFreeMeals.slice(0, 5).forEach((meal, index) => {
                const price = meal.prices?.[0]?.price ? ` - ${meal.prices[0].price}€` : '';
                response += `${index + 1}. ${meal.name}${price}\n`;
            });

            if (allergenFreeMeals.length > 5) {
                response += `\n...und ${allergenFreeMeals.length - 5} weitere!`;
            }

            return response;
        } catch (error) {
            return `Kann allergenfreie Gerichte nicht laden.`;
        }
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
        return meals.sort((a, b) => {
            const getPriority = (meal: any) => {
                const category = (meal.category || '').toLowerCase();

                // Einfache Kategorie-basierte Prioritäten
                switch (category) {
                    case 'essen':
                    case 'hauptgericht':
                    case 'hauptgerichte':
                        return 1;

                    case 'suppen':
                        return 2;

                    case 'salate':
                        return 3;

                    case 'desserts':
                    case 'nachspeise':
                        return 4;

                    default:
                        return 5;
                }
            };

            const priorityA = getPriority(a);
            const priorityB = getPriority(b);

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // Bei gleicher Priorität: Nach Preis sortieren
            const priceA = a.prices?.[0]?.price || 999;
            const priceB = b.prices?.[0]?.price || 999;
            return priceA - priceB;
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