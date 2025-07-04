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