/**
 * AI Tag Manager - Background Script
 * Verwaltet die Hintergrundlogik für Tag-Management
 */

// Initialisierung beim Start
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    console.log("AI Tag Manager installiert");

    // Standardeinstellungen setzen
    await browser.storage.local.set({
      aiProvider: "openai",
      apiKey: "",
      autoMerge: false,
      similarityThreshold: 0.8
    });
  }
});

// Open popup when toolbar button is clicked
messenger.browserAction.onClicked.addListener(async () => {
  const popupUrl = messenger.runtime.getURL('popup/popup.html');

  // Open as tab for maximum compatibility with tiling WMs (like Hyprland)
  await messenger.tabs.create({
    url: popupUrl
  });
});

// Message handler for UI communication
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  switch (message.action) {
    case "analyzeTags":
      return handleAnalyzeTags();

    case "mergeTags":
      return handleMergeTags(message.tagPairs);

    case "suggestTagNames":
      return handleSuggestTagNames(message.tags);

    case "cleanupTags":
      return handleCleanupTags(message.options);

    case "testAIConnection":
      return handleTestAIConnection(message.provider, message.apiKey);

    default:
      return { error: "Unknown action" };
  }
});

/**
 * Analysiert alle existierenden Tags
 */
async function handleAnalyzeTags() {
  try {
    const tags = await messenger.messages.listTags();

    // Sammle Statistiken über Tag-Verwendung
    const tagStats = {};
    for (const tag of tags) {
      tagStats[tag.key] = {
        key: tag.key,
        tag: tag.tag,
        color: tag.color,
        usage: 0
      };
    }

    // Zähle wie oft jeder Tag verwendet wird
    const accounts = await messenger.accounts.list();
    for (const account of accounts) {
      const folders = account.folders || [];
      await countTagsInFolders(folders, tagStats);
    }

    const allTags = Object.values(tagStats);
    const usedTags = allTags.filter(t => t.usage > 0).length;
    const unusedTags = allTags.filter(t => t.usage === 0).length;

    console.log(`\n📊 Tag Analysis Complete:`);
    console.log(`   Total: ${allTags.length} tags`);
    console.log(`   - ${usedTags} used (have emails)`);
    console.log(`   - ${unusedTags} unused (no emails)`);
    console.log(`   ✅ Returning ALL ${allTags.length} tags for analysis\n`);

    return {
      success: true,
      tags: allTags
    };
  } catch (error) {
    console.error("Fehler bei Tag-Analyse:", error);
    return { error: error.message };
  }
}

/**
 * Rekursiv Tags in Ordnern zählen
 */
async function countTagsInFolders(folders, tagStats) {
  for (const folder of folders) {
    try {
      const messages = await messenger.messages.list(folder);

      for (const message of messages.messages) {
        if (message.tags && message.tags.length > 0) {
          for (const tagKey of message.tags) {
            if (tagStats[tagKey]) {
              tagStats[tagKey].usage++;
            }
          }
        }
      }

      // Rekursiv in Unterordnern suchen
      if (folder.subFolders) {
        await countTagsInFolders(folder.subFolders, tagStats);
      }
    } catch (error) {
      console.error(`Fehler beim Verarbeiten von Ordner ${folder.name}:`, error);
    }
  }
}

/**
 * Generiert einen eindeutigen, gültigen Tag-Key aus einem Namen
 * Key darf keine Leerzeichen oder Sonderzeichen enthalten: /^[^ ()/{%*<>"]+$/
 */
function generateTagKey(tagName, existingKeys = []) {
  let baseKey = tagName
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]/g, '-') // Ersetze Sonderzeichen mit Bindestrich
    .replace(/-+/g, '-')             // Mehrfache Bindestriche zu einem
    .replace(/^-|-$/g, '');          // Entferne Bindestriche am Anfang/Ende

  // Wenn Key schon existiert, füge Nummer hinzu
  let finalKey = baseKey;
  let counter = 1;
  while (existingKeys.includes(finalKey)) {
    finalKey = `${baseKey}-${counter}`;
    counter++;
  }

  return finalKey;
}

