export const BASE_URL = process.env.EXPO_PUBLIC_MENSA_BASE_URL || 'https://mensa.gregorflachs.de/api';
export const API_KEY = process.env.EXPO_PUBLIC_MENSA_API_KEY;

export const ENDPOINTS = {
    canteen: '/canteen',
    meal: '/meal',
    additive: '/additive',
    badge: '/badge',
    menue: '/menue',
};

// Validierung für Development
if (!API_KEY && __DEV__) {
    console.warn('⚠️ EXPO_PUBLIC_MENSA_API_KEY ist nicht gesetzt! Bitte .env Datei erstellen.');
}