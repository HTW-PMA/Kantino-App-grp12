// lib/storage.ts
// AsyncStorage Persistent wrapper for caching data from the mensa API
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCanteens, fetchMeals, fetchBadges, fetchAdditives, fetchMenu } from '@/lib/api/mensaService';
import { isOnline, updateLastConnectionTime, isDataCriticallyStale } from '@/lib/network';

// Interface für erweiterte Lieblingsspeisen
export interface FavoriteMealWithContext {
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
    dateAdded: string;
    dayOfWeek: string;
    originalDate: string;
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
    favoriteMealsWithContext: 'favoriteMealsWithContext',
};

// Erweiterte Cache-Funktionen mit Network-Awareness
export async function fetchCanteensWithCache(): Promise<any> {
    const online = await isOnline();
    console.log('fetchCanteensWithCache - Online:', online);

    if (online) {
        try {
            const data = await fetchCanteens();
            await AsyncStorage.setItem(CACHE_KEYS.canteens, JSON.stringify(data));
            await updateLastConnectionTime();
            console.log('✅ Fresh data loaded from API');
            return data;
        } catch (e) {
            console.log('API call failed, trying cache...');
            const cached = await AsyncStorage.getItem(CACHE_KEYS.canteens);
            if (cached) {
                console.log('✅ Fallback cache found');
                return JSON.parse(cached);
            }
            throw e;
        }
    } else {
        console.log('Loading from cache (offline)');
        const cached = await AsyncStorage.getItem(CACHE_KEYS.canteens);
        if (cached) {
            console.log('✅ Cache found, returning data');
            return JSON.parse(cached);
        }
        console.log('❌ No cache found');
        throw new Error('Keine Internetverbindung und keine gecachten Daten');
    }
}

export async function fetchMenuWithCache(canteenId: string, date: string): Promise<any> {
    const cacheKey = `${CACHE_KEYS.menu}_${canteenId}_${date}`;
    const online = await isOnline();

    // Prüfe zuerst ob cached data zu alt ist
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached && !online && await isDataCriticallyStale()) {
        throw new Error('Menüdaten sind über 3 Tage alt und keine Internetverbindung verfügbar');
    }

    if (online) {
        try {
            const data = await fetchMenu(canteenId, date);
            await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
            await updateLastConnectionTime();
            return data;
        } catch (e) {
            console.log('Menu API call failed, trying cache...');
            if (cached) return JSON.parse(cached);
            throw e;
        }
    } else {
        if (cached) return JSON.parse(cached);
        throw new Error('Keine Internetverbindung und keine gecachten Menüdaten');
    }
}

export async function fetchMealsWithCache(): Promise<any> {
    const online = await isOnline();

    if (online) {
        try {
            const data = await fetchMeals();
            await AsyncStorage.setItem(CACHE_KEYS.meals, JSON.stringify(data));
            await updateLastConnectionTime();
            return data;
        } catch (e) {
            console.log('Meals API call failed, trying cache...');
            const cached = await AsyncStorage.getItem(CACHE_KEYS.meals);
            if (cached) return JSON.parse(cached);
            throw e;
        }
    } else {
        const cached = await AsyncStorage.getItem(CACHE_KEYS.meals);
        if (cached) return JSON.parse(cached);
        throw new Error('Keine Internetverbindung und keine gecachten Mahlzeiten');
    }
}

// Funktion zum manuellen Refresh der Daten
export async function refreshAllData(): Promise<{success: boolean, errors: string[]}> {
    const errors: string[] = [];
    let success = false;

    if (!(await isOnline())) {
        return { success: false, errors: ['Keine Internetverbindung'] };
    }

    try {
        await fetchCanteensWithCache();
        success = true;
    } catch (error) {
        errors.push('Mensen konnten nicht aktualisiert werden');
    }

    try {
        await fetchMealsWithCache();
        success = true;
    } catch (error) {
        errors.push('Mahlzeiten konnten nicht aktualisiert werden');
    }

    return { success, errors };
}

