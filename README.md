# Kantino - Mensa App Berlin

Eine React Native App für Berliner Mensen und Cafeterias.

## Autoren
Béla von Wangenheim  
Nouran Alhabash  
Marlies Sami Alexandra Nelle  
Mirav Ahmad  

## Features

* Übersicht aller Berliner Mensen und Cafeterias
* Aktuelle Speisepläne anzeigen
* Lieblings-Mensen und -Gerichte speichern
   - Erweiterte Suchfunktion nach Gerichten, Kategorien und Mensen
* Navigation zu Mensen via Google Maps
* Intelligenter AI-Chatbot (Beta) für Essens-Empfehlungen & Fragen zu Mensen
   - Berücksichtigt Nutzerpräferenzen (z.B. vegan, fairtrade)
   - Kann tagesaktuelle Empfehlungen und Preisinformationen liefern
   - Versteht natürliche Sprache (z.B. „Was ist heute vegetarisch?“)
* Offline-Funktionalität mit automatischem Caching für Speisepläne & Mensen

## Tech Stack

* React Native 0.79.3
* Expo SDK 53
* TypeScript
* AsyncStorage für lokale Datenspeicherung
* NetInfo für Offline-Support

## Installation

1. **Dependencies installieren**
   ```bash
   npm install
   ```

2. **App starten**
   ```bash
   npx expo start --clear
   ```

3. **App öffnen**
   - Expo Go App (QR-Code scannen)
   - Android Emulator
   - iOS Simulator

## Screenshots
### Startseite
<img src="assets/images/App/Startseite.png" alt="Startseite" width="300"/>

### Mensenübersicht
<img src="assets/images/App/Mensenübersicht1.png" alt="Mensenübersicht" width="300"/>

### Mensenübersicht - Details
<img src="assets/images/App/Mensenübersicht2.png" alt="Mensenübersicht - Details" width="300"/>

### Speiseplan
<img src="assets/images/App/Speiseplan.png" alt="Speiseplan" width="300"/>

### Saved - Mensen
<img src="assets/images/App/SavedMensen.png" alt="Saved - Mensen" width="300"/>

### Saved - Gerichte
<img src="assets/images/App/SavedGerichte.png" alt="Saved - Gerichte" width="300"/>

### AI-Chatbot
<img src="assets/images/App/AIChatbot.png" alt="AI-Chatbot" width="300"/>

### Profil
<img src="assets/images/App/Profil.png" alt="Profil" width="300"/>

---

*Entwickelt mit Expo und React Native*