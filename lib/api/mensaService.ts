// services/mensaService.ts
import { BASE_URL, ENDPOINTS, API_KEY } from '@/lib/api/api';

/**
 * Basis-Fetch-Funktion mit API-Key-Header
 */
async function apiRequest(endpoint: string, options: RequestInit = {}) {
    if (!API_KEY) {
        throw new Error('API-Key ist nicht konfiguriert. Bitte .env Datei prüfen.');
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status} - ${response.statusText}`);
    }

    return response.json();
}

/**
 * Ruft alle Mahlzeiten mit optionalen Filter-Parametern ab.
 * @param queryParams - z.B. "?canteen=fu2&date=2025-06-21"
 */
export async function fetchMeals(queryParams = '') {
    return apiRequest(`${ENDPOINTS.meal}${queryParams}`);
}

/**
 * Ruft alle Mensen ab
 */
export async function fetchCanteens() {
    return apiRequest(ENDPOINTS.canteen);
}

/**
 * Ruft Menü für spezifische Mensa und Datum ab
 * @param canteenId - ID der Mensa
 * @param date - Datum im Format YYYY-MM-DD
 */
export async function fetchMenu(canteenId: string, date: string) {
    return apiRequest(`${ENDPOINTS.menue}?canteenId=${canteenId}&startdate=${date}`);
}

/**
 * Ruft alle Zusatzstoffe ab
 */
export async function fetchAdditives() {
    return apiRequest(ENDPOINTS.additive);
}

/**
 * Ruft alle Badges ab
 */
export async function fetchBadges() {
    return apiRequest(ENDPOINTS.badge);
}