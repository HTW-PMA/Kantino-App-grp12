import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
    storeName,
    getName,
    storeSelectedMensa,
    getSelectedMensa,
    getPreferencesWithMigration,
    storePreferences,
} from "@/lib/storage";
import LocationPicker from "@/components/profil/LocationPicker";

// Essensvorlieben
const PREFERENCES = [
    { key: "vegetarisch", icon: "🥬", label: "Vegetarisch" },
    { key: "vegan", icon: "🌱", label: "Vegan" },
    { key: "klimaessen", icon: "🌍", label: "Klimaessen" },
    { key: "fairtrade", icon: "🤝", label: "Fairtrade" },
    { key: "nachhaltig", icon: "♻️", label: "Nachhaltige Landwirtschaft" },
    { key: "fisch_nachhaltig", icon: "🐟", label: "Nachhaltiger Fisch" },
];

export default function ProfileScreen() {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [prefs, setPrefs] = useState<string[]>([]);
    const [saveStatus, setSaveStatus] = useState("");

    const isDataLoaded = useRef(false);

    // Initialdaten laden - NUR EINMAL beim ersten Mount
    useEffect(() => {
        if (!isDataLoaded.current) {
            loadInitialData();
        }
    }, []);

    // Screen Focus - lade Daten IMMER neu (außer direkt nach dem Speichern)
    useFocusEffect(
        React.useCallback(() => {
            // Lade nur nicht neu, wenn gerade gespeichert wurde
            if (saveStatus !== 'saved') {
                loadInitialData();
            }
        }, [saveStatus])
    );

    const loadInitialData = async () => {
        try {
            const storedName = await getName();
            const storedMensa = await getSelectedMensa();
            const storedPrefs = await getPreferencesWithMigration();

            // Filtere nur gültige Präferenzen
            const validPrefKeys = PREFERENCES.map(p => p.key);
            const cleanedPrefs = Array.isArray(storedPrefs)
                ? storedPrefs.filter(pref => validPrefKeys.includes(pref))
                : [];

            // Falls veraltete Präferenzen gefunden wurden, speichere bereinigte Version
            if (Array.isArray(storedPrefs) && cleanedPrefs.length !== storedPrefs.length) {
                const removedPrefs = storedPrefs.filter(pref => !validPrefKeys.includes(pref));
                console.log('Veraltete Präferenzen entfernt:', removedPrefs);
                console.log('Gültige Präferenzen behalten:', cleanedPrefs);

                // Speichere bereinigte Präferenzen zurück in AsyncStorage
                await storePreferences(cleanedPrefs);
            }

            setName(storedName || "");
            setLocation(storedMensa || "");
            setPrefs(cleanedPrefs);

            isDataLoaded.current = true;

            console.log('Profildaten neu geladen aus Storage:', {
                storedName,
                storedMensa,
                originalPrefs: storedPrefs,
                cleanedPrefs: cleanedPrefs,
            });
        } catch (error) {
            console.error("Fehler beim Laden der Profildaten:", error);
            setPrefs([]);
        }
    };

    const handleSave = async () => {
        setSaveStatus("saving");
        try {
            await Promise.all([
                name.trim() ? storeName(name.trim()) : Promise.resolve(),
                location ? storeSelectedMensa(location) : Promise.resolve(),
                storePreferences(prefs),
            ]);

            console.log('Profil gespeichert:', { name, location, prefs });

            setSaveStatus("saved");
            // Nach 1,5 Sekunden Status zurücksetzen, damit beim nächsten Tab-Wechsel wieder geladen wird
            setTimeout(() => setSaveStatus(""), 1500);
        } catch (error) {
            console.error("Fehler beim Speichern:", error);
            setSaveStatus("error");
            setTimeout(() => setSaveStatus(""), 2000);
        }
    };

    const togglePreference = (prefKey: string) => {
        setPrefs(prev => {
            if (!Array.isArray(prev)) {
                console.warn('Prefs is not an array, resetting:', prev);
                return [prefKey];
            }

            return prev.includes(prefKey)
                ? prev.filter(k => k !== prefKey)
                : [...prev, prefKey];
        });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.content}>

                {/* Simple Avatar Section */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarCircle}>
                        <Image
                            source={require("@/assets/images/profil.png")}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={styles.title}>Mein Profil</Text>
                </View>

                {/* Name Input */}
                <View style={styles.section}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Dein Name"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor="#999"
                    />
                </View>

                {/* Mensa Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Lieblings-Mensa</Text>
                    <LocationPicker value={location} onChange={setLocation} />
                </View>

                {/* Preferences */}
                <View style={styles.section}>
                    <Text style={styles.label}>Essensvorlieben</Text>
                    <View style={styles.prefsContainer}>
                        {PREFERENCES.map((pref) => (
                            <TouchableOpacity
                                key={pref.key}
                                style={[
                                    styles.prefChip,
                                    Array.isArray(prefs) && prefs.includes(pref.key) && styles.prefChipActive
                                ]}
                                onPress={() => togglePreference(pref.key)}
                            >
                                <Text style={styles.prefIcon}>{pref.icon}</Text>
                                <Text style={[
                                    styles.prefLabel,
                                    Array.isArray(prefs) && prefs.includes(pref.key) && styles.prefLabelActive
                                ]}>
                                    {pref.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Info Text statt Notizen-Feld */}
                <View style={styles.section}>
                    <Text style={styles.infoText}>
                        💡 Der Chatbot berücksichtigt deine Essensvorlieben automatisch bei Empfehlungen.
                    </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        saveStatus === "saving" && styles.saveButtonSaving,
                        saveStatus === "saved" && styles.saveButtonSaved,
                        saveStatus === "error" && styles.saveButtonError,
                    ]}
                    onPress={handleSave}
                    disabled={saveStatus === "saving"}
                >
                    <Text style={styles.saveButtonText}>
                        {saveStatus === "saving" ? "Speichere..." :
                            saveStatus === "saved" ? "✓ Gespeichert" :
                                saveStatus === "error" ? "✗ Fehler" :
                                    "Speichern"}
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    content: {
        padding: 24,
        alignItems: "center",
    },

    // Avatar Section - Simple & Clean
    avatarContainer: {
        alignItems: "center",
        marginBottom: 30,
    },
    avatarCircle: {
        backgroundColor: "#e0f2e9",
        borderRadius: 50,
        width: 80,
        height: 80,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        tintColor: "#67b32d",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
    },

    // Form Sections
    section: {
        width: "100%",
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: "#fafafa",
    },

    // Preferences - Clean Chips
    prefsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    prefChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    prefChipActive: {
        backgroundColor: "#e8f5e8",
        borderColor: "#67b32d",
    },
    prefIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    prefLabel: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },
    prefLabelActive: {
        color: "#67b32d",
        fontWeight: "600",
    },

    // Info Text statt Notizen
    infoText: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        fontStyle: "italic",
        padding: 16,
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
    },

    // Save Button
    saveButton: {
        backgroundColor: "#67b32d",
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
        width: "100%",
    },
    saveButtonSaving: {
        backgroundColor: "#94a3b8",
    },
    saveButtonSaved: {
        backgroundColor: "#662b60",
    },
    saveButtonError: {
        backgroundColor: "#ef4444",
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});