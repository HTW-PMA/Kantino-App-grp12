// lib/network.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React from 'react';

const NETWORK_CACHE_KEYS = {
    lastConnection: 'lastSuccessfulConnection',
    dataTimestamp: 'dataTimestamp'
};

// Schwellenwerte für veraltete Daten (in Millisekunden)
const STALE_DATA_THRESHOLD = 24 * 60 * 60 * 1000; // 24 Stunden
const CRITICAL_STALE_THRESHOLD = 72 * 60 * 60 * 1000; // 72 Stunden

/**
 * Prüft ob eine Internetverbindung besteht
 */
export async function isOnline(): Promise<boolean> {
    try {
        const netInfo = await NetInfo.fetch();
        return netInfo.isConnected && netInfo.isInternetReachable;
    } catch (error) {
        console.error('Error checking network status:', error);
        return false;
    }
}

/**
 * Testet die Internetverbindung mit einem HTTP-Request
 */
export async function testConnection(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://www.google.com/favicon.ico', {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache'
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            await updateLastConnectionTime();
            return true;
        }

        return false;
    } catch (error) {
        console.log('Connection test failed:', error);
        return false;
    }
}

/**
 * Speichert den Zeitpunkt der letzten erfolgreichen Verbindung
 */
export async function updateLastConnectionTime(): Promise<void> {
    try {
        const now = new Date().toISOString();
        await AsyncStorage.setItem(NETWORK_CACHE_KEYS.lastConnection, now);
        await AsyncStorage.setItem(NETWORK_CACHE_KEYS.dataTimestamp, now);
    } catch (error) {
        console.error('Error updating connection time:', error);
    }
}

/**
 * Holt den Zeitpunkt der letzten erfolgreichen Verbindung
 */
export async function getLastConnectionTime(): Promise<Date | null> {
    try {
        const timestamp = await AsyncStorage.getItem(NETWORK_CACHE_KEYS.lastConnection);
        return timestamp ? new Date(timestamp) : null;
    } catch (error) {
        console.error('Error getting last connection time:', error);
        return null;
    }
}

/**
 * Prüft ob die Daten veraltet sind (>24h)
 */
export async function isDataStale(): Promise<boolean> {
    try {
        const lastConnection = await getLastConnectionTime();
        if (!lastConnection) return true;

        const now = new Date();
        const timeSinceLastConnection = now.getTime() - lastConnection.getTime();

        return timeSinceLastConnection > STALE_DATA_THRESHOLD;
    } catch (error) {
        console.error('Error checking if data is stale:', error);
        return true;
    }
}

/**
 * Prüft ob die Daten kritisch veraltet sind (>72h)
 */
export async function isDataCriticallyStale(): Promise<boolean> {
    try {
        const lastConnection = await getLastConnectionTime();
        if (!lastConnection) return true;

        const now = new Date();
        const timeSinceLastConnection = now.getTime() - lastConnection.getTime();

        return timeSinceLastConnection > CRITICAL_STALE_THRESHOLD;
    } catch (error) {
        console.error('Error checking if data is critically stale:', error);
        return true;
    }
}

/**
 * Hook für Network-Status-Monitoring
 */
export function useNetworkStatus() {
    const [isConnected, setIsConnected] = React.useState(true);
    const [isStale, setIsStale] = React.useState(false);

    React.useEffect(() => {
        // Initiale Prüfung
        const checkInitialStatus = async () => {
            const online = await isOnline();
            const stale = await isDataStale();
            setIsConnected(online);
            setIsStale(stale);
        };

        checkInitialStatus();

        // Netzwerk-Listener
        const unsubscribe = NetInfo.addEventListener(state => {
            const connected = state.isConnected && state.isInternetReachable;
            setIsConnected(connected);

            if (connected) {
                updateLastConnectionTime();
                setIsStale(false);
            }
        });

        return unsubscribe;
    }, []);

    return { isConnected, isStale };
}