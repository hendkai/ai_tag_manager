/**
 * AI Integration Module
 * Unterstützt verschiedene KI-Anbieter für Tag-Management
 */

/**
 * Bereinigt AI-Antwort und extrahiert JSON
 * Versucht auch unvollständiges JSON zu reparieren (bei truncated responses)
 */
function cleanJsonResponse(response) {
  let cleaned = response.trim();

  // Entferne Markdown-Codeblöcke
  cleaned = cleaned.replace(/```json\s*/g, '');
  cleaned = cleaned.replace(/```\s*/g, '');

  // Finde JSON-Array oder Objekt
  const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (jsonMatch) {
    cleaned = jsonMatch[1];
  }

  return cleaned.trim();
}

/**
 * Versucht truncated JSON zu reparieren und so viele Gruppen wie möglich zu retten
 */
function tryRecoverTruncatedJson(jsonString) {
  console.warn('⚠️ JSON appears truncated - attempting to recover partial data...');

  try {
    // Versuche das JSON zu vervollständigen
    let recovered = jsonString.trim();

    // Finde alle vollständigen Gruppen
    const groups = [];
    const groupRegex = /\{\s*"group"\s*:\s*\[(.*?)\]\s*,\s*"suggested_name"\s*:\s*"([^"]+)"\s*,\s*"reason"\s*:\s*"([^"]*?)"\s*\}/g;

    let match;
    while ((match = groupRegex.exec(jsonString)) !== null) {
      try {
        // Extrahiere Tag-Namen aus dem Array
        const tagArray = match[1].match(/"([^"]+)"/g)?.map(t => t.slice(1, -1)) || [];

        if (tagArray.length >= 2) {
          groups.push({
            group: tagArray,
            suggested_name: match[2],
            reason: match[3] || 'Ähnliche Tags'
          });
        }
      } catch (e) {
        // Skip this group if parsing failed
        console.warn('Failed to parse group, skipping:', e.message);
      }
    }

    if (groups.length > 0) {
      console.warn(`✅ Recovered ${groups.length} complete groups from truncated response`);
      console.warn(`⚠️ NOTE: The AI found more similarities but hit the token limit.`);
      console.warn(`   Consider using a larger model or processing in batches.`);
      return { groups };
    }
  } catch (e) {
    console.error('Failed to recover truncated JSON:', e);
  }

  throw new Error('Response was truncated and could not be recovered');
}

/**
 * Findet ähnliche Tags mittels KI
 */
