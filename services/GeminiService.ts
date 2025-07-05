// services/GeminiService.ts
import { fetchMenuWithCache, fetchCanteensWithCache } from '@/lib/storage';

interface GeminiResponse {
    response: string;
    isLocal: boolean;
    error?: string;
}

export class GeminiService {
    private apiKey: string;
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

    constructor() {
        this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    }

    /**
     * Hauptfunktion: Hybrid-Antwort generieren
     */
    async getHybridResponse(
        message: string,
        userProfile: any,
        localResponseFn: () => Promise<string>
    ): Promise<GeminiResponse> {

        // 1. Prüft Internet-Verbindung
        const hasInternet = await this.checkInternetConnection();

        if (!hasInternet) {
            console.log('Offline - Verwende lokales System');
            const localResponse = await localResponseFn();
            return {
                response: localResponse,
                isLocal: true
            };
        }

        // 2. Bestimmt ob lokales System ausreicht
        if (this.shouldUseLocalSystem(message)) {
            console.log('Einfache Anfrage - Verwende lokales System');
            const localResponse = await localResponseFn();
            return {
                response: localResponse,
                isLocal: true
            };
        }

        // 3. Verwendet Gemini für komplexe Anfragen
        try {
            console.log('🤖 Komplexe Anfrage - Verwende Gemini AI');
            const geminiResponse = await this.callGeminiWithContext(message, userProfile);
            return {
                response: geminiResponse,
                isLocal: false
            };
        } catch (error) {
            console.log('❌ Gemini-Fehler - Fallback zu lokalem System');
            const localResponse = await localResponseFn();
            return {
                response: localResponse + '\n\n(AI temporär nicht verfügbar)',
                isLocal: true,
                error: error instanceof Error ? error.message : 'Unbekannter Fehler'
            };
        }
    }

    /**
     * Bestimme ob lokales System ausreicht
     */
    private shouldUseLocalSystem(message: string): boolean {
        const lowerMessage = message.toLowerCase();

        // Lokales System für einfache, strukturierte Anfragen
        const localTriggers = [
            'was kann ich heute essen',
            'heutiges menü',
            'vegetarische optionen',
            'vegane optionen',
            'günstige gerichte',
            'allergenfreie',
            'laktosefrei',
            'glutenfrei',
            'nachhaltige gerichte',
            'fairtrade optionen',
            'hilfe',
            'help',
            'was kannst du',
            'meine mensa',
            'meine vorlieben'
        ];

        return localTriggers.some(trigger => lowerMessage.includes(trigger));
    }

