// hooks/useFavoriteMeals.ts
import { useState, useEffect, useCallback } from 'react';
import {
    getFavoriteMealsWithContext,
    addMealToFavoritesWithContext,
    removeMealFromFavoritesWithContext,
    isMealFavoriteWithContext,
    getFavoriteCategories
} from '@/lib/storage';

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
    mensaId: string;
    mensaName: string;
    dateAdded: string;
    dayOfWeek: string;
    originalDate: string;
}

export const useFavoriteMeals = () => {
    const [favoriteMeals, setFavoriteMeals] = useState<FavoriteMealWithContext[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFavoriteMeals = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [meals, availableCategories] = await Promise.all([
                getFavoriteMealsWithContext(),
                getFavoriteCategories()
            ]);

            setFavoriteMeals(meals);
            setCategories(availableCategories);
        } catch (err) {
            setError('Fehler beim Laden der Lieblingsspeisen');
            console.error('Error loading favorite meals:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFavoriteMeals();
    }, [loadFavoriteMeals]);

    const addToFavorites = useCallback(async (
        meal: {
            id: string;
            name: string;
            category?: string;
            badges?: string[];
            additives?: string[];
            prices?: { students?: number; employees?: number; guests?: number; };
        },
        context: {
            mensaId: string;
            mensaName: string;
            originalDate: string;
        }
    ) => {
        try {
            const success = await addMealToFavoritesWithContext(meal, context);
            if (success) {
                await loadFavoriteMeals(); // Refresh data
            }
            return success;
        } catch (err) {
            console.error('Error adding to favorites:', err);
            return false;
        }
    }, [loadFavoriteMeals]);

    const removeFromFavorites = useCallback(async (mealId: string) => {
        try {
            const success = await removeMealFromFavoritesWithContext(mealId);
            if (success) {
                await loadFavoriteMeals(); // Refresh data
            }
            return success;
        } catch (err) {
            console.error('Error removing from favorites:', err);
            return false;
        }
    }, [loadFavoriteMeals]);

    const checkIsFavorite = useCallback(async (mealId: string) => {
        try {
            return await isMealFavoriteWithContext(mealId);
        } catch (err) {
            console.error('Error checking favorite status:', err);
            return false;
        }
    }, []);

    const getFavoritesByCategory = useCallback((category?: string) => {
        if (!category || category === 'all') {
            return favoriteMeals;
        }
        return favoriteMeals.filter(meal => meal.category === category);
    }, [favoriteMeals]);

    const getFavoritesByMensa = useCallback((mensaId?: string) => {
        if (!mensaId) {
            return favoriteMeals;
        }
        return favoriteMeals.filter(meal => meal.mensaId === mensaId);
    }, [favoriteMeals]);

    const searchFavorites = useCallback((query: string) => {
        if (!query.trim()) {
            return favoriteMeals;
        }

        const lowercaseQuery = query.toLowerCase();
        return favoriteMeals.filter(meal =>
            meal.name.toLowerCase().includes(lowercaseQuery) ||
            meal.mensaName.toLowerCase().includes(lowercaseQuery) ||
            meal.category?.toLowerCase().includes(lowercaseQuery)
        );
    }, [favoriteMeals]);

    return {
        favoriteMeals,
        categories,
        loading,
        error,
        addToFavorites,
        removeFromFavorites,
        checkIsFavorite,
        getFavoritesByCategory,
        getFavoritesByMensa,
        searchFavorites,
        refreshFavorites: loadFavoriteMeals,
    };
};