/**
 * Führt Tag-Paare zusammen
 */
async function handleMergeTags(tagPairs) {
  try {
    // Hole alle verfügbaren Tags (um Namen zu Keys zu mappen)
    const allTags = await messenger.messages.listTags();
    const tagNameToKey = {};
    const tagKeyToName = {};

    // Case-insensitive Mapping für besseres Matching
    const normalizedTagMap = {};

    for (const tag of allTags) {
      tagNameToKey[tag.tag] = tag.key;
      tagKeyToName[tag.key] = tag.tag;
      normalizedTagMap[tag.tag.toLowerCase()] = tag.key;
    }

    console.log('Tag mapping:', tagNameToKey);

    const results = [];
    const createdTags = {}; // Track tags created in this session
    const allKeys = Object.values(tagNameToKey); // Alle existierenden Keys

    console.log(`Starting merge of ${tagPairs.length} tag pair(s)...`);

    for (let i = 0; i < tagPairs.length; i++) {
      const pair = tagPairs[i];
      const { sourceTag, targetTag } = pair;

      console.log(`Processing pair ${i + 1}/${tagPairs.length}: ${sourceTag} -> ${targetTag}`);

      // Konvertiere Tag-Namen zu Keys (mit case-insensitive Fallback)
      let sourceKey = tagNameToKey[sourceTag] || normalizedTagMap[sourceTag.toLowerCase()] || sourceTag;
      let targetKey = tagNameToKey[targetTag] || normalizedTagMap[targetTag.toLowerCase()] || createdTags[targetTag];

      // Wenn Ziel-Tag nicht existiert, erstelle es
      if (!targetKey) {
        const generatedKey = generateTagKey(targetTag, allKeys);
        console.log(`Creating new tag: ${targetTag} with key: ${generatedKey}`);

        try {
          await messenger.messages.tags.create(generatedKey, targetTag, '#0000FF');
          targetKey = generatedKey;

          // Update mappings
          tagNameToKey[targetTag] = generatedKey;
          normalizedTagMap[targetTag.toLowerCase()] = generatedKey;
          createdTags[targetTag] = generatedKey;
          allKeys.push(generatedKey); // Füge zu existierenden Keys hinzu
        } catch (createError) {
          // Tag existiert bereits - hole ihn neu aus der Liste
          if (createError.message.includes('already exists')) {
            console.log(`Tag "${targetTag}" exists already, refreshing list...`);
            const refreshedTags = await messenger.messages.listTags();
            const existingTag = refreshedTags.find(t => t.tag === targetTag || t.key === generatedKey);
            if (existingTag) {
              targetKey = existingTag.key;
              tagNameToKey[targetTag] = existingTag.key;
            } else {
              throw new Error(`Could not find or create tag: ${targetTag}`);
            }
          } else {
            throw createError;
          }
        }
      }

      console.log(`Merging: ${sourceTag} (${sourceKey}) -> ${targetTag} (${targetKey})`);

      // Sicherheitsprüfung - skip wenn targetKey undefined ist
      if (!targetKey) {
        console.error(`Skipping merge because targetKey is undefined for "${targetTag}"`);
        results.push({
          sourceTag,
          targetTag,
          movedCount: 0,
          error: 'Target tag key is undefined'
        });
        continue;
      }

      // Finde alle Nachrichten mit dem Quell-Tag
      console.log(`Searching messages with tag ${sourceKey}...`);
      const accounts = await messenger.accounts.list();
      let movedCount = 0;

      for (const account of accounts) {
        console.log(`Processing account: ${account.name}`);
        const folders = account.folders || [];
        const accountMoved = await mergeTagsInFolders(folders, sourceKey, targetKey);
        movedCount += accountMoved;
        console.log(`Account ${account.name}: ${accountMoved} message(s) updated`);
      }

      console.log(`Total messages updated for this pair: ${movedCount}`);

      // Lösche den Quell-Tag, wenn er nicht mehr gebraucht wird
      // (aber nur wenn es nicht der Ziel-Tag ist)
      if (sourceKey !== targetKey && movedCount > 0) {
        try {
          console.log(`Deleting source tag: ${sourceTag} (${sourceKey})`);
          await messenger.messages.tags.delete(sourceKey);
        } catch (deleteError) {
          console.warn(`Could not delete tag ${sourceKey}:`, deleteError.message);
          // Nicht kritisch - weitermachen
        }
      }

      results.push({
        sourceTag,
        targetTag,
        movedCount
      });

      console.log(`Completed pair ${i + 1}/${tagPairs.length}: ${movedCount} message(s) updated`);
    }

    console.log(`All merges completed! Total pairs processed: ${results.length}`);

    // Berechne Statistiken
    const uniqueSourceTags = new Set(results.map(r => r.sourceTag)).size;
    const uniqueTargetTags = new Set(results.map(r => r.targetTag)).size;
    const totalMessagesUpdated = results.reduce((sum, r) => sum + r.movedCount, 0);
    const tagsReduced = uniqueSourceTags - uniqueTargetTags;

    console.log(`\n=== MERGE STATISTICS ===`);
    console.log(`Source tags merged: ${uniqueSourceTags}`);
    console.log(`Into target tags: ${uniqueTargetTags}`);
    console.log(`Tags reduced by: ${tagsReduced}`);
    console.log(`Total messages updated: ${totalMessagesUpdated}`);
    console.log(`======================\n`);

    return {
      success: true,
      results,
      stats: {
        pairsProcessed: results.length,
        sourceTagsCount: uniqueSourceTags,
        targetTagsCount: uniqueTargetTags,
        tagsReduced: tagsReduced,
        messagesUpdated: totalMessagesUpdated
      }
    };
  } catch (error) {
    console.error("Fehler beim Tag-Zusammenführen:", error);
    return { error: error.message };
  }
}

