# 🤖 AI Tag Manager für Thunderbird

Eine intelligente Thunderbird-Erweiterung, die künstliche Intelligenz nutzt, um deine E-Mail-Tags automatisch zu verwalten, zu optimieren und zu bereinigen.

## ✨ Features

### KI-gestützte Tag-Verwaltung
- **Ähnliche Tags finden**: Die KI analysiert deine Tags und findet ähnliche oder doppelte Tags (z.B. "Projekt", "Projekte", "project")
- **Tag-Namen verbessern**: Erhalte Vorschläge für konsistentere und klarere Tag-Namen
- **Automatische Kategorisierung**: Organisiere deine Tags in sinnvolle Kategorien (Projekte, Prioritäten, Status, etc.)
- **⭐ Interaktive Vorschläge**: Alle KI-Vorschläge werden in einer übersichtlichen Vorschau-Seite angezeigt - du entscheidest, welche angewendet werden!

### Tag-Management
- **Tag-Analyse**: Übersicht über alle Tags mit Verwendungsstatistiken
- **Tags zusammenführen**: Führe ähnliche Tags automatisch zusammen
- **Bereinigung**: Entferne ungenutzte Tags automatisch
- **Konsistenz**: Stelle einheitliche Namenskonventionen sicher

### Unterstützte KI-Anbieter
- **OpenAI** (GPT-4o, GPT-4o-mini, GPT-3.5)
- **Anthropic** (Claude 3.5 Sonnet, Claude 3.5 Haiku)
- **Google AI** (Gemini 1.5 Flash, Gemini 1.5 Pro)
- **Ollama** (lokal, kostenlos - llama3.2, mistral, gemma2, etc.)

## 📦 Installation

### Aus dem Quellcode

1. **Repository klonen oder herunterladen**
   ```bash
   git clone <repository-url>
   cd ai_tag_manager
   ```

2. **In Thunderbird installieren**
   - Öffne Thunderbird
   - Gehe zu `Menü` → `Add-ons und Themes` (oder drücke `Strg+Shift+A`)
   - Klicke auf das Zahnrad-Symbol ⚙️
   - Wähle `Add-on aus Datei installieren...`
   - Navigiere zum Ordner und wähle `manifest.json`

### Alternativ: Debug-Modus

Für Entwicklung und Testing:
1. Öffne `about:debugging` in Thunderbird
2. Klicke auf `Diesen Thunderbird`
3. Klicke auf `Temporäres Add-on laden...`
4. Wähle die `manifest.json` Datei

## 🚀 Erste Schritte

### 1. API-Schlüssel konfigurieren

Öffne die Einstellungen der Erweiterung:
- Klicke auf das AI Tag Manager Symbol in der Toolbar
- Wähle `⚙️ Einstellungen öffnen`

Wähle deinen bevorzugten KI-Anbieter und trage den API-Schlüssel ein:

