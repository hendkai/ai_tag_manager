/**
 * AI Integration Module
 * Unterstützt verschiedene KI-Anbieter für Tag-Management
 */

/**
 * Bereinigt AI-Antwort und extrahiert JSON
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
 * Findet ähnliche Tags mittels KI
 */
export async function findSimilarTags(tags, settings) {
  const provider = settings.aiProvider || "openai";

  const tagNames = tags.map(t => t.tag);

  const prompt = `Du bist ein Assistent zur Tag-Verwaltung in einem E-Mail-Client.

Hier ist eine Liste von Tags:
${tagNames.map((tag, i) => `${i + 1}. ${tag}`).join('\n')}

Analysiere diese Tags und finde Paare oder Gruppen von ähnlichen Tags, die zusammengeführt werden sollten.
Berücksichtige dabei:
- Rechtschreibvarianten (z.B. "Projekt", "Projekte")
- Synonyme (z.B. "wichtig", "priority")
- Singular/Plural
- Groß-/Kleinschreibung
- Ähnliche Bedeutungen

Antworte im JSON-Format mit einem Objekt das ein Array "groups" enthält:
{
  "groups": [
    {
      "group": ["tag1", "tag2", "tag3"],
      "suggested_name": "empfohlener_name",
      "reason": "Grund für die Zusammenführung"
    }
  ]
}

Nur JSON ausgeben, keine zusätzlichen Erklärungen.`;

  let response;
  try {
    response = await callAI(provider, prompt, settings);
    console.log('Raw AI response:', response);

    const cleanedResponse = cleanJsonResponse(response);
    console.log('Cleaned response:', cleanedResponse);

    const result = JSON.parse(cleanedResponse);
    return result.groups || result;
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

  const tagNames = tags.map(t => t.tag);

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

  const tagNames = tags.map(t => ({ name: t.tag, usage: t.usage }));

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
      max_tokens: 2000
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

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2000,
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
  const model = settings.googleModel || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
        maxOutputTokens: 2000
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
