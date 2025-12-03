/**
 * Popup Script for AI Tag Manager
 */

let currentTags = [];

// Elements
const statusDiv = document.getElementById('status');
const statsSection = document.getElementById('statsSection');

const findSimilarBtn = document.getElementById('findSimilarBtn');
const suggestNamesBtn = document.getElementById('suggestNamesBtn');
const categorizeBtn = document.getElementById('categorizeBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const cleanupBtn = document.getElementById('cleanupBtn');
const settingsLink = document.getElementById('settingsLink');

// Event Listeners
findSimilarBtn.addEventListener('click', findSimilarTags);
suggestNamesBtn.addEventListener('click', suggestTagNames);
categorizeBtn.addEventListener('click', categorizeTags);
analyzeBtn.addEventListener('click', analyzeTags);
cleanupBtn.addEventListener('click', cleanupTags);
settingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  browser.runtime.openOptionsPage();
});

// On load: analyze tags
document.addEventListener('DOMContentLoaded', async () => {
  await checkSettings();
  await loadTagStats();
});

/**
 * Check if API key is configured
 */
async function checkSettings() {
  const settings = await browser.storage.local.get(['aiProvider', 'openaiApiKey', 'anthropicApiKey', 'googleApiKey']);

  const provider = settings.aiProvider || 'openai';
  let hasKey = false;

  switch (provider) {
    case 'openai':
      hasKey = !!settings.openaiApiKey;
      break;
    case 'anthropic':
      hasKey = !!settings.anthropicApiKey;
      break;
    case 'google':
      hasKey = !!settings.googleApiKey;
      break;
    case 'ollama':
      hasKey = true; // Ollama doesn't require a key
      break;
  }

  if (!hasKey) {
    showStatus('⚠️ Please configure your API key in settings first.', 'warning');
  }
}

/**
 * Load tag statistics
 */
async function loadTagStats() {
  try {
    const response = await browser.runtime.sendMessage({ action: 'analyzeTags' });

    if (response.error) {
      showStatus('Error: ' + response.error, 'error');
      return;
    }

    currentTags = response.tags;

    console.log(`📊 Loaded ${response.tags.length} tags from Thunderbird`);

    // Show statistics
    const totalTags = currentTags.length;
    const usedTags = currentTags.filter(t => t.usage > 0).length;
    const unusedTags = currentTags.filter(t => t.usage === 0).length;

    console.log(`   - ${usedTags} used tags (with emails)`);
    console.log(`   - ${unusedTags} unused tags (no emails)`);
    console.log(`   - ALL ${totalTags} tags will be analyzed!`);

    document.getElementById('totalTags').textContent = totalTags;
    document.getElementById('usedTags').textContent = usedTags;
    document.getElementById('unusedTags').textContent = unusedTags;

    statsSection.style.display = 'block';

    // Zeige Optimierungshinweis wenn viele Tags vorhanden
    const optimizationHint = document.getElementById('optimizationHint');
    const aggressiveCheckbox = document.getElementById('aggressiveModeCheckbox');

    // Helper function to safely set HTML with dynamic values
    function setHintText(emoji, boldText, normalText) {
      optimizationHint.textContent = '';
      optimizationHint.appendChild(document.createTextNode(emoji + ' '));
      const strong = document.createElement('strong');
      strong.textContent = boldText;
      optimizationHint.appendChild(strong);
      optimizationHint.appendChild(document.createTextNode(' ' + normalText));
    }

    if (totalTags > 500) {
      setHintText('💡', 'Tip:', `You have ${totalTags} tags (${usedTags} used + ${unusedTags} unused). Deep Analysis Mode auto-enabled to analyze ALL tags together!`);
      optimizationHint.style.display = 'block';
      // Auto-enable Deep Mode für viele Tags
      aggressiveCheckbox.checked = true;
    } else if (totalTags > 200) {
      setHintText('💡', 'Tip:', `You have ${totalTags} tags. Consider using "🔥 Deep Analysis Mode" to analyze ALL tags (including ${unusedTags} unused ones).`);
      optimizationHint.style.display = 'block';
    } else if (unusedTags > 100) {
      setHintText('⚠️', 'Note:', `You have ${unusedTags} unused tags. AI will analyze ALL ${totalTags} tags (used + unused) to find duplicates. Or use "Clean Up Tags" to delete unused ones.`);
      optimizationHint.style.display = 'block';
    } else if (unusedTags > 50) {
      setHintText('🧹', 'Tip:', `You have ${unusedTags} unused tags. They will be included in analysis, or use "Clean Up Tags" to remove them.`);
      optimizationHint.style.display = 'block';
    } else {
      optimizationHint.style.display = 'none';
    }
  } catch (error) {
    showStatus('Error loading tags: ' + error.message, 'error');
  }
}

