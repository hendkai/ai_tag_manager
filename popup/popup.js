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

    // Show statistics
    const totalTags = currentTags.length;
    const usedTags = currentTags.filter(t => t.usage > 0).length;
    const unusedTags = currentTags.filter(t => t.usage === 0).length;

    document.getElementById('totalTags').textContent = totalTags;
    document.getElementById('usedTags').textContent = usedTags;
    document.getElementById('unusedTags').textContent = unusedTags;

    statsSection.style.display = 'block';
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

  showStatus('🔍 Finding similar tags with AI...', 'loading');
  disableButtons(true);

  try {
    const settings = await browser.storage.local.get(['aiProvider', 'openaiApiKey', 'anthropicApiKey', 'googleApiKey', 'ollamaEndpoint', 'ollamaModel', 'openaiModel', 'anthropicModel', 'googleModel']);

    // Import AI module dynamically
    const aiModule = await import('../scripts/aiIntegration.js');
    const similarGroups = await aiModule.findSimilarTags(currentTags, settings);

    if (similarGroups.length === 0) {
      showStatus('✓ No similar tags found! Your tags are already well organized.', 'success');
    } else {
      showStatus(`✓ Found ${similarGroups.length} group(s) of similar tags!`, 'success');

      // Save suggestions and open Results page
      await browser.storage.local.set({
        pendingSuggestions: {
          type: 'similar',
          suggestions: similarGroups
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
    const settings = await browser.storage.local.get(['aiProvider', 'openaiApiKey', 'anthropicApiKey', 'googleApiKey', 'ollamaEndpoint', 'ollamaModel', 'openaiModel', 'anthropicModel', 'googleModel']);

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
  statusDiv.innerHTML = '';
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