// Cache-Management Funktionen
export async function clearApiCache(): Promise<void> {
    try {
        const apiKeys = [CACHE_KEYS.canteens, CACHE_KEYS.meals, CACHE_KEYS.badges, CACHE_KEYS.additives];

        // Lösche nur API-Cache, nicht User-Daten
        await Promise.all(apiKeys.map(key => AsyncStorage.removeItem(key)));

        // Lösche auch Menü-Caches (die haben dynamische Keys)
        const allKeys = await AsyncStorage.getAllKeys();
        const menuKeys = allKeys.filter(key => key.startsWith(CACHE_KEYS.menu));
        await Promise.all(menuKeys.map(key => AsyncStorage.removeItem(key)));

        console.log('API Cache cleared');
    } catch (error) {
        console.error('Error clearing API cache:', error);
    }
}

// Alle deine bestehenden User-Funktionen bleiben unverändert:

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
    meal: Omit<FavoriteMealWithContext, 'dateAdded' | 'dayOfWeek'>,
    context: {
        mensaId: string;
        mensaName: string;
        originalDate: string;
    }
): Promise<boolean> => {
    try {
        const favorites = await getFavoriteMealsWithContext();

        // Prüfe ob bereits vorhanden
        const exists = favorites.some(fav => fav.id === meal.id);
        if (exists) return false;

        const now = new Date();
        const dayOfWeek = now.toLocaleDateString('de-DE', { weekday: 'long' });

        const mealWithContext: FavoriteMealWithContext = {
            ...meal,
            mensaId: context.mensaId,
            mensaName: context.mensaName,
            originalDate: context.originalDate,
            dateAdded: now.toISOString(),
            dayOfWeek: dayOfWeek,
        };

        const updatedFavorites = [...favorites, mealWithContext];
        await AsyncStorage.setItem(CACHE_KEYS.favoriteMealsWithContext, JSON.stringify(updatedFavorites));

        return true;
    } catch (error) {
        console.error('Error adding meal to favorites with context:', error);
        return false;
    }
};

export const removeMealFromFavoritesWithContext = async (mealId: string): Promise<boolean> => {
    try {
        const favorites = await getFavoriteMealsWithContext();
        const updatedFavorites = favorites.filter(fav => fav.id !== mealId);

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

export const getFavoriteCategories = async (): Promise<string[]> => {
    try {
        const favorites = await getFavoriteMealsWithContext();
        const categories = [...new Set(favorites.map(fav => fav.category || 'Sonstiges'))];
        return categories.sort();
    } catch (error) {
        console.error('Error getting favorite categories:', error);
        return [];
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

export async function preloadAllMenus(): Promise<void> {
    const online = await isOnline();
    if (!online) {
        console.log('Kein Internet – Menü-Preload übersprungen');
        return;
    }

    try {
        const canteens = await fetchCanteensWithCache();
        const canteenIds = canteens.map((c: any) => c.id || c._id).filter(Boolean);
        const today = new Date().toISOString().split('T')[0];

        for (const canteenId of canteenIds) {
            const cacheKey = `${CACHE_KEYS.menu}_${canteenId}_${today}`;

            try {
                const data = await fetchMenu(canteenId, today);
                await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
                console.log(`Menü für ${canteenId} am ${today} gespeichert`);
            } catch (e) {
                console.warn(`Fehler beim Speichern von Menü für ${canteenId}:`, e);
            }
        }

        await updateLastConnectionTime();
        console.log('Tagesmenüs erfolgreich vorgeladen');

    } catch (error) {
        console.error('Fehler beim Vorladen der Tagesmenüs:', error);
    }
}

export async function cleanupOldMenus(): Promise<void> {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const today = new Date().toISOString().split('T')[0];

        const keysToDelete = allKeys.filter(key =>
            key.startsWith(CACHE_KEYS.menu) && !key.includes(`_${today}`)
        );

        if (keysToDelete.length > 0) {
            await AsyncStorage.multiRemove(keysToDelete);
            console.log(`Alte Menü-Caches gelöscht: ${keysToDelete.length}`);
        } else {
            console.log('Keine veralteten Menü-Caches gefunden');
        }
    } catch (error) {
        console.error('Fehler beim Bereinigen alter Menü-Caches:', error);
    }
}
