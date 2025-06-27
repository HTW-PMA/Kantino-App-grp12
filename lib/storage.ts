// lib/storage.ts
// AsyncStorage Persistent wrapper for caching data from the mensa API
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCanteens, fetchMeals, fetchBadges, fetchAdditives, fetchMenu } from '@/lib/api/mensaService';

const CACHE_KEYS = {
    canteens: 'canteens',
    meals: 'meals',
    badges: 'badges',
    additives: 'additives',
    menu: 'menu',
    userName: 'userName',
    savedMensen: 'savedMensen',
    favoriteMeals: 'favoriteMeals',
    selectedMensa: 'selectedMensa',
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

// User-Name Funktionen
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

// Gespeicherte Mensen Funktionen
export const getSavedMensen = async (): Promise<string[]> => {
    try {
        const saved = await AsyncStorage.getItem(CACHE_KEYS.savedMensen);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error getting saved mensen:', error);
        return [];
    }
};

export const addMensaToSaved = async (mensaId: string): Promise<boolean> => {
    try {
        const savedIds = await getSavedMensen();

        if (!savedIds.includes(mensaId)) {
            const updatedIds = [...savedIds, mensaId];
            await AsyncStorage.setItem(CACHE_KEYS.savedMensen, JSON.stringify(updatedIds));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error adding mensa to saved:', error);
        return false;
    }
};

export const removeMensaFromSaved = async (mensaId: string): Promise<boolean> => {
    try {
        const savedIds = await getSavedMensen();
        const updatedIds = savedIds.filter(id => id !== mensaId);
        await AsyncStorage.setItem(CACHE_KEYS.savedMensen, JSON.stringify(updatedIds));
        return true;
    } catch (error) {
        console.error('Error removing mensa from saved:', error);
        return false;
    }
};

export const isMensaSaved = async (mensaId: string): Promise<boolean> => {
    try {
        const savedIds = await getSavedMensen();
        return savedIds.includes(mensaId);
    } catch (error) {
        console.error('Error checking if mensa is saved:', error);
        return false;
    }
};

// Lieblings-Speisen Funktionen
export const getFavoriteMeals = async (): Promise<string[]> => {
    try {
        const favorites = await AsyncStorage.getItem(CACHE_KEYS.favoriteMeals);
        return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
        console.error('Error getting favorite meals:', error);
        return [];
    }
};

export const addMealToFavorites = async (mealId: string): Promise<boolean> => {
    try {
        const favoriteIds = await getFavoriteMeals();

        if (!favoriteIds.includes(mealId)) {
            const updatedIds = [...favoriteIds, mealId];
            await AsyncStorage.setItem(CACHE_KEYS.favoriteMeals, JSON.stringify(updatedIds));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error adding meal to favorites:', error);
        return false;
    }
};

export const removeMealFromFavorites = async (mealId: string): Promise<boolean> => {
    try {
        const favoriteIds = await getFavoriteMeals();
        const updatedIds = favoriteIds.filter(id => id !== mealId);
        await AsyncStorage.setItem(CACHE_KEYS.favoriteMeals, JSON.stringify(updatedIds));
        return true;
    } catch (error) {
        console.error('Error removing meal from favorites:', error);
        return false;
    }
};

export const isMealFavorite = async (mealId: string): Promise<boolean> => {
    try {
        const favoriteIds = await getFavoriteMeals();
        return favoriteIds.includes(mealId);
    } catch (error) {
        console.error('Error checking if meal is favorite:', error);
        return false;
    }
};

// Mensa-Auswahl Funktionen
export const storeSelectedMensa = async (mensaId: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(CACHE_KEYS.selectedMensa, mensaId);
        console.log('Mensa gespeichert:', mensaId);
    } catch (error) {
        console.error('Error storing selected mensa:', error);
    }
};

export const getSelectedMensa = async (): Promise<string | null> => {
    try {
        const mensaId = await AsyncStorage.getItem(CACHE_KEYS.selectedMensa);
        return mensaId;
    } catch (error) {
        console.error('Error getting selected mensa:', error);
        return null;
    }
};

export const removeSelectedMensa = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(CACHE_KEYS.selectedMensa);
    } catch (error) {
        console.error('Error removing selected mensa:', error);
    }
};