export async function findSimilarTags(tags, settings, aggressive = false) {
  const provider = settings.aiProvider || "openai";

  const usedCount = tags.filter(t => t.usage > 0).length;
  const unusedCount = tags.filter(t => t.usage === 0).length;

  console.log(`\n🔍 Starting similarity analysis...`);
  console.log(`   Total tags to analyze: ${tags.length}`);
  console.log(`   - ${usedCount} used tags (have emails)`);
  console.log(`   - ${unusedCount} unused tags (no emails)`);
  console.log(`   Mode: ${aggressive ? '🔥 DEEP ANALYSIS' : 'Standard'}`);
  console.log(`   ⚠️ ALL ${tags.length} tags (used + unused) will be compared!\n`);

  const tagNames = tags.map(t => t.tag);

  // AGGRESSIVE MODE: Versuche alle Tags in wenigen großen Batches
  if (aggressive) {
    return await findSimilarTagsAggressive(tagNames, provider, settings);
  }

  // NORMAL MODE: Kleinere Batches (kein Token-Limit Problem)
  const BATCH_SIZE = 250;

  if (tagNames.length > BATCH_SIZE) {
    console.log(`Splitting into batches of ${BATCH_SIZE} tags...`);
    const allGroups = [];

    for (let i = 0; i < tagNames.length; i += BATCH_SIZE) {
      const batch = tagNames.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tagNames.length / BATCH_SIZE)} (${batch.length} tags)`);

      const batchResult = await findSimilarTagsBatch(batch, provider, settings);
      allGroups.push(...batchResult);
    }

    console.log(`Found ${allGroups.length} groups across all batches`);
    // Normal mode gibt nur Array zurück (kein warning)
    return { groups: allGroups, warning: null };
  }

  // Normale Verarbeitung für weniger Tags
  const groups = await findSimilarTagsBatch(tagNames, provider, settings);
  return { groups, warning: null };
}

/**
 * Entfernt doppelte Tags aus Gruppen (AI-Fehler: Tags in mehreren Gruppen)
 */
function deduplicateGroups(groups) {
  const seenTags = new Set();
  const deduplicatedGroups = [];

  console.log(`\n🔍 Checking for duplicate tags across groups...`);

  for (const group of groups) {
    // Filtere Tags die bereits in anderen Gruppen vorkommen
    const uniqueTags = group.group.filter(tag => {
      if (seenTags.has(tag)) {
        console.warn(`   ⚠️ Duplicate tag "${tag}" removed from group "${group.suggested_name}"`);
        return false;
      }
      seenTags.add(tag);
      return true;
    });

    // Nur Gruppen mit mindestens 2 Tags behalten
    if (uniqueTags.length >= 2) {
      deduplicatedGroups.push({
        ...group,
        group: uniqueTags
      });
    } else if (uniqueTags.length === 1) {
      console.warn(`   ⚠️ Group "${group.suggested_name}" has only 1 tag after deduplication, skipping`);
    }
  }

  const removedGroups = groups.length - deduplicatedGroups.length;
  if (removedGroups > 0) {
    console.warn(`\n⚠️ Removed ${removedGroups} groups with <2 tags after deduplication`);
  }

  console.log(`✅ Deduplication complete: ${deduplicatedGroups.length} valid groups remaining\n`);

  return deduplicatedGroups;
}

/**
 * Deep Analysis: ALLE Tags in einem einzigen Request
 */
async function findSimilarTagsAggressive(tagNames, provider, settings) {
  console.log(`🔥 DEEP ANALYSIS MODE: Analyzing ALL ${tagNames.length} tags in ONE single request...`);
  console.log(`⚠️ This may take 2-5 minutes depending on tag count`);

  const expectedGroups = Math.floor(tagNames.length / 10);
  console.log(`💰 VERY HIGH API token usage (expecting ${expectedGroups}+ groups)`);
  console.log(`📊 Using maximum output tokens (16384) to capture all similarities`);

  // Sende ALLE Tags in EINEM Request - keine Batches, keine Iterationen
  let allGroups = await findSimilarTagsBatch(tagNames, provider, settings, true);

  console.log(`✅ Analysis complete! Found ${allGroups.length} groups of similar tags`);

  // Dedupliziere Tags (entferne Tags die in mehreren Gruppen vorkommen)
  allGroups = deduplicateGroups(allGroups);

  // Berechne Coverage und erstelle Warnung wenn nötig
  const affectedTags = allGroups.reduce((sum, group) => sum + group.group.length, 0);
  const coveragePercent = Math.round((affectedTags / tagNames.length) * 100);

  let warning = null;

  // Warnung wenn deutlich weniger als erwartet gefunden wurde
  if (allGroups.length < expectedGroups / 2 || coveragePercent < 50) {
    console.warn(`\n⚠️⚠️⚠️ WARNING: Token limit likely reached! ⚠️⚠️⚠️`);
    console.warn(`   Expected: ~${expectedGroups} groups`);
    console.warn(`   Found: ${allGroups.length} groups`);
    console.warn(`   Coverage: ${coveragePercent}% of tags`);
    console.warn(`   The AI probably found more but couldn't return them all.`);
    console.warn(`\n💡 Solutions:`);
    console.warn(`   1. Use a model with higher output limits (check Settings)`);
    console.warn(`   2. Try standard mode (disable Deep Analysis) - processes in batches`);
    console.warn(`   3. Reduce tag count by removing unused tags first\n`);

    // Erstelle Warnung für UI
    warning = {
      type: 'token_limit',
      expectedGroups,
      foundGroups: allGroups.length,
      coveragePercent,
      totalTags: tagNames.length,
      affectedTags,
      model: settings.openaiModel || settings.anthropicModel || settings.googleModel || 'unknown'
    };
  }

  // Füge Warnung zu den Gruppen hinzu (wird mit suggestions gespeichert)
  return { groups: allGroups, warning };
}

/**
 * Findet ähnliche Tags für einen Batch
 */
