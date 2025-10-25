# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt-Übersicht

**AI Tag Manager** ist eine Thunderbird WebExtension, die künstliche Intelligenz nutzt, um E-Mail-Tags automatisch zu verwalten, ähnliche Tags zusammenzuführen und Tag-Namen zu optimieren.

## Wichtige Befehle

### Build & Package
```bash
# Erstelle installierbare .xpi-Datei
./build.sh

# Output: ai-tag-manager-v{VERSION}.xpi
```

### Entwicklung & Testing
```bash
# In Thunderbird laden (Debug-Modus):
# 1. about:debugging öffnen
# 2. "Diesen Thunderbird" → "Temporäres Add-on laden"
# 3. manifest.json auswählen

# Browser Console für Logs
# Strg+Shift+J in Thunderbird

# Test-Anfrage in Console
browser.runtime.sendMessage({action: 'analyzeTags'}).then(console.log)
```

### Icon-Generierung
```bash
# Aus SVG neue PNG-Icons erstellen
cd icons
for size in 16 32 48 64 128; do
  convert icon.svg -resize ${size}x${size} icon-${size}.png
done
```

## Technologie-Stack

- **Platform**: Thunderbird WebExtensions API (Manifest V2)
- **APIs**:
  - `messenger.messages` - E-Mail- und Tag-Zugriff
  - `browser.storage.local` - Einstellungsspeicherung
  - `browser.runtime` - Messaging zwischen Komponenten
- **KI-Integration**: OpenAI, Anthropic (Claude), Google AI (Gemini), Ollama
- **Frontend**: Vanilla JavaScript, HTML5, CSS3

## Architektur

### Hauptkomponenten

1. **Background Script** (`scripts/background.js`)
   - Zentrale Logik für Tag-Management
   - Message Handler für Kommunikation mit UI
   - Tag-Analyse und -Verarbeitung
   - Rekursive Ordner-Traversierung für Tag-Zählung

2. **KI-Integration** (`scripts/aiIntegration.js`)
   - Modulare Unterstützung für verschiedene KI-Anbieter
   - Export-Funktionen: `findSimilarTags()`, `suggestTagNames()`, `categorizeTags()`
   - Einheitliche API-Abstraktion für alle Provider

3. **Popup UI** (`popup/popup.html`, `popup.js`)
   - Haupt-Interface für Benutzerinteraktionen
   - Tag-Statistiken und schnelle Aktionen
   - Asynchrone Kommunikation mit Background Script
   - Öffnet Results-Seite für KI-Vorschläge

4. **Results/Vorschau-Seite** (`results/results.html`, `results.js`)
   - Interaktive Anzeige von KI-Vorschlägen
   - Benutzer kann einzelne Vorschläge auswählen/abwählen
   - Zeigt Vorschau der Änderungen (Alt → Neu)
   - Wendet nur ausgewählte Änderungen an
   - Unterstützt drei Modi: ähnliche Tags, Umbenennungen, Kategorisierung

5. **Einstellungsseite** (`options/options.html`, `options.js`)
   - Konfiguration von API-Keys und Provider
   - Dynamische Anzeige provider-spezifischer Einstellungen
   - Persistierung in `browser.storage.local`

## Thunderbird-spezifische APIs

### Tag-Verwaltung

```javascript
// Tags auflisten
const tags = await messenger.messages.listTags();

// Tags einer Nachricht ändern
await messenger.messages.update(messageId, { tags: ['tag1', 'tag2'] });

// Account-Struktur
const accounts = await messenger.accounts.list();
// accounts[].folders[].subFolders - rekursive Struktur
```

### Wichtige Berechtigungen (manifest.json)

- `messagesRead` - Lesen von E-Mail-Metadaten
- `messagesTags` - Zugriff auf Tag-System
- `storage` - Speichern von Einstellungen

## Entwicklungs-Workflows

### Neue KI-Anbieter hinzufügen

1. Füge neue `case` in `aiIntegration.js:callAI()` hinzu
2. Implementiere Provider-spezifische Funktion (z.B. `callNewProvider()`)
3. Erweitere `options.html` um neue Provider-Einstellungen
4. Füge Provider zu `<select id="aiProvider">` hinzu

### Message-Passing Pattern

```javascript
// Von UI zu Background
const response = await browser.runtime.sendMessage({
  action: 'analyzeTags',
  data: {...}
});

// Im Background Script
browser.runtime.onMessage.addListener(async (message) => {
  switch (message.action) {
    case 'analyzeTags':
      return handleAnalyzeTags();
  }
});
```

## KI-Prompt-Struktur

