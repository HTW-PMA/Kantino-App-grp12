import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { preloadAllMenus, cleanupOldMenus } from '@/lib/storage';

export default function RootLayout() {
  useEffect(() => {
    preloadAllMenus();
    cleanupOldMenus();
  }, []);

  return <Slot />;
}