async function findSimilarTagsBatch(tagNames, provider, settings, aggressive = false) {
  const prompt = `Du bist ein Assistent zur Tag-Verwaltung in einem E-Mail-Client.

Hier ist eine Liste von ${tagNames.length} Tags:
${tagNames.map((tag, i) => `${i + 1}. ${tag}`).join('\n')}

${aggressive ? `
🔥 DEEP ANALYSIS MODE - MAXIMALE GRÜNDLICHKEIT 🔥

Du bekommst ${tagNames.length} Tags. Deine Aufgabe ist es, ALLE möglichen Ähnlichkeiten zu finden - nicht nur die offensichtlichen!

⚠️ KRITISCH WICHTIG - Sei SEHR aggressiv beim Finden von Gruppen:

1. VERGLEICHE WIRKLICH JEDES TAG MIT JEDEM ANDEREN TAG
   - Auch wenn du denkst sie sind unterschiedlich - finde trotzdem Gemeinsamkeiten!
   - Gruppiere lieber zu viel als zu wenig
   - ⚠️ WICHTIG: Jedes Tag darf NUR IN EINER Gruppe vorkommen!

2. FINDE ALLE ARTEN VON ÄHNLICHKEITEN:
   - Rechtschreibvarianten: "Organisation" ↔ "Organization"
   - Singular/Plural: "Bestellung" ↔ "Bestellungen"
   - Tippfehler und Varianten
   - Synonyme: "Fehler" ↔ "Error" ↔ "Problem" ↔ "Issue"
   - Thematische Verwandtschaft: "PayPal" ↔ "Zahlungsmethode" ↔ "Payment"
   - Abkürzungen: "BZF" ↔ "Sprechfunkzeugnis"
   - Mehrsprachig: "Invoice" ↔ "Rechnung" ↔ "Factura"
   - Kompositionen: "E-Mail-Verwaltung" ↔ "Email Management" ↔ "Mailmanagement"
   - Prefixe/Suffixe: "Kontoverwaltung" ↔ "Konto verwalten" ↔ "Kontoübersicht"

3. GRUPPIERE GROSSZÜGIG:
   - Wenn 2 Tags auch nur ENTFERNT ähnlich sind → GRUPPIERE SIE!
   - Wenn du dir nicht sicher bist → GRUPPIERE SIE trotzdem!
   - Ziel: Hunderte von Gruppen finden, nicht nur ein paar!

4. KEINE LIMITS:
   - Du hast genug Token-Kapazität für hunderte Gruppen
   - Schreibe ALLE Gruppen die du findest, auch kleine mit nur 2 Tags
   - Je mehr Gruppen, desto besser!

ERWARTUNG: Bei ${tagNames.length} Tags erwarte ich MINDESTENS ${Math.floor(tagNames.length / 10)} Gruppen!
` : 'Analysiere diese Tags und finde Paare oder Gruppen von ähnlichen Tags, die zusammengeführt werden sollten.'}

Berücksichtige dabei:
- Rechtschreibvarianten (z.B. "Projekt", "Projekte")
- Synonyme (z.B. "wichtig", "priority", "hochprioritär")
- Singular/Plural (z.B. "Tag", "Tags")
- Groß-/Kleinschreibung
- Ähnliche Bedeutungen und Themen
- Abkürzungen vs. Langformen (z.B. "BZF", "Sprechfunkzeugnis")
- Verschiedene Sprachen für dasselbe Konzept (z.B. "Rechnung", "Invoice")

Antworte im JSON-Format mit einem Objekt das ein Array "groups" enthält:
{
  "groups": [
    {
      "group": ["tag1", "tag2", "tag3"],
      "suggested_name": "empfohlener_name",
      "reason": "Kurze Begründung (max 3-5 Wörter!)"
    }
  ]
}

⚠️ WICHTIG für "reason":
- MAXIMAL 3-5 Wörter pro reason!
- Z.B. "Ähnliche Zahlungsbegriffe" statt "Alle beziehen sich auf Zahlungen und Transaktionen"
- Je kürzer, desto besser!
- Das spart Tokens für MEHR Gruppen!

Nur JSON ausgeben, keine zusätzlichen Erklärungen.`;

  let response;
  try {
    // Im aggressive mode höheres Token-Limit verwenden
    const customSettings = aggressive ? { ...settings, aggressiveMode: true } : settings;
    response = await callAI(provider, prompt, customSettings);
    console.log('Raw AI response:', response);

    const cleanedResponse = cleanJsonResponse(response);
    console.log('Cleaned response:', cleanedResponse);

    try {
      const result = JSON.parse(cleanedResponse);
      return result.groups || result;
    } catch (parseError) {
      // JSON parse fehlgeschlagen - vermutlich truncated response
      console.error("JSON parse failed:", parseError.message);
      console.error("Attempting to recover partial data from truncated response...");

      // Versuche truncated JSON zu reparieren
      const recovered = tryRecoverTruncatedJson(cleanedResponse);
      return recovered.groups || recovered;
    }
  } catch (error) {
    console.error("Fehler bei KI-Analyse:", error);
    if (response) {
      console.error("AI response was:", response);
    }
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

/**
 * Schlägt bessere Tag-Namen vor
 */
export async function suggestTagNames(tags, settings) {
  const provider = settings.aiProvider || "openai";
  const BATCH_SIZE = 250; // Tags pro Request

  console.log(`Analyzing all ${tags.length} tags for name improvements...`);

  const tagNames = tags.map(t => t.tag);

  // Wenn zu viele Tags, in Batches aufteilen
  if (tagNames.length > BATCH_SIZE) {
    console.log(`Splitting into batches of ${BATCH_SIZE} tags...`);
    const allSuggestions = [];

    for (let i = 0; i < tagNames.length; i += BATCH_SIZE) {
      const batch = tagNames.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tagNames.length / BATCH_SIZE)} (${batch.length} tags)`);

      const batchResult = await suggestTagNamesBatch(batch, provider, settings);
      allSuggestions.push(...batchResult);
    }

    console.log(`Generated ${allSuggestions.length} suggestions across all batches`);
    return allSuggestions;
  }

  // Normale Verarbeitung für weniger Tags
  return await suggestTagNamesBatch(tagNames, provider, settings);
}

/**
 * Schlägt bessere Tag-Namen für einen Batch vor
 */
async function suggestTagNamesBatch(tagNames, provider, settings) {
  const prompt = `Du bist ein Assistent zur Verbesserung von E-Mail-Tags.

Hier sind die aktuellen Tags:
${tagNames.map((tag, i) => `${i + 1}. ${tag}`).join('\n')}

Schlage für jeden Tag einen besseren, konsistenteren Namen vor, wenn nötig.
Beachte:
- Einheitliche Namenskonventionen
- Klarheit und Präzision
- Konsistente Groß-/Kleinschreibung
- Vermeidung von Sonderzeichen

Antworte im JSON-Format mit einem Objekt das ein Array "suggestions" enthält:
{
  "suggestions": [
    {
      "old_name": "alter_name",
      "new_name": "neuer_name",
      "reason": "Grund für die Änderung"
    }
  ]
}

Nur Änderungen vorschlagen, die wirklich sinnvoll sind. Nur JSON ausgeben.`;

  try {
    const response = await callAI(provider, prompt, settings);
    const cleanedResponse = cleanJsonResponse(response);
    const result = JSON.parse(cleanedResponse);
    return result.suggestions || result;
  } catch (error) {
    console.error("Fehler bei Tag-Vorschlägen:", error);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

/**
 * Kategorisiert Tags automatisch
 */
export async function categorizeTags(tags, settings) {
  const provider = settings.aiProvider || "openai";
  const BATCH_SIZE = 300; // Mehr Tags pro Batch für Kategorisierung

  console.log(`Categorizing all ${tags.length} tags...`);

  const tagNames = tags.map(t => ({ name: t.tag, usage: t.usage }));

  // Wenn zu viele Tags, in Batches aufteilen
  if (tagNames.length > BATCH_SIZE) {
    console.log(`Splitting into batches of ${BATCH_SIZE} tags...`);
    const allCategories = [];

    for (let i = 0; i < tagNames.length; i += BATCH_SIZE) {
      const batch = tagNames.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tagNames.length / BATCH_SIZE)} (${batch.length} tags)`);

      const batchResult = await categorizeTagsBatch(batch, provider, settings);
      allCategories.push(...batchResult.categories);
    }

    console.log(`Created ${allCategories.length} categories across all batches`);
    return { categories: allCategories };
  }

  // Normale Verarbeitung für weniger Tags
  return await categorizeTagsBatch(tagNames, provider, settings);
}

