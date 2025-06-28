// lib/api/weatherService.ts

export interface WeatherData {
    temperature: number;
    condition: string;
    description: string;
    humidity: number;
    icon: string;
}

export interface FoodRecommendation {
    type: string;
    emoji: string;
    reason: string;
    categories: string[];
    keywords: string[];
}

// Kostenlose APIs ohne Key für Berlin
const BERLIN_COORDS = { lat: 52.5200, lon: 13.4050 };

export async function getBerlinWeather(): Promise<WeatherData> {
    try {
        // open-meteo.com - komplett kostenlos, kein Key nötig
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${BERLIN_COORDS.lat}&longitude=${BERLIN_COORDS.lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m&timezone=Europe/Berlin&forecast_days=1`
        );

        if (!response.ok) {
            throw new Error('Weather API error');
        }

        const data = await response.json();
        const current = data.current_weather;
        const humidity = data.hourly.relativehumidity_2m[0];

        return {
            temperature: Math.round(current.temperature),
            condition: getConditionFromCode(current.weathercode),
            description: getDescriptionFromCode(current.weathercode),
            humidity: humidity,
            icon: getIconFromCode(current.weathercode),
        };
    } catch (error) {
        console.warn('Weather API Fehler, verwende Mock-Daten:', error);
        return getMockWeather();
    }
}

// Mock-Daten für Demo (realistisch für Berlin)
function getMockWeather(): WeatherData {
    const currentHour = new Date().getHours();
    const currentMonth = new Date().getMonth();
    const isWinter = currentMonth <= 2 || currentMonth >= 11;
    const isSummer = currentMonth >= 5 && currentMonth <= 8;

    // Verschiedene Wetterlagen simulieren
    const scenarios = [
        // Winter
        ...(isWinter ? [
            { temp: 3, condition: 'Snow', desc: 'leichter Schneefall', humidity: 85 },
            { temp: -1, condition: 'Clouds', desc: 'stark bewölkt', humidity: 80 },
            { temp: 7, condition: 'Rain', desc: 'Nieselregen', humidity: 90 },
            { temp: 5, condition: 'Clear', desc: 'sonnig', humidity: 65 },
        ] : []),

        // Sommer
        ...(isSummer ? [
            { temp: 28, condition: 'Clear', desc: 'sonnig', humidity: 55 },
            { temp: 32, condition: 'Clear', desc: 'sehr sonnig', humidity: 45 },
            { temp: 24, condition: 'Clouds', desc: 'teilweise bewölkt', humidity: 65 },
            { temp: 19, condition: 'Rain', desc: 'Regenschauer', humidity: 85 },
        ] : []),

        // Frühling/Herbst
        ...(!isWinter && !isSummer ? [
            { temp: 16, condition: 'Clouds', desc: 'bewölkt', humidity: 70 },
            { temp: 22, condition: 'Clear', desc: 'heiter', humidity: 60 },
            { temp: 14, condition: 'Rain', desc: 'Regen', humidity: 85 },
            { temp: 18, condition: 'Clear', desc: 'sonnig', humidity: 55 },
        ] : [])
    ];

    // Zufälliges Szenario auswählen
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    return {
        temperature: scenario.temp,
        condition: scenario.condition,
        description: scenario.desc,
        humidity: scenario.humidity,
        icon: getIconForCondition(scenario.condition),
    };
}

function getIconForCondition(condition: string): string {
    switch (condition) {
        case 'Clear': return '01d';
        case 'Clouds': return '03d';
        case 'Rain': return '10d';
        case 'Snow': return '13d';
        default: return '01d';
    }
}

// Konvertiere Open-Meteo Weather Codes zu lesbaren Conditions
function getConditionFromCode(code: number): string {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Clouds';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Rain';
    if (code <= 86) return 'Snow';
    if (code <= 99) return 'Thunderstorm';
    return 'Clear';
}

function getDescriptionFromCode(code: number): string {
    const descriptions: Record<number, string> = {
        0: 'sonnig',
        1: 'überwiegend sonnig',
        2: 'teilweise bewölkt',
        3: 'bewölkt',
        45: 'neblig',
        48: 'neblig',
        51: 'leichter Nieselregen',
        53: 'Nieselregen',
        55: 'starker Nieselregen',
        61: 'leichter Regen',
        63: 'Regen',
        65: 'starker Regen',
        71: 'leichter Schneefall',
        73: 'Schneefall',
        75: 'starker Schneefall',
        80: 'Regenschauer',
        81: 'Regenschauer',
        82: 'starke Regenschauer',
        95: 'Gewitter',
        96: 'Gewitter mit Hagel',
        99: 'starkes Gewitter'
    };

    return descriptions[code] || 'unbekannt';
}

function getIconFromCode(code: number): string {
    if (code === 0) return '01d';
    if (code <= 3) return '03d';
    if (code <= 67) return '10d';
    if (code <= 77) return '13d';
    if (code <= 99) return '11d';
    return '01d';
}

export function getFoodRecommendation(weather: WeatherData): FoodRecommendation {
    const { temperature, condition, humidity } = weather;

    // Sehr heißes Wetter (>28°C)
    if (temperature > 28) {
        return {
            type: 'Erfrischende Kost',
            emoji: '🥗',
            reason: `Bei ${temperature}°C sind kalte, erfrischende Gerichte ideal`,
            categories: ['salat', 'vorspeise', 'snack'],
            keywords: ['salat', 'gazpacho', 'melone', 'joghurt', 'smoothie', 'kalt', 'frisch', 'obst', 'eis']
        };
    }

    // Warmes Wetter (22-28°C)
    if (temperature > 22) {
        return {
            type: 'Leichte Gerichte',
            emoji: '🍲',
            reason: `${temperature}°C - perfekt für ausgewogene, leichte Mahlzeiten`,
            categories: ['salat', 'essen', 'suppe'],
            keywords: ['pasta', 'salat', 'gemüse', 'fisch', 'bowl', 'wrap', 'leicht']
        };
    }

    // Mildes Wetter (15-22°C)
    if (temperature > 15) {
        return {
            type: 'Ausgewogene Kost',
            emoji: '🍽️',
            reason: `${temperature}°C - ideales Wetter für alle Arten von Gerichten`,
            categories: ['essen', 'hauptgericht', 'salat'],
            keywords: ['schnitzel', 'pasta', 'salat', 'gemüse', 'fleisch', 'vegetarisch', 'curry']
        };
    }

    // Kaltes Wetter oder Regen (<15°C oder Rain/Snow)
    if (temperature < 15 || condition === 'Rain' || condition === 'Snow') {
        return {
            type: 'Wärmende Speisen',
            emoji: '🍜',
            reason: temperature < 5 ?
                `Bei ${temperature}°C braucht der Körper warme, deftige Kost` :
                `Bei ${temperature}°C und ${condition === 'Rain' ? 'Regen' : condition === 'Snow' ? 'Schnee' : 'kühlem Wetter'} wärmen herzhafte Gerichte`,
            categories: ['suppe', 'essen', 'hauptgericht'],
            keywords: ['suppe', 'eintopf', 'schnitzel', 'gulasch', 'braten', 'warm', 'herzhaft', 'deftig', 'curry', 'chili']
        };
    }

    // Hohe Luftfeuchtigkeit (schwül)
    if (humidity > 85 && temperature > 20) {
        return {
            type: 'Leicht Verdauliches',
            emoji: '🥙',
            reason: 'Bei schwüler Luft sind leichte, bekömmliche Gerichte die beste Wahl',
            categories: ['salat', 'snack', 'vorspeise'],
            keywords: ['salat', 'wrap', 'sandwich', 'obst', 'joghurt', 'leicht', 'frisch']
        };
    }

    // Fallback
    return {
        type: 'Vielfältige Auswahl',
        emoji: '🍽️',
        reason: `${temperature}°C - perfektes Wetter für alle Geschmäcker`,
        categories: ['essen', 'hauptgericht', 'salat'],
        keywords: ['pasta', 'schnitzel', 'salat', 'gemüse', 'fleisch', 'vegetarisch']
    };
}

export function getWeatherEmoji(condition: string, temperature: number): string {
    switch (condition.toLowerCase()) {
        case 'clear':
            return temperature > 25 ? '☀️' : '🌤️';
        case 'clouds':
            return temperature > 20 ? '☁️' : '🌫️';
        case 'rain':
        case 'drizzle':
            return '🌧️';
        case 'thunderstorm':
            return '⛈️';
        case 'snow':
            return '❄️';
        case 'mist':
        case 'fog':
            return '🌫️';
        default:
            return temperature > 20 ? '🌤️' : '☁️';
    }
}