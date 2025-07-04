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
    selectedMensa: 'selectedMensa',
    favoriteMealsWithContext: 'favoriteMealsWithContext',
    preferences: 'userPreferences',
};

// ===== API CACHE FUNKTIONEN =====
export async function fetchCanteensWithCache(): Promise<any> {
    const online = await isOnline();
    console.log('fetchCanteensWithCache - Online:', online);

    if (online) {
        try {
            const data = await fetchCanteens();
            await AsyncStorage.setItem(CACHE_KEYS.canteens, JSON.stringify(data));
            await updateLastConnectionTime();
            console.log('Fresh canteens loaded from API');
            return data;
        } catch (e) {
            console.log('Canteens API call failed, trying cache...');
            const cached = await AsyncStorage.getItem(CACHE_KEYS.canteens);
            if (cached) {
                console.log('Fallback canteens cache found');
                return JSON.parse(cached);
            }
            throw e;
        }
    } else {
        console.log('Loading canteens from cache (offline)');
        const cached = await AsyncStorage.getItem(CACHE_KEYS.canteens);
        if (cached) {
            console.log('Canteens cache found, returning data');
            return JSON.parse(cached);
        }
        console.log('No canteens cache found');
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
            console.log(`Fresh menu loaded for ${canteenId} - ${date}`);
            return data;
        } catch (e) {
            console.log('Menu API call failed, trying cache...');
            if (cached) {
                console.log('Fallback menu cache found');
                return JSON.parse(cached);
            }
            throw e;
        }
    } else {
        if (cached) {
            console.log('Menu cache found (offline)');
            return JSON.parse(cached);
        }
        throw new Error('Keine Internetverbindung und keine gecachten Menüdaten');
    }
}

export async function fetchMealsWithCache(): Promise<any> {
    const online = await isOnline();
    console.log('fetchMealsWithCache - Online:', online);

    if (online) {
        try {
            const data = await fetchMeals();
            await AsyncStorage.setItem(CACHE_KEYS.meals, JSON.stringify(data));
            await updateLastConnectionTime();
            console.log('Fresh meals loaded from API');
            return data;
        } catch (e) {
            console.log('Meals API call failed, trying cache...');
            const cached = await AsyncStorage.getItem(CACHE_KEYS.meals);
            if (cached) {
                console.log('Fallback meals cache found');
                return JSON.parse(cached);
            }
            throw e;
        }
    } else {
        console.log('Loading meals from cache (offline)');
        const cached = await AsyncStorage.getItem(CACHE_KEYS.meals);
        if (cached) {
            console.log('Meals cache found, returning data');
            return JSON.parse(cached);
        }
        console.log('No meals cache found');
        throw new Error('Keine Internetverbindung und keine gecachten Mahlzeiten');
    }
}

export async function fetchAdditivesWithCache(): Promise<any> {
    const online = await isOnline();
    console.log('fetchAdditivesWithCache - Online:', online);

    if (online) {
        try {
            const data = await fetchAdditives();
            await AsyncStorage.setItem(CACHE_KEYS.additives, JSON.stringify(data));
            await updateLastConnectionTime();
            console.log('Fresh additives loaded from API');
            return data;
        } catch (e) {
            console.log('Additives API call failed, trying cache...');
            const cached = await AsyncStorage.getItem(CACHE_KEYS.additives);
            if (cached) {
                console.log('Fallback additives cache found');
                return JSON.parse(cached);
            }
            throw e;
        }
    } else {
        console.log('Loading additives from cache (offline)');
        const cached = await AsyncStorage.getItem(CACHE_KEYS.additives);
        if (cached) {
            console.log('Additives cache found, returning data');
            return JSON.parse(cached);
        }
        console.log('No additives cache found');
        throw new Error('Keine Internetverbindung und keine gecachten Zusatzstoff-Daten');
    }
}

export async function fetchBadgesWithCache(): Promise<any> {
    const online = await isOnline();
    console.log('fetchBadgesWithCache - Online:', online);

    if (online) {
        try {
            const data = await fetchBadges();
            await AsyncStorage.setItem(CACHE_KEYS.badges, JSON.stringify(data));
            await updateLastConnectionTime();
            console.log('Fresh badges loaded from API');
            return data;
        } catch (e) {
            console.log('Badges API call failed, trying cache...');
            const cached = await AsyncStorage.getItem(CACHE_KEYS.badges);
            if (cached) {
                console.log('Fallback badges cache found');
                return JSON.parse(cached);
            }
            throw e;
        }
    } else {
        console.log('Loading badges from cache (offline)');
        const cached = await AsyncStorage.getItem(CACHE_KEYS.badges);
        if (cached) {
            console.log('Badges cache found, returning data');
            return JSON.parse(cached);
        }
        console.log('No badges cache found');
        throw new Error('Keine Internetverbindung und keine gecachten Badge-Daten');
    }
}

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

    try {
        await fetchAdditivesWithCache();
        success = true;
    } catch (error) {
        errors.push('Zusatzstoffe konnten nicht aktualisiert werden');
    }

    try {
        await fetchBadgesWithCache();
        success = true;
    } catch (error) {
        errors.push('Badges konnten nicht aktualisiert werden');
    }

    return { success, errors };
}