/**
 * Kategorisiert Tags für einen Batch
 */
async function categorizeTagsBatch(tagNames, provider, settings) {
  const prompt = `Analysiere diese E-Mail-Tags und kategorisiere sie in sinnvolle Gruppen.

Tags (mit Verwendungshäufigkeit):
${tagNames.map(t => `- ${t.name} (${t.usage}x verwendet)`).join('\n')}

Erstelle Kategorien wie z.B.:
- Projekte
- Prioritäten
- Status
- Themen
- Personen
etc.

Antworte im JSON-Format:
{
  "categories": [
    {
      "category": "Kategoriename",
      "tags": ["tag1", "tag2"],
      "description": "Beschreibung der Kategorie"
    }
  ]
}

Nur JSON ausgeben.`;

  try {
    const response = await callAI(provider, prompt, settings);
    const cleanedResponse = cleanJsonResponse(response);
    const result = JSON.parse(cleanedResponse);
    return result;
  } catch (error) {
    console.error("Fehler bei Tag-Kategorisierung:", error);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

/**
 * Ruft die entsprechende KI-API auf
 */
async function callAI(provider, prompt, settings) {
  // Extract the correct API key based on provider
  let apiKey = '';

  switch (provider) {
    case "openai":
      apiKey = settings.openaiApiKey;
      if (!apiKey) {
        throw new Error('OpenAI API Key not configured. Please check settings.');
      }
      return await callOpenAI(apiKey, prompt, settings);

    case "anthropic":
      apiKey = settings.anthropicApiKey;
      if (!apiKey) {
        throw new Error('Anthropic API Key not configured. Please check settings.');
      }
      return await callAnthropic(apiKey, prompt, settings);

    case "google":
      apiKey = settings.googleApiKey;
      if (!apiKey) {
        throw new Error('Google AI API Key not configured. Please check settings.');
      }
      return await callGoogleAI(apiKey, prompt, settings);

    case "ollama":
      // Ollama doesn't need API key
      return await callOllama(prompt, settings);

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * OpenAI API Call
 */
async function callOpenAI(apiKey, prompt, settings) {
  const model = settings.openaiModel || "gpt-4o-mini";
  // Use endpoint from settings, or default if empty
  const url = (settings.openaiEndpoint && settings.openaiEndpoint.trim())
    ? settings.openaiEndpoint
    : "https://api.openai.com/v1/chat/completions";

  // Token-Limits basierend auf Mode
  let maxTokens = 8000;
  if (settings.aggressiveMode) {
    // Deep mode: MAXIMALES Token-Limit für große Tag-Listen
    // Bei 1000+ Tags können hunderte Gruppen gefunden werden
    maxTokens = 16384; // Maximum für gpt-4o/gpt-4-turbo
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: "Du bist ein Assistent zur Tag-Verwaltung. Antworte immer nur mit gültigem JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Anthropic (Claude) API Call
 */
async function callAnthropic(apiKey, prompt, settings) {
  const model = settings.anthropicModel || "claude-3-5-sonnet-20241022";
  const url = "https://api.anthropic.com/v1/messages";

  // Token-Limits basierend auf Mode
  let maxTokens = 8000;
  if (settings.aggressiveMode) {
    // Deep mode: MAXIMALES Token-Limit für große Tag-Listen
    // Bei 1000+ Tags können hunderte Gruppen gefunden werden
    maxTokens = 16384; // Maximum für gpt-4o/gpt-4-turbo
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model,
      max_tokens: maxTokens,
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Google AI (Gemini) API Call
 */
async function callGoogleAI(apiKey, prompt, settings) {
  const model = settings.googleModel || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Token-Limits basierend auf Mode
  let maxOutputTokens = 8000;
  if (settings.aggressiveMode) {
    // Deep mode: MAXIMALES Token-Limit für große Tag-Listen
    // Gemini kann bis zu 8192 Output-Tokens (Flash) oder mehr
    maxOutputTokens = 8192;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: maxOutputTokens
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Ollama (lokal) API Call
 */
async function callOllama(prompt, settings) {
  const model = settings.ollamaModel || "llama3.2";
  // Use endpoint from settings, or default if empty
  const url = (settings.ollamaEndpoint && settings.ollamaEndpoint.trim())
    ? settings.ollamaEndpoint
    : "http://localhost:11434/api/generate";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.response;
}