#### OpenAI
- Registriere dich auf [platform.openai.com](https://platform.openai.com/)
- Erstelle einen API-Key unter [API Keys](https://platform.openai.com/api-keys)
- Empfohlenes Modell: `gpt-4o-mini` (günstig und schnell)

#### Anthropic (Claude)
- Registriere dich auf [console.anthropic.com](https://console.anthropic.com/)
- Erstelle einen API-Key
- Empfohlenes Modell: `claude-3-5-sonnet-20241022`

#### Google AI
- Erstelle einen API-Key auf [Google AI Studio](https://makersuite.google.com/app/apikey)
- Empfohlenes Modell: `gemini-1.5-flash`

#### Ollama (Lokal & Kostenlos!)
- Installiere [Ollama](https://ollama.ai)
- Führe aus: `ollama pull llama3.2`
- Keine API-Kosten! Läuft komplett lokal.

### 2. Tags analysieren

1. Klicke auf das AI Tag Manager Symbol
2. Klicke auf `📊 Tags analysieren`
3. Du siehst nun eine Übersicht deiner Tags

### 3. KI-Funktionen nutzen

#### Ähnliche Tags finden
- Klicke auf `🔍 Ähnliche Tags finden`
- Die KI analysiert deine Tags und schlägt Zusammenführungen vor
- **Vorschau-Seite öffnet sich**: Hier kannst du jeden Vorschlag einzeln prüfen
- Wähle aus, welche Vorschläge du anwenden möchtest
- Klicke "Ausgewählte anwenden" um die gewählten Änderungen durchzuführen

#### Tag-Namen verbessern
- Klicke auf `✨ Tag-Namen verbessern`
- Erhalte Vorschläge für konsistentere Namen
- **Interaktive Auswahl**: Wähle nur die Verbesserungen, die dir gefallen
- Z.B. "ToDo" → "todo", "WICHTIG" → "wichtig"

#### Tags kategorisieren
- Klicke auf `📁 Tags kategorisieren`
- Die KI sortiert deine Tags in sinnvolle Kategorien
- **Übersichtsansicht**: Informative Darstellung deiner organisierten Tags
- Hilft bei der Organisation großer Tag-Sammlungen

## ⚙️ Einstellungen

### Tag-Management Optionen

- **Automatisches Zusammenführen**: Tags werden nach Bestätigung automatisch zusammengeführt
- **Ähnlichkeitsschwelle**: Wie ähnlich Tags sein müssen (0.0 - 1.0)
- **Ungenutzte Tags entfernen**: Automatisches Löschen bei Bereinigung
- **Groß-/Kleinschreibung beachten**: Unterscheidung bei der Analyse

### Erweiterte Optionen

- **Max. Tags pro Analyse**: Begrenzung für sehr große Tag-Listen
- **Detailliertes Logging**: Für Debugging und Entwicklung

## 🔒 Datenschutz & Sicherheit

- **API-Keys werden nur lokal gespeichert** (in Thunderbird's Storage API)
- **Keine Datensammlung**: Diese Erweiterung sammelt keine Nutzerdaten
- **Tag-Inhalte werden an gewählte KI-API gesendet** (nur Tag-Namen, keine E-Mail-Inhalte!)
- **Ollama-Option**: Nutze KI komplett lokal ohne Cloud-Verbindung

## 🛠️ Entwicklung

### Projektstruktur

```
ai_tag_manager/
├── manifest.json           # Erweiterungs-Manifest
├── scripts/
│   ├── background.js       # Hintergrund-Logik
│   └── aiIntegration.js    # KI-API-Integration
├── popup/
│   ├── popup.html          # Popup-UI
│   └── popup.js            # Popup-Logik
├── results/                # ⭐ NEU
│   ├── results.html        # Vorschau-Seite für KI-Vorschläge
│   └── results.js          # Interaktive Auswahl-Logik
├── options/
│   ├── options.html        # Einstellungsseite
│   └── options.js          # Einstellungs-Logik
├── icons/                  # App-Icons
└── README.md
```

### Debugging

1. Öffne `about:debugging` in Thunderbird
2. Klicke auf die Erweiterung
3. Öffne die `Console` für Logs
4. Aktiviere "Detailliertes Logging" in den Einstellungen

### Logs anzeigen

```javascript
// In Browser Console (Strg+Shift+J)
browser.runtime.sendMessage({action: 'analyzeTags'})
  .then(console.log)
```

## 📝 Bekannte Einschränkungen

- **API-Kosten**: OpenAI, Anthropic und Google AI verursachen Kosten (nutze Ollama für kostenlose Alternative)
- **Rate Limits**: KI-APIs haben Anfrage-Limits
- **Tag-Limit**: Sehr große Tag-Listen (>100) können länger dauern
- **Thunderbird >= 91**: Benötigt Thunderbird Version 91 oder höher

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstelle einen Pull Request oder öffne ein Issue.

### Entwicklungsumgebung einrichten

```bash
# Klone das Repository
git clone <repository-url>
cd ai_tag_manager

# In Thunderbird laden (about:debugging)
```

## 📄 Lizenz

MIT License - siehe LICENSE Datei

## 🆘 Support

Bei Fragen oder Problemen:
1. Prüfe die [FAQ](#faq)
2. Öffne ein Issue auf GitHub
3. Aktiviere "Detailliertes Logging" für Debug-Informationen

## ❓ FAQ

### Warum findet die KI keine ähnlichen Tags?

- Deine Tags sind möglicherweise bereits sehr gut organisiert
- Versuche die Ähnlichkeitsschwelle zu reduzieren
- Stelle sicher, dass der API-Key korrekt ist

### Werden meine E-Mails an die KI gesendet?

Nein! Nur die **Tag-Namen** werden analysiert, niemals E-Mail-Inhalte.

### Kann ich die Erweiterung ohne Internet nutzen?

Ja, mit **Ollama**! Installiere Ollama lokal und alle KI-Funktionen laufen offline.

### Wie viel kostet die Nutzung?

- **Ollama**: Kostenlos (lokal)
- **OpenAI**: ~$0.001 pro Anfrage (gpt-4o-mini)
- **Anthropic**: ~$0.003 pro Anfrage (Claude 3.5 Haiku)
- **Google**: Kostenlos (mit Limits), dann ~$0.001 pro Anfrage

### Welcher KI-Anbieter ist am besten?

- **Für Kosten**: Ollama (kostenlos) oder OpenAI gpt-4o-mini
- **Für Qualität**: Claude 3.5 Sonnet oder GPT-4o
- **Für Datenschutz**: Ollama (komplett lokal)

## 🎯 Roadmap

- [ ] Batch-Verarbeitung für große Tag-Listen
- [ ] Undo/Redo für Tag-Änderungen
- [ ] Tag-Regeln und Automatisierung
- [ ] Mehr KI-Anbieter (Mistral, etc.)
- [ ] Tag-Vorschläge basierend auf E-Mail-Inhalt
- [ ] Import/Export von Tag-Konfigurationen
- [ ] Mehrsprachige Benutzeroberfläche

---

**Entwickelt mit ❤️ für besseres E-Mail-Management**