    /**
     * Ruft Gemini mit optimiertem Kontext auf
     */
    private async callGeminiWithContext(message: string, userProfile: any): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Gemini API Key nicht konfiguriert');
        }

        // Sammle relevante Kontext-Daten
        const context = await this.buildMensaContext(userProfile);

        const prompt = this.buildIntelligentPrompt(message, context, userProfile);

        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 400,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Fehler: ${response.status}`);
        }

        const data = await response.json();

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Keine gültige Antwort von Gemini erhalten');
        }

        return data.candidates[0].content.parts[0].text;
    }

    /**
     * Baue detaillierten Mensa-Kontext
     */
    private async buildMensaContext(userProfile: any): Promise<string> {
        let context = '';

        try {
            // User-Profil
            if (userProfile?.name) {
                context += `USER: ${userProfile.name}\n`;
            }

            if (userProfile?.preferences?.length > 0) {
                context += `USER-PRÄFERENZEN: ${userProfile.preferences.join(', ')}\n`;
            }

            // Mensa-Info
            if (userProfile?.selectedMensa) {
                const canteens = await fetchCanteensWithCache();
                const selectedMensa = canteens?.find((m: any) => m.id === userProfile.selectedMensa);
                if (selectedMensa) {
                    context += `AKTUELLE MENSA: ${selectedMensa.name}\n`;
                    if (selectedMensa.address) {
                        context += `ADRESSE: ${selectedMensa.address.street}, ${selectedMensa.address.zipcode} ${selectedMensa.address.city}\n`;
                    }
                }
            }

            // Heutiges Menü
            if (userProfile?.selectedMensa) {
                const today = new Date().toISOString().split('T')[0];
                const menu = await fetchMenuWithCache(userProfile.selectedMensa, today);

                let meals = [];
                if (Array.isArray(menu)) {
                    const dayData = menu.find((day: any) => day.date === today);
                    meals = dayData?.meals || [];
                } else if (menu?.meals) {
                    meals = menu.meals;
                }

                if (meals.length > 0) {
                    context += `\nHEUTIGES MENÜ (${today}):\n`;
                    meals.slice(0, 12).forEach((meal: any, index: number) => {
                        const price = meal.prices?.[0]?.price ? ` - ${meal.prices[0].price}€` : '';
                        const category = meal.category ? ` (${meal.category})` : '';
                        const badges = meal.badges?.map((b: any) => b.name).join(', ') || '';
                        const allergens = meal.allergens?.slice(0, 3).join(', ') || '';

                        context += `${index + 1}. ${meal.name}${price}${category}\n`;
                        if (badges) context += `   Eigenschaften: ${badges}\n`;
                        if (allergens) context += `   Allergene: ${allergens}\n`;
                    });
                    context += '\n';
                }
            }

        } catch (error) {
            console.error('Fehler beim Laden des Kontexts:', error);
        }

        return context;
    }

    /**
     * Baue intelligenten Prompt mit Pattern-Templates
     */
    private buildIntelligentPrompt(message: string, context: string, userProfile: any): string {
        return `Du bist ein hilfsreicher Mensa-Assistent für die Berliner Mensa-App "Kantino".

KONTEXT:
${context}

ANTWORT-REGELN:
1. Antworte auf Deutsch in natürlicher, freundlicher Sprache
2. Halte Antworten kurz und präzise (max. 3-4 Sätze)
3. Nutze IMMER die bereitgestellten Menü-Daten - nie erfinden!
4. Gib konkrete Empfehlungen mit Preisen aus dem Menü
5. Berücksichtige User-Präferenzen bei Empfehlungen
6. Falls nichts passt: Sage es ehrlich und biete Alternativen

ANTWORT-PATTERNS:

Für Zutat/Allergen-Suche:
- Falls gefunden: "Ja! Heute gibt es [GERICHT] für [PREIS]€. Das enthält [ALLERGEN/ZUTAT]."
- Falls nicht gefunden: "Heute gibt es leider keine Gerichte mit [ZUTAT]. Stattdessen empfehle ich..."

Für Gesundheit/Eigenschaften:
- Analysiere die verfügbaren Gerichte und deren Badges
- Nenne konkrete Beispiele mit Preisen
- Format: "[GERICHT] ist [EIGENSCHAFT] und kostet [PREIS]€"

Für allgemeine Empfehlungen:
- Berücksichtige User-Präferenzen (${userProfile?.preferences?.join(', ') || 'keine'})
- Wähle 2-3 passende Gerichte aus dem heutigen Menü
- Format: "[GERICHT1] ([PREIS]€) und [GERICHT2] ([PREIS]€) passen zu deinen Vorlieben"

WICHTIG: 
- Verwende NUR Gerichte aus dem obigen Menü
- Verwende NUR echte Preise aus dem Menü  
- Erfinde KEINE Gerichte oder Preise
- Bei Unklarheiten: "Im heutigen Menü finde ich..."

USER-FRAGE: ${message}

Antwort (basierend auf echten Menü-Daten):`;
    }

    /**
     * Prüfe Internet-Verbindung
     */
    private async checkInternetConnection(): Promise<boolean> {
        try {
            // In React Native mit NetInfo prüfen
            const NetInfo = require('@react-native-community/netinfo');
            const state = await NetInfo.fetch();
            return state.isConnected === true;
        } catch {
            // Fallback: Versuche einfachen Fetch
            try {
                const response = await fetch('https://www.google.com', {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                return response.ok;
            } catch {
                return false;
            }
        }
    }
}