Alle KI-Funktionen verwenden strukturierte Prompts mit:
- Klare Rollenbe definition
- JSON-Format für Antworten
- Explizite Anweisungen ("Nur JSON ausgeben")
- `temperature: 0.3` für konsistente Ergebnisse

## Besonderheiten

### Rekursive Ordner-Verarbeitung

Thunderbird hat eine hierarchische Ordnerstruktur (`folder.subFolders`). Alle Tag-Operationen müssen rekursiv alle Unterordner durchlaufen:

```javascript
async function processFolder(folder) {
  // Verarbeite Nachrichten in diesem Ordner
  const messages = await messenger.messages.list(folder);

  // Rekursiv in Unterordnern
  if (folder.subFolders) {
    for (const sub of folder.subFolders) {
      await processFolder(sub);
    }
  }
}
```

### ES6 Modules

Das Projekt verwendet ES6 Module (`import/export`). Background Script lädt Module dynamisch:

```javascript
const aiModule = await import('./aiIntegration.js');
```

### Fehlerbehandlung

Alle API-Calls sollten try-catch verwenden und benutzerfreundliche Fehlermeldungen zurückgeben:

```javascript
try {
  // Operation
  return { success: true, data: result };
} catch (error) {
  console.error('Context:', error);
  return { error: error.message };
}
```

## Sicherheit & Datenschutz

- API-Keys werden **nur lokal** in `browser.storage.local` gespeichert
- Niemals API-Keys in Console-Logs ausgeben
- Nur Tag-Namen (keine E-Mail-Inhalte) werden an KI-APIs gesendet
- Ollama-Option für vollständig lokale Ausführung

## Häufige Aufgaben

### Tag-Namen ändern

```javascript
// 1. Finde alle Nachrichten mit altem Tag
// 2. Für jede Nachricht:
const newTags = message.tags.map(t =>
  t === oldTag ? newTag : t
);
await messenger.messages.update(message.id, { tags: newTags });
```

### Neue KI-Funktion hinzufügen

1. Erstelle Export-Funktion in `aiIntegration.js`
2. Füge Message-Handler in `background.js` hinzu (falls nötig)
3. Erstelle UI-Button in `popup.html`
4. Implementiere Event-Handler in `popup.js`
5. Füge Anzeigelogik in `results.js` hinzu (für interaktive Vorschau)

### Vorschläge-Flow

Der Workflow für KI-Vorschläge funktioniert so:

1. **Popup** → Benutzer klickt auf KI-Funktion (z.B. "Ähnliche Tags finden")
2. **KI-API** → Generiert Vorschläge via `aiIntegration.js`
3. **Storage** → Vorschläge werden in `browser.storage.local` als `pendingSuggestions` gespeichert
4. **Results Tab** → Öffnet sich automatisch und lädt `pendingSuggestions`
5. **Benutzerauswahl** → User wählt gewünschte Vorschläge aus (Checkboxen)
6. **Anwenden** → Nur ausgewählte Vorschläge werden via `mergeTags` angewendet
7. **Cleanup** → `pendingSuggestions` wird aus Storage entfernt

```javascript
// Beispiel: Vorschläge speichern und öffnen
await browser.storage.local.set({
  pendingSuggestions: {
    type: 'similar',  // oder 'rename', 'categorize'
    suggestions: [...] // KI-Ergebnisse
  }
});
await browser.tabs.create({
  url: browser.runtime.getURL('results/results.html')
});
```

## Manifest V2 Besonderheiten

Thunderbird nutzt noch Manifest V2:
- `browser.` API (nicht `chrome.`)
- `background.scripts` statt Service Workers
- `browser_action` für Toolbar-Button
- `applications.gecko` für Thunderbird-spezifische Metadaten

## Ollama-Integration

Für lokale KI ohne Cloud:
```bash
# Ollama installieren
curl -fsSL https://ollama.ai/install.sh | sh

# Modell laden
ollama pull llama3.2

# API läuft auf
http://localhost:11434/api/generate
```

## Code-Stil

- Deutsche Kommentare für bessere Lesbarkeit
- Async/await bevorzugt über Promises
- Klare Funktionsnamen (z.B. `handleAnalyzeTags()`)
- Fehler-First-Pattern bei Responses (`{ success: true, data }` oder `{ error: message }`)
- ESLint/Prettier werden nicht verwendet (optional hinzufügbar)

## Spezielle Kontexte

### Beyond All Reason Spiel-Erkennung
Wenn der Benutzer über das Spiel "Beyond All Reason" spricht, erkenne dies als Gaming-Kontext und passe die Antworten entsprechend an.