export async function clearApiCache(): Promise<void> {
    try {
        const apiKeys = [
            CACHE_KEYS.canteens,
            CACHE_KEYS.meals,
            CACHE_KEYS.badges,
            CACHE_KEYS.additives
        ];

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

// ===== MENÜ-PRELOAD FUNKTIONEN =====
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

// ===== USERNAME FUNKTIONEN =====
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

// ===== GESPEICHERTE MENSEN FUNKTIONEN =====
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

// ===== LIEBLINGSSPEISEN MIT KONTEXT =====
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

// ===== MENSA-AUSWAHL FUNKTIONEN =====
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

// ===== ESSENSVORLIEBEN FUNKTIONEN =====
export const getPreferences = async (): Promise<string[]> => {
    try {
        const preferences = await AsyncStorage.getItem(CACHE_KEYS.preferences);
        return preferences ? JSON.parse(preferences) : [];
    } catch (error) {
        console.error('Error getting preferences:', error);
        return [];
    }
};

export const storePreferences = async (preferences: string[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(CACHE_KEYS.preferences, JSON.stringify(preferences));
        console.log('Preferences saved:', preferences);
    } catch (error) {
        console.error('Error storing preferences:', error);
    }
};

export const addPreference = async (preference: string): Promise<boolean> => {
    try {
        const currentPrefs = await getPreferences();

        if (!currentPrefs.includes(preference)) {
            const updatedPrefs = [...currentPrefs, preference];
            await storePreferences(updatedPrefs);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error adding preference:', error);
        return false;
    }
};

export const removePreference = async (preference: string): Promise<boolean> => {
    try {
        const currentPrefs = await getPreferences();
        const updatedPrefs = currentPrefs.filter(pref => pref !== preference);
        await storePreferences(updatedPrefs);
        return true;
    } catch (error) {
        console.error('Error removing preference:', error);
        return false;
    }
};

export const hasPreference = async (preference: string): Promise<boolean> => {
    try {
        const preferences = await getPreferences();
        return preferences.includes(preference);
    } catch (error) {
        console.error('Error checking preference:', error);
        return false;
    }
};

// Migration für Präferenzen
export const migratePreferencesToFinalFormat = async (): Promise<void> => {
    try {
        const rawPrefs = await AsyncStorage.getItem(CACHE_KEYS.preferences);

        if (!rawPrefs) {
            console.log('Keine Präferenzen gefunden - Migration übersprungen');
            return;
        }

        const parsed = JSON.parse(rawPrefs);
        let arrayPrefs: string[] = [];

        // Object → Array (falls nötig)
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            console.log('Object → Array Migration...');

            const keyMapping: { [key: string]: string } = {
                'vegetarian': 'vegetarisch',
                'vegan': 'vegan',
                'glutenfree': 'glutenfrei',
                'lactosefree': 'laktosefrei',
                'fisch': 'fisch',
                'scharf': 'scharf'
            };

            for (const [oldKey, isActive] of Object.entries(parsed)) {
                if (isActive === true) {
                    const newKey = keyMapping[oldKey] || oldKey;
                    arrayPrefs.push(newKey);
                }
            }

            console.log('Object zu Array:', arrayPrefs);
        } else if (Array.isArray(parsed)) {
            arrayPrefs = parsed;
            console.log('Bereits Array-Format:', arrayPrefs);
        }

        // Array → finale saubere Badges
        console.log('Bereinige zu echten API-Badges...');

        const finalPrefs: string[] = [];
        const removedPrefs: string[] = [];

        arrayPrefs.forEach(pref => {
            const prefLower = pref.toLowerCase();

            switch (prefLower) {
                case 'vegetarisch':
                    finalPrefs.push('vegetarisch');
                    break;
                case 'vegan':
                    finalPrefs.push('vegan');
                    break;
                case 'klimaessen':
                    finalPrefs.push('klimaessen');
                    break;
                case 'fairtrade':
                    finalPrefs.push('fairtrade');
                    break;
                case 'nachhaltig':
                    finalPrefs.push('nachhaltig');
                    break;
                case 'fisch_nachhaltig':
                    finalPrefs.push('fisch_nachhaltig');
                    break;
                default:
                    removedPrefs.push(pref);
                    break;
            }
        });

        await storePreferences(finalPrefs);

        console.log('Finale Migration abgeschlossen:', {
            eingabe: parsed,
            zwischenschritt: arrayPrefs,
            finale_prefs: finalPrefs,
            entfernt: removedPrefs
        });

        if (removedPrefs.length > 0) {
            console.log(`${removedPrefs.length} veraltete Präferenzen entfernt: ${removedPrefs.join(', ')}`);
        }

    } catch (error) {
        console.error('Migration fehlgeschlagen:', error);
        await storePreferences([]);
    }
};

export const getPreferencesWithMigration = async (): Promise<string[]> => {
    try {
        await migratePreferencesToFinalFormat();
        return await getPreferences();
    } catch (error) {
        console.error('Error getting preferences with migration:', error);
        return [];
    }
};