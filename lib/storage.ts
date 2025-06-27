// lib/storage.ts
// AsyncStorage Persistent wrapper for caching data from the mensa API
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCanteens, fetchMeals, fetchBadges, fetchAdditives, fetchMenu } from '@/lib/api/mensaService';

// Interface für erweiterte Lieblingsspeisen
interface FavoriteMealWithContext {
    id: string;
    name: string;
    category?: string;
    badges?: string[];
    additives?: string[];
    prices?: {
        students?: number;
        employees?: number;
        guests?: number;
    };
    // Kontext-Informationen
    mensaId: string;
    mensaName: string;
    dateAdded: string; // ISO string
    dayOfWeek: string;
    originalDate: string; // Das Datum für das der Speiseplan war
}

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
    favoriteMealsWithContext: 'favoriteMealsWithContext', // Neu
};

// Api-Daten abrufen und in AsyncStorage cachen
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

// Username Funktionen
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

// Gespeicherte Mensen-Funktionen
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

// Alte lieblingsspeisen-Funktionen
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

// Erweiterte Lieblingsspeisen-Funktionen mit Kontext
export const getFavoriteMealsWithContext = async (): Promise<FavoriteMealWithContext[]> => {
    try {
        const favorites = await AsyncStorage.getItem(CACHE_KEYS.favoriteMealsWithContext);
        return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
        console.error('Error getting favorite meals with context:', error);
        return [];
    }
};

export const addMealToFavoritesWithContext = async (
    meal: {
        id: string;
        name: string;
        category?: string;
        badges?: string[];
        additives?: string[];
        prices?: {
            students?: number;
            employees?: number;
            guests?: number;
        };
    },
    context: {
        mensaId: string;
        mensaName: string;
        originalDate: string; // Das Datum für das der Speiseplan war (z.B. "2025-06-25")
    }
): Promise<boolean> => {
    try {
        const existingFavorites = await getFavoriteMealsWithContext();

        // Prüfe ob bereits vorhanden
        const isAlreadyFavorite = existingFavorites.some(fav => fav.id === meal.id);
        if (isAlreadyFavorite) {
            return false; // Schon vorhanden
        }

        // Erstelle erweiterte Meal-Daten
        const now = new Date();
        const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

        const favoriteMealWithContext: FavoriteMealWithContext = {
            ...meal,
            mensaId: context.mensaId,
            mensaName: context.mensaName,
            dateAdded: now.toISOString(),
            dayOfWeek: dayNames[now.getDay()],
            originalDate: context.originalDate,
        };

        const updatedFavorites = [...existingFavorites, favoriteMealWithContext];
        await AsyncStorage.setItem(CACHE_KEYS.favoriteMealsWithContext, JSON.stringify(updatedFavorites));

        return true;
    } catch (error) {
        console.error('Error adding meal to favorites with context:', error);
        return false;
    }
};

export const removeMealFromFavoritesWithContext = async (mealId: string): Promise<boolean> => {
    try {
        const existingFavorites = await getFavoriteMealsWithContext();
        const updatedFavorites = existingFavorites.filter(fav => fav.id !== mealId);

        await AsyncStorage.setItem(CACHE_KEYS.favoriteMealsWithContext, JSON.stringify(updatedFavorites));
        return true;
    } catch (error) {
        console.error('Error removing meal from favorites with context:', error);
        return false;
    }
};

export const isMealFavoriteWithContext = async (mealId: string): Promise<boolean> => {
    try {
        const favorites = await getFavoriteMealsWithContext();
        return favorites.some(fav => fav.id === mealId);
    } catch (error) {
        console.error('Error checking if meal is favorite with context:', error);
        return false;
    }
};

// Hilfsfunktionen für Filterung
export const getFavoriteMealsByCategory = async (category?: string): Promise<FavoriteMealWithContext[]> => {
    try {
        const allFavorites = await getFavoriteMealsWithContext();
        if (!category || category === 'all') {
            return allFavorites;
        }
        return allFavorites.filter(meal => meal.category === category);
    } catch (error) {
        console.error('Error filtering favorite meals by category:', error);
        return [];
    }
};

export const getFavoriteMealsByMensa = async (mensaId?: string): Promise<FavoriteMealWithContext[]> => {
    try {
        const allFavorites = await getFavoriteMealsWithContext();
        if (!mensaId) {
            return allFavorites;
        }
        return allFavorites.filter(meal => meal.mensaId === mensaId);
    } catch (error) {
        console.error('Error filtering favorite meals by mensa:', error);
        return [];
    }
};

export const getFavoriteCategories = async (): Promise<string[]> => {
    try {
        const favorites = await getFavoriteMealsWithContext();
        const categories = favorites
            .map(meal => meal.category)
            .filter((category): category is string => Boolean(category));
        return [...new Set(categories)].sort();
    } catch (error) {
        console.error('Error getting favorite categories:', error);
        return [];
    }
};

// MENSA Auswahl Funktionen
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

export type { FavoriteMealWithContext };