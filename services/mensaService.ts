// services/mealService.ts

import { BASE_URL, ENDPOINTS } from '@/constants/api';

const API_KEY = 'API_KEY_HIER'; // KEY MUSS NOCH HINZUGEFÜGT WERDEN

/**
 * Ruft alle Mahlzeiten mit optionalen Filter-Parametern ab.
 * Beispiel: ?canteen=fu2&date=2025-06-21
 */
export async function fetchMeals(queryParams = '') {
    const res = await fetch(`${BASE_URL}${ENDPOINTS.meal}${queryParams}`, {
        headers: {
            'x-api-key': API_KEY,
        },
    });

    if (!res.ok) {
        throw new Error('Fehler beim Laden der Mahlzeiten');
    }

    return res.json();
}