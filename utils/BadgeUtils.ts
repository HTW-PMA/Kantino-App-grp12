// utils/BadgeUtils.ts

/**
 * Whitelist der Badge-Namen, die im UI erlaubt sind
 */
export const ALLOWED_BADGE_NAMES = [
    'grüner ampelpunkt',
    'gelber ampelpunkt',
    'roter ampelpunkt',
    'vegan',
    'fairtrade',
    'klimaessen',
    'vegetarisch',
    'nachhaltige landwirtschaft',
    'nachhaltige fischerei'
];

/**
 * Gibt zurück, ob ein Badge erlaubt/anzeigbar ist
 */
export function isAllowedBadge(name: string): boolean {
    return ALLOWED_BADGE_NAMES.includes(name.toLowerCase());
}

export function isSystemBadge(name: string): boolean {
    const lower = name.toLowerCase();
    return lower.includes('co2_bewertung') || lower.includes('h2o_bewertung');
}

// Alle Badge-Namen
/**
Grüner Ampelpunkt
Gelber Ampelpunkt
Roter Ampelpunkt
Vegan
Fairtrade
Klimaessen
Vegetarisch
Nachhaltige Landwirtschaft
Nachhaltige Fischerei
CO2_bewertung_A
CO2_bewertung_B
CO2_bewertung_C
H2O_bewertung_A
H2O_bewertung_B
H2O_bewertung_C
*/

// Allergene und Zusatzstoffe
/**
 Schweinefleisch bzw. mit Gelatine vom Schwein
 Alkohol
 Geschmacksverstärker
 gewachst
 konserviert
 Antioxidationsmittel
 Farbstoff
 Phosphat
 geschwärzt
 enthält eine Phenylalaninquelle
 Süßungsmittel
 mit zum Teil fein zerkleinertem Fleischanteil
 koffeinhaltig
 chininhaltig
 geschwefelt
 kann abführend wirken
 Glutenhaltiges Getreide
 Weizen
 Roggen
 Gerste
 Hafer
 Dinkel
 Kamut
 Krebstiere
 Eier
 Fisch
 Erdnüsse
 Schalenfrüchte
 Mandeln
 Haselnuss
 Walnuss
 Kaschunuss
 Pacannuss
 Paranuss
 Pistazie
 Macadamia
 Sellerie
 Soja
 Senf
 Milch und Milchprodukte (inkl. Laktose)
 Sesam
 Schwefeldioxid und Sulfide
 Lupine
 Weichtiere
 Nitritpökelsalz
 Hefe
 */