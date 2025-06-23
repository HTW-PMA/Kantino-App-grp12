import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, Platform} from 'react-native';
import { fetchMenuWithCache } from '@/lib/cache'; // or wherever your function is

export default function SpeiseplanScreen() {
    const [menuData, setMenuData] = useState<any>(null);

    useEffect(() => {
        async function testCache() {
            const canteenId = '655ff175136d3b580c970f81';
            const date = '2025-06-17';

            try {
                const menu = await fetchMenuWithCache(canteenId, date);
                setMenuData(menu); // store full data

                console.log('MENU DATA:', menu);
            } catch (e) {
                console.log('Error loading menu:', e);
                setMenuData({ error: String(e) });
            }
        }
        testCache();
    }, []);




    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 10 }}>
            <Text selectable style={{ fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                {menuData ? JSON.stringify(menuData, null, 2) : 'Lade Menüdaten...'}
            </Text>
        </ScrollView>
    );
}