/**
 * Rekursiv Tags in Ordnern zusammenführen
 */
async function mergeTagsInFolders(folders, sourceKey, targetKey) {
  let count = 0;

  // Validierung der Parameter
  if (!sourceKey || !targetKey) {
    console.error(`Invalid parameters: sourceKey=${sourceKey}, targetKey=${targetKey}`);
    return 0;
  }

  for (const folder of folders) {
    try {
      const messages = await messenger.messages.list(folder);

      for (const message of messages.messages) {
        try {
          if (message.tags && message.tags.includes(sourceKey)) {
            // Entferne Quell-Tag und füge Ziel-Tag hinzu
            let newTags = message.tags.filter(t => t !== sourceKey);
            if (!newTags.includes(targetKey)) {
              newTags.push(targetKey);
            }

            // Filter undefined/null Werte
            newTags = newTags.filter(t => t !== undefined && t !== null && t !== '');

            console.log(`Updating message ${message.id}: [${message.tags.join(', ')}] -> [${newTags.join(', ')}]`);

            await messenger.messages.update(message.id, { tags: newTags });
            count++;
          }
        } catch (msgError) {
          console.error(`Fehler beim Aktualisieren von Nachricht ${message.id}:`, msgError);
          // Weiter mit nächster Nachricht
        }
      }

      // Rekursiv in Unterordnern suchen
      if (folder.subFolders) {
        count += await mergeTagsInFolders(folder.subFolders, sourceKey, targetKey);
      }
    } catch (error) {
      console.error(`Fehler beim Zusammenführen in Ordner ${folder.name}:`, error);
      console.error(`sourceKey: ${sourceKey}, targetKey: ${targetKey}`);
      // Weiter mit nächstem Ordner
    }
  }

  return count;
}

/**
 * Schlägt neue Tag-Namen vor (mit KI)
 */