/**
 * Find similar tags
 */
async function findSimilarTags() {
  if (currentTags.length === 0) {
    showStatus('No tags found. Please analyze first.', 'warning');
    return;
  }

  // Check if aggressive mode is enabled
  const aggressiveMode = document.getElementById('aggressiveModeCheckbox').checked;
  const modeText = aggressiveMode ? '🔥 Deep analysis mode' : 'Standard mode';

  showStatus(`🔍 Finding similar tags with AI... (${modeText})`, 'loading');
  disableButtons(true);

  try {
    const settings = await browser.storage.local.get(['aiProvider', 'openaiApiKey', 'anthropicApiKey', 'googleApiKey', 'ollamaEndpoint', 'ollamaModel', 'openaiModel', 'anthropicModel', 'googleModel', 'customPromptSimilar', 'customPromptRename', 'customPromptCategorize']);

    // Import AI module dynamically
    const aiModule = await import('../scripts/aiIntegration.js');
    const result = await aiModule.findSimilarTags(currentTags, settings, aggressiveMode);

    // Handle both old format (array) and new format (object with groups + warning)
    const similarGroups = result.groups || result;
    const warning = result.warning || null;

    if (similarGroups.length === 0) {
      showStatus('✓ No similar tags found! Your tags are already well organized.', 'success');
    } else {
      // Berechne wie viele Tags betroffen sind
      const affectedTags = similarGroups.reduce((sum, group) => sum + group.group.length, 0);
      const potentialReduction = affectedTags - similarGroups.length;

      const coveragePercent = Math.round((affectedTags / currentTags.length) * 100);

      console.log(`\n=== ANALYSIS RESULTS ===`);
      console.log(`Groups found: ${similarGroups.length}`);
      console.log(`Tags affected: ${affectedTags} (${coveragePercent}% of all tags)`);
      console.log(`Tags unaffected: ${currentTags.length - affectedTags}`);
      console.log(`Potential reduction: ${potentialReduction} tags`);
      console.log(`Mode: ${aggressiveMode ? 'Deep Analysis' : 'Standard'}`);
      console.log(`=======================\n`);

      // Zeige Warnung wenn Token-Limit erreicht wurde
      if (warning && warning.type === 'token_limit') {
        console.warn(`⚠️ WARNING: Only ${coveragePercent}% of tags were grouped!`);
        console.warn(`   This seems low. The AI may have hit token limits.`);
        console.warn(`   Consider using a larger model (gpt-4o instead of gpt-4o-mini)`);

        // Zeige auch im UI
        showStatus(
          `⚠️ Found ${similarGroups.length} groups (${coveragePercent}% coverage)\n` +
          `Token limit likely reached! Expected ~${warning.expectedGroups} groups.\n` +
          `Results may be incomplete. Check recommendations in results page.`,
          'warning'
        );
      } else if (coveragePercent < 50 && aggressiveMode) {
        console.warn(`⚠️ WARNING: Only ${coveragePercent}% of tags were grouped!`);

        showStatus(
          `⚠️ Found ${similarGroups.length} group(s) affecting ${affectedTags} tags\n` +
          `Coverage: ${coveragePercent}% - This seems low, check results for details.`,
          'warning'
        );
      } else {
        showStatus(
          `✓ Found ${similarGroups.length} group(s) affecting ${affectedTags} tags!\n` +
          `Potential reduction: ${potentialReduction} tags`,
          'success'
        );
      }

      // Save suggestions AND warning and open Results page
      await browser.storage.local.set({
        pendingSuggestions: {
          type: 'similar',
          suggestions: similarGroups,
          warning: warning // Speichere Warnung für Results-Seite
        }
      });

      // Open Results page in new tab
      await browser.tabs.create({
        url: browser.runtime.getURL('results/results.html')
      });
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  } finally {
    disableButtons(false);
  }
}

/**
 * Suggest better tag names
 */
async function suggestTagNames() {
  if (currentTags.length === 0) {
    showStatus('No tags found. Please analyze first.', 'warning');
    return;
  }

  showStatus('✨ Generating improvement suggestions...', 'loading');
  disableButtons(true);

  try {
    const response = await browser.runtime.sendMessage({
      action: 'suggestTagNames',
      tags: currentTags
    });

    if (response.error) {
      throw new Error(response.error);
    }

    const suggestions = response.suggestions;

    if (suggestions.length === 0) {
      showStatus('✓ Your tag names are already optimal!', 'success');
    } else {
      showStatus(`✓ Generated ${suggestions.length} improvement suggestion(s)!`, 'success');

      // Save suggestions and open Results page
      await browser.storage.local.set({
        pendingSuggestions: {
          type: 'rename',
          suggestions: suggestions
        }
      });

      // Open Results page in new tab
      await browser.tabs.create({
        url: browser.runtime.getURL('results/results.html')
      });
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  } finally {
    disableButtons(false);
  }
}

/**
 * Categorize tags
 */
async function categorizeTags() {
  if (currentTags.length === 0) {
    showStatus('No tags found. Please analyze first.', 'warning');
    return;
  }

  showStatus('📁 Categorizing tags...', 'loading');
  disableButtons(true);

  try {
    const settings = await browser.storage.local.get(['aiProvider', 'openaiApiKey', 'anthropicApiKey', 'googleApiKey', 'ollamaEndpoint', 'ollamaModel', 'openaiModel', 'anthropicModel', 'googleModel', 'customPromptSimilar', 'customPromptRename', 'customPromptCategorize']);

    const aiModule = await import('../scripts/aiIntegration.js');
    const result = await aiModule.categorizeTags(currentTags, settings);

    showStatus(`✓ Tags sorted into ${result.categories.length} categories!`, 'success');

    // Save categorization and open Results page
    await browser.storage.local.set({
      pendingSuggestions: {
        type: 'categorize',
        suggestions: result
      }
    });

    // Öffne Results-Seite in neuem Tab
    await browser.tabs.create({
      url: browser.runtime.getURL('results/results.html')
    });
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  } finally {
    disableButtons(false);
  }
}

/**
 * Analyze tags
 */
async function analyzeTags() {
  showStatus('📊 Analyzing tags...', 'loading');
  disableButtons(true);

  try {
    await loadTagStats();
    showStatus('✓ Analysis complete!', 'success');
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  } finally {
    disableButtons(false);
  }
}

/**
 * Clean up tags
 */
async function cleanupTags() {
  if (currentTags.length === 0) {
    showStatus('No tags found. Please analyze first.', 'warning');
    return;
  }

  const unusedCount = currentTags.filter(t => t.usage === 0).length;

  if (unusedCount === 0) {
    showStatus('✓ No unused tags found!', 'success');
    return;
  }

  const confirmed = confirm(`Found ${unusedCount} unused tags.\n\nDo you want to remove them?`);

  if (!confirmed) {
    return;
  }

  showStatus('🧹 Cleaning up tags...', 'loading');
  disableButtons(true);

  try {
    const response = await browser.runtime.sendMessage({
      action: 'cleanupTags',
      options: {
        removeUnused: true
      }
    });

    if (response.error) {
      throw new Error(response.error);
    }

    showStatus(`✓ Removed ${response.count} tags!`, 'success');

    // Update statistics
    await loadTagStats();
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  } finally {
    disableButtons(false);
  }
}

/**
 * Show status message
 */
function showStatus(message, type) {
  statusDiv.textContent = '';
  statusDiv.className = type;
  statusDiv.style.display = 'block';

  // Add spinner for loading state
  if (type === 'loading') {
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    statusDiv.appendChild(spinner);
  }

  const textNode = document.createTextNode(message);
  statusDiv.appendChild(textNode);

  if (type === 'success' || type === 'warning') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

/**
 * Enable/Disable buttons
 */
function disableButtons(disabled) {
  findSimilarBtn.disabled = disabled;
  suggestNamesBtn.disabled = disabled;
  categorizeBtn.disabled = disabled;
  analyzeBtn.disabled = disabled;
  cleanupBtn.disabled = disabled;
}
