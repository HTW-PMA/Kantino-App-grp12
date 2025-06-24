import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCanteens, fetchMeals, fetchBadges, fetchAdditives, fetchMenu } from '@/lib/api/mensaService';

const CACHE_KEYS = {
    canteens: 'canteens',
    meals: 'meals',
    badges: 'badges',
    additives: 'additives',
    menu: 'menu',
    userName: 'userName',
};

export async function fetchCanteensWithCache(): Promise<any> {
    try {
        const data = await fetchCanteens();
        await AsyncStorage.setItem(CACHE_KEYS.canteens, JSON.stringify(data));
        return data;
    } catch (e) {
        // If API call fails (offline), return cached data if available
        const cached = await AsyncStorage.getItem(CACHE_KEYS.canteens);
        if (cached) return JSON.parse(cached);
        throw e;
    }
}

export async function fetchMenuWithCache(canteenId: string, date: string) {
    try {
        const data = await fetchMenu(canteenId, date);
        await AsyncStorage.setItem(CACHE_KEYS.menu, JSON.stringify(data));
        return data;
    } catch (e) {
        const cached = await AsyncStorage.getItem(CACHE_KEYS.menu);
        if (cached) return JSON.parse(cached);
        throw e;
    }
}

// Repeat for other endpoints...
export async function fetchMealsWithCache() {
    try {
        const data = await fetchMeals();
        await AsyncStorage.setItem(CACHE_KEYS.meals, JSON.stringify(data));
        return data;
    } catch (e) {
        const cached = await AsyncStorage.getItem(CACHE_KEYS.meals);
        if (cached) return JSON.parse(cached);
        throw e;
    }
}

// Neue Funktionen für User-Name
export const storeName = async (name: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(CACHE_KEYS.userName, name);
    } catch (error) {
        console.error('Error storing name:', error);
    }
};

export const getName = async (): Promise<string | null> => {
    try {
        const name = await AsyncStorage.getItem(CACHE_KEYS.userName);
        return name;
    } catch (error) {
        console.error('Error getting name:', error);
        return null;
    }
};

export const removeName = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(CACHE_KEYS.userName);
    } catch (error) {
        console.error('Error removing name:', error);
    }
};