async function handleSuggestTagNames(tags) {
  try {
    const settings = await browser.storage.local.get([
      'aiProvider',
      'openaiApiKey', 'openaiModel', 'openaiEndpoint',
      'anthropicApiKey', 'anthropicModel',
      'googleApiKey', 'googleModel',
      'ollamaEndpoint', 'ollamaModel',
      'customPromptSimilar', 'customPromptRename', 'customPromptCategorize'
    ]);

    // KI-Integration für Tag-Vorschläge
    const aiModule = await import('./aiIntegration.js');
    const suggestions = await aiModule.suggestTagNames(tags, settings);

    return { success: true, suggestions };
  } catch (error) {
    console.error("Fehler bei Tag-Vorschlägen:", error);
    return { error: error.message };
  }
}

/**
 * Bereinigt ungenutzte oder doppelte Tags
 */
async function handleCleanupTags(options) {
  try {
    const tags = await handleAnalyzeTags();

    if (!tags.success) {
      return tags;
    }

    const toRemove = [];

    // Finde ungenutzte Tags
    if (options.removeUnused) {
      toRemove.push(...tags.tags.filter(t => t.usage === 0).map(t => t.key));
    }

    return {
      success: true,
      removedTags: toRemove,
      count: toRemove.length
    };
  } catch (error) {
    console.error("Fehler bei Tag-Bereinigung:", error);
    return { error: error.message };
  }
}

/**
 * Test AI connection with a simple request
 */
async function handleTestAIConnection(provider, apiKey) {
  try {
    // Simple test - just make a basic API call without JSON parsing
    const testPrompt = "Say 'OK' if you can read this message.";

    // Get settings
    const settings = await browser.storage.local.get([
      'openaiModel', 'openaiEndpoint',
      'anthropicModel',
      'googleModel',
      'ollamaModel', 'ollamaEndpoint'
    ]);

    let response;

    // Make a direct API call based on provider
    if (provider === 'openai') {
      const model = settings.openaiModel || "gpt-4o-mini";
      const url = (settings.openaiEndpoint && settings.openaiEndpoint.trim())
        ? settings.openaiEndpoint
        : "https://api.openai.com/v1/chat/completions";

      const apiResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "user", content: testPrompt }
          ],
          max_tokens: 50
        })
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.text();
        throw new Error(`OpenAI API Error: ${apiResponse.status} - ${error}`);
      }

      const data = await apiResponse.json();
      response = data.choices[0].message.content;

    } else if (provider === 'anthropic') {
      const model = settings.anthropicModel || "claude-3-5-sonnet-20241022";
      const url = "https://api.anthropic.com/v1/messages";

      const apiResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 50,
          messages: [
            { role: "user", content: testPrompt }
          ]
        })
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.text();
        throw new Error(`Anthropic API Error: ${apiResponse.status} - ${error}`);
      }

      const data = await apiResponse.json();
      response = data.content[0].text;

    } else if (provider === 'google') {
      const model = settings.googleModel || "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const apiResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: testPrompt }]
          }]
        })
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.text();
        throw new Error(`Google AI API Error: ${apiResponse.status} - ${error}`);
      }

      const data = await apiResponse.json();
      response = data.candidates[0].content.parts[0].text;

    } else if (provider === 'ollama') {
      const model = settings.ollamaModel || "llama3.2";
      const url = (settings.ollamaEndpoint && settings.ollamaEndpoint.trim())
        ? settings.ollamaEndpoint + '/api/generate'
        : "http://localhost:11434/api/generate";

      const apiResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          prompt: testPrompt,
          stream: false
        })
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.text();
        throw new Error(`Ollama API Error: ${apiResponse.status} - ${error}`);
      }

      const data = await apiResponse.json();
      response = data.response;

    } else {
      throw new Error('Unknown provider');
    }

    // If we got here, the connection works
    console.log("Test response:", response);
    return { success: true, response: response };

  } catch (error) {
    console.error("AI connection test failed:", error);
    return { success: false, error: error.message };
  }
}

console.log("AI Tag Manager Background Script loaded");
