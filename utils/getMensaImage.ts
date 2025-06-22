export const getMensaImage = (id: string) => {
    const mapping: Record<string, any> = {
        '655ff175136d3b580c970f7b': require('@/assets/images/mensen/MensaASHBerlinHellersdorf.jpg'),
        // Weitere Mensa-Bilder hier hinzufügen
    };

    // Fallback-Bild, falls keine ID zugewiesen ist
    return mapping[id] || require('@/assets/images/cafeteria.png');
};