import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { preloadAllMenus, cleanupOldMenus } from '@/lib/storage';

export default function RootLayout() {
  useEffect(() => {
    preloadAllMenus();      // Nur Menüs für heute laden
    cleanupOldMenus();      // Ältere Menüs löschen
  }, []);

  return <Slot />;
}
