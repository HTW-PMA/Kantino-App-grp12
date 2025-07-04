// components/speiseplan/BadgeLegend.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface BadgeInfo {
    visual: any; // Image require() oder Emoji string
    name: string;
    description: string;
    type: 'image' | 'emoji';
}

const BADGE_INFO: BadgeInfo[] = [
    // Ernährungs-Badges
    {
        visual: require('@/assets/images/speiseplan/vegan.png'),
        name: 'Vegan',
        description: 'Rein pflanzliche Zutaten',
        type: 'image'
    },
    {
        visual: require('@/assets/images/speiseplan/bio.png'),
        name: 'Vegetarisch',
        description: 'Ohne Fleisch und Fisch',
        type: 'image'
    },
    {
        visual: '🌍',
        name: 'Klimaessen',
        description: 'Klimafreundlich & nachhaltig',
        type: 'emoji'
    },
    {
        visual: '🤝',
        name: 'Fairtrade',
        description: 'Fair gehandelte Zutaten',
        type: 'emoji'
    },
    {
        visual: '♻️',
        name: 'Nachhaltige Landwirtschaft',
        description: 'Umweltschonend angebaut',
        type: 'emoji'
    },
    {
        visual: '🐟',
        name: 'Nachhaltige Fischerei',
        description: 'Umweltschonend gefischt',
        type: 'emoji'
    },

    // Nachhaltigkeits-Ampel
    {
        visual: '🟢',
        name: 'Grüner Ampelpunkt',
        description: 'Sehr nachhaltig - oft wählen',
        type: 'emoji'
    },
    {
        visual: '🟡',
        name: 'Gelber Ampelpunkt',
        description: 'Mäßig nachhaltig - gelegentlich',
        type: 'emoji'
    },
    {
        visual: '🔴',
        name: 'Roter Ampelpunkt',
        description: 'Wenig nachhaltig - selten wählen',
        type: 'emoji'
    },
];

interface BadgeLegendProps {
    isCollapsed?: boolean;
}

export default function BadgeLegend({ isCollapsed = true }: BadgeLegendProps) {
    const [collapsed, setCollapsed] = useState(isCollapsed);

    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={toggleCollapsed}
                activeOpacity={0.7}
            >
                <Text style={styles.title}>
                    🏷️ Badge-Legende
                </Text>
                <Text style={styles.toggleIcon}>
                    {collapsed ? '▼' : '▲'}
                </Text>
            </TouchableOpacity>

            {!collapsed && (
                <View style={styles.content}>
                    <Text style={styles.subtitle}>
                        Hier siehst du alle Symbole und ihre Bedeutung:
                    </Text>

                    <View style={styles.badgeGrid}>
                        {BADGE_INFO.map((badge, index) => (
                            <View key={index} style={styles.badgeItem}>
                                <View style={styles.badgeVisual}>
                                    {badge.type === 'emoji' ? (
                                        <Text style={styles.emoji}>{badge.visual}</Text>
                                    ) : (
                                        <Image
                                            source={badge.visual}
                                            style={styles.badgeImage}
                                            resizeMode="contain"
                                        />
                                    )}
                                </View>
                                <View style={styles.badgeText}>
                                    <Text style={styles.badgeName}>{badge.name}</Text>
                                    <Text style={styles.badgeDescription}>{badge.description}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.footerText}>
                        💡 Tipp: Kombiniere rote mit grünen Badges für eine ausgewogene Mahlzeit!
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginHorizontal: 10,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#e8f5e8',
        borderBottomWidth: collapsed ? 0 : 1,
        borderBottomColor: '#e9ecef',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d5a2d',
    },
    toggleIcon: {
        fontSize: 14,
        color: '#67b32d',
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    subtitle: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 16,
        textAlign: 'center',
        lineHeight: 20,
    },
    badgeGrid: {
        gap: 12,
    },
    badgeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    badgeVisual: {
        width: 36,
        height: 36,
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    badgeImage: {
        width: 24,
        height: 24,
    },
    emoji: {
        fontSize: 20,
    },
    badgeText: {
        flex: 1,
    },
    badgeName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    badgeDescription: {
        fontSize: 12,
        color: '#6c757d',
        lineHeight: 16,
    },
    footerText: {
        fontSize: 12,
        color: '#67b32d',
        textAlign: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        fontStyle: 'italic',
    },
});