/**
 * Results Page - Shows AI suggestions for confirmation
 */

let currentSuggestions = [];
let currentType = '';
let selectedItems = new Set();
let warningInfo = null;

/**
 * Safely create HTML elements to avoid innerHTML security issues
 */
function createElementWithText(tag, text, className = null) {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  if (className) el.className = className;
  return el;
}

function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function createStatItem(labelText, valueText) {
  const item = createElementWithText('div', null, 'stat-item');
  item.appendChild(createElementWithText('span', labelText, 'stat-label'));
  item.appendChild(createElementWithText('span', valueText, 'stat-value'));
  return item;
}

function createWarningBox(warning) {
  const box = createElementWithText('div', null, 'warning-box');

  box.appendChild(createElementWithText('h3', '⚠️ Incomplete Results - Token Limit Reached'));

  const p1 = createElementWithText('p');
  p1.appendChild(createElementWithText('strong', 'The AI found more similarities but couldn\'t return all of them.'));
  box.appendChild(p1);

  const stats = createElementWithText('div', null, 'warning-stats');
  const createStat = (label, value) => {
    const div = document.createElement('div');
    div.appendChild(createElementWithText('strong', label + ': '));
    div.appendChild(document.createTextNode(value));
    return div;
  };
  stats.appendChild(createStat('Expected', `~${warning.expectedGroups} groups`));
  stats.appendChild(createStat('Found', `${warning.foundGroups} groups`));
  stats.appendChild(createStat('Coverage', `${warning.coveragePercent}% of your ${warning.totalTags} tags`));
  stats.appendChild(createStat('Current Model', warning.model));
  box.appendChild(stats);

  box.appendChild(createElementWithText('h4', '💡 How to get complete results:'));

  const ol = document.createElement('ol');

  const li1 = document.createElement('li');
  li1.appendChild(createElementWithText('strong', 'Best Solution: '));
  li1.appendChild(document.createTextNode('Use a larger model in Settings:'));
  const ul = document.createElement('ul');
  ul.appendChild(createElementWithText('li')).appendChild(createElementWithText('strong', 'GPT-4o')).parentNode.appendChild(document.createTextNode(' (16K output) - Best for 1000+ tags'));
  ul.appendChild(createElementWithText('li')).appendChild(createElementWithText('strong', 'Claude 3.5 Sonnet')).parentNode.appendChild(document.createTextNode(' (8K output) - Good for 1000+ tags'));
  ul.appendChild(createElementWithText('li')).appendChild(createElementWithText('strong', 'Gemini 1.5 Pro')).parentNode.appendChild(document.createTextNode(' (8K output) - Good for 1000+ tags'));
  li1.appendChild(ul);
  ol.appendChild(li1);

  const li2 = document.createElement('li');
  li2.appendChild(createElementWithText('strong', 'Alternative: '));
  li2.appendChild(document.createTextNode('Disable "Deep Analysis Mode" - processes tags in batches (no token limit issues)'));
  ol.appendChild(li2);

  const li3 = document.createElement('li');
  li3.appendChild(createElementWithText('strong', 'Optional: '));
  li3.appendChild(document.createTextNode('Remove unused tags first with "Clean Up Tags" to reduce total count'));
  ol.appendChild(li3);

  box.appendChild(ol);

  box.appendChild(createElementWithText('p', `ℹ️ You can still apply these ${warning.foundGroups} suggestions and run the analysis again with a larger model to find more.`, 'warning-note'));

  return box;
}

// Elements
const backBtn = document.getElementById('backBtn');
const pageIcon = document.getElementById('pageIcon');
const pageTitle = document.getElementById('pageTitle');
const messageArea = document.getElementById('messageArea');
const loadingArea = document.getElementById('loadingArea');
const statsArea = document.getElementById('statsArea');
const contentArea = document.getElementById('contentArea');
const actionArea = document.getElementById('actionArea');
const applyBtn = document.getElementById('applyBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Event Listeners
backBtn.addEventListener('click', () => window.close());
cancelBtn.addEventListener('click', () => window.close());
applyBtn.addEventListener('click', applySelectedSuggestions);

// On load
document.addEventListener('DOMContentLoaded', async () => {
  // Load data from storage (set by popup)
  const result = await browser.storage.local.get(['pendingSuggestions']);

  if (!result.pendingSuggestions) {
    showMessage('No suggestions found.', 'error');
    return;
  }

  const data = result.pendingSuggestions;
  currentType = data.type;
  currentSuggestions = data.suggestions;
  warningInfo = data.warning || null; // Lade Warnung wenn vorhanden

  // Show corresponding view
  switch (currentType) {
    case 'similar':
      showSimilarTagsSuggestions(currentSuggestions, warningInfo);
      break;
    case 'rename':
      showRenameSuggestions(currentSuggestions);
      break;
    case 'categorize':
      showCategorizeSuggestions(currentSuggestions);
      break;
    default:
      showMessage('Unknown suggestion type.', 'error');
  }

  // Delete temporary data
  await browser.storage.local.remove('pendingSuggestions');
});

/**
 * Shows suggestions for similar tags
 */
function showSimilarTagsSuggestions(suggestions, warning = null) {
  pageIcon.textContent = '🔍';
  pageTitle.textContent = 'Merge Similar Tags';

  // Zeige Warnung wenn Token-Limit erreicht wurde
  if (warning && warning.type === 'token_limit') {
    const warningBox = createWarningBox(warning);
    contentArea.appendChild(warningBox);
  }

  // Statistics
  const totalGroups = suggestions.length;
  const totalTags = suggestions.reduce((sum, s) => sum + s.group.length, 0);

  // Clear and build stats
  statsArea.textContent = '';
  const stats = createElementWithText('div', null, 'stats');
  stats.appendChild(createStatItem('Groups Found', totalGroups.toString()));
  stats.appendChild(createStatItem('Tags Affected', totalTags.toString()));
  const selectedStat = createStatItem('Selected', '0');
  selectedStat.querySelector('.stat-value').id = 'selectedCount';
  stats.appendChild(selectedStat);
  statsArea.appendChild(stats);
  statsArea.style.display = 'block';

  // Selection controls
  const controls = createElementWithText('div', null, 'selection-controls');
  const selectAllBtn = document.createElement('button');
  selectAllBtn.id = 'selectAllBtn';
  selectAllBtn.className = 'btn-secondary';
  selectAllBtn.textContent = 'Select All';
  controls.appendChild(selectAllBtn);

  const selectNoneBtn = document.createElement('button');
  selectNoneBtn.id = 'selectNoneBtn';
  selectNoneBtn.className = 'btn-secondary';
  selectNoneBtn.textContent = 'Deselect All';
  controls.appendChild(selectNoneBtn);

  contentArea.appendChild(controls);

  // Add event listeners
  document.getElementById('selectAllBtn').addEventListener('click', selectAll);
  document.getElementById('selectNoneBtn').addEventListener('click', selectNone);

  // Suggestions
  const section = document.createElement('div');
  section.className = 'section';

  suggestions.forEach((suggestion, index) => {
    const item = createSimilarTagItem(suggestion, index);
    section.appendChild(item);
  });

  contentArea.appendChild(section);
  actionArea.style.display = 'flex';

  // Select all by default
  selectAll();
}

/**
 * Creates an element for similar tag group
 */
function createSimilarTagItem(suggestion, index) {
  const div = document.createElement('div');
  div.className = 'suggestion-item';
  div.dataset.index = index;

  const tagsPreview = suggestion.group.map(tag =>
    `<span class="tag-name tag-group">${tag}</span>`
  ).join(' ');

  div.innerHTML = `
    <div class="suggestion-header">
      <input type="checkbox" class="suggestion-checkbox" data-index="${index}">
      <div class="suggestion-content">
        <div class="tag-preview">
          ${tagsPreview}
          <span class="arrow">→</span>
          <span class="tag-name tag-new">${suggestion.suggested_name}</span>
        </div>
        <div class="reason">${suggestion.reason}</div>
        <div class="impact">💡 ${suggestion.group.length} tags will be merged into 1 tag</div>
      </div>
    </div>
  `;

  const checkbox = div.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      selectedItems.add(index);
      div.classList.add('selected');
    } else {
      selectedItems.delete(index);
      div.classList.remove('selected');
    }
    updateSelectedCount();
  });

  return div;
}

/**
 * Shows suggestions for tag renaming
 */
function showRenameSuggestions(suggestions) {
  pageIcon.textContent = '✨';
  pageTitle.textContent = 'Improve Tag Names';

  // Statistics
  statsArea.innerHTML = `
    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">Suggestions</span>
        <span class="stat-value">${suggestions.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Selected</span>
        <span class="stat-value" id="selectedCount">0</span>
      </div>
    </div>
  `;
  statsArea.style.display = 'block';

  // Selection controls
  const controls = document.createElement('div');
  controls.className = 'selection-controls';
  controls.innerHTML = `
    <button id="selectAllBtn" class="btn-secondary">Select All</button>
    <button id="selectNoneBtn" class="btn-secondary">Deselect All</button>
  `;
  contentArea.appendChild(controls);

  // Add event listeners
  document.getElementById('selectAllBtn').addEventListener('click', selectAll);
  document.getElementById('selectNoneBtn').addEventListener('click', selectNone);

  // Suggestions
  const section = document.createElement('div');
  section.className = 'section';

  suggestions.forEach((suggestion, index) => {
    const item = createRenameItem(suggestion, index);
    section.appendChild(item);
  });

  contentArea.appendChild(section);
  actionArea.style.display = 'flex';

  // Select all by default
  selectAll();
}

/**
 * Creates an element for rename suggestion
 */
function createRenameItem(suggestion, index) {
  const div = document.createElement('div');
  div.className = 'suggestion-item';
  div.dataset.index = index;

  div.innerHTML = `
    <div class="suggestion-header">
      <input type="checkbox" class="suggestion-checkbox" data-index="${index}">
      <div class="suggestion-content">
        <div class="tag-preview">
          <span class="tag-name tag-old">${suggestion.old_name}</span>
          <span class="arrow">→</span>
          <span class="tag-name tag-new">${suggestion.new_name}</span>
        </div>
        <div class="reason">${suggestion.reason}</div>
      </div>
    </div>
  `;

  const checkbox = div.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      selectedItems.add(index);
      div.classList.add('selected');
    } else {
      selectedItems.delete(index);
      div.classList.remove('selected');
    }
    updateSelectedCount();
  });

  return div;
}

/**
 * Shows categorization suggestions
 */
function showCategorizeSuggestions(data) {
  pageIcon.textContent = '📁';
  pageTitle.textContent = 'Tag Categorization';

  const categories = data.categories;

  // Statistics
  statsArea.innerHTML = `
    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">Categories</span>
        <span class="stat-value">${categories.length}</span>
      </div>
    </div>
  `;
  statsArea.style.display = 'block';

  // Info message
  showMessage('This is an overview of your categorized tags. This view is informational and requires no action.', 'info');

  // Categories
  const section = document.createElement('div');
  section.className = 'section';

  categories.forEach((category) => {
    const group = document.createElement('div');
    group.className = 'category-group';

    group.innerHTML = `
      <div class="category-header">
        ${category.category}
        <span class="category-description">${category.description}</span>
      </div>
      <div class="category-tags">
        ${category.tags.map(tag => `<span class="tag-name tag-group">${tag}</span>`).join('')}
      </div>
    `;

    section.appendChild(group);
  });

  contentArea.appendChild(section);

  // Close button only
  actionArea.innerHTML = '<button id="closeBtn" class="btn-secondary">Close</button>';
  actionArea.style.display = 'flex';
  document.getElementById('closeBtn').addEventListener('click', () => window.close());
}

/**
 * Updates progress bar
 */
function updateProgress(current, total, details = '') {
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressPercentage = document.getElementById('progressPercentage');
  const progressCount = document.getElementById('progressCount');
  const progressDetails = document.getElementById('progressDetails');

  progressContainer.classList.add('active');

  const percentage = Math.round((current / total) * 100);
  progressBar.style.width = percentage + '%';
  progressPercentage.textContent = percentage + '%';
  progressCount.textContent = `${current} / ${total}`;

  if (details) {
    progressDetails.textContent = details;
  }
}

/**
 * Hides progress bar
 */
function hideProgress() {
  const progressContainer = document.getElementById('progressContainer');
  progressContainer.classList.remove('active');
}

/**
 * Applies selected suggestions with progress tracking
 */
async function applySelectedSuggestions() {
  if (selectedItems.size === 0) {
    showMessage('Please select at least one suggestion.', 'error');
    return;
  }

  const confirmed = confirm(`Apply ${selectedItems.size} suggestion(s)?\n\nThis cannot be undone!`);

  if (!confirmed) return;

  applyBtn.disabled = true;
  applyBtn.textContent = 'Applying...';
  cancelBtn.disabled = true;

  // Hide content and stats during processing
  contentArea.style.display = 'none';
  statsArea.style.display = 'none';

  try {
    const selected = Array.from(selectedItems).map(i => currentSuggestions[i]);

    let allTagPairs = [];

    if (currentType === 'similar') {
      // Convert to tag pairs for mergeTags
      for (const suggestion of selected) {
        const targetTag = suggestion.suggested_name;
        for (const sourceTag of suggestion.group) {
          if (sourceTag !== targetTag) {
            allTagPairs.push({ sourceTag, targetTag });
          }
        }
      }
    } else if (currentType === 'rename') {
      // Convert to tag pairs for renaming
      allTagPairs = selected.map(s => ({
        sourceTag: s.old_name,
        targetTag: s.new_name
      }));
    }

    // Process in chunks for progress feedback
    const CHUNK_SIZE = 20; // Process 20 pairs at a time
    const totalPairs = allTagPairs.length;
    const allResults = [];
    let processedPairs = 0;

    updateProgress(0, totalPairs, 'Starting merge process...');

    for (let i = 0; i < allTagPairs.length; i += CHUNK_SIZE) {
      const chunk = allTagPairs.slice(i, i + CHUNK_SIZE);
      const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
      const totalChunks = Math.ceil(allTagPairs.length / CHUNK_SIZE);

      updateProgress(
        processedPairs,
        totalPairs,
        `Processing batch ${chunkNum}/${totalChunks}...`
      );

      const response = await browser.runtime.sendMessage({
        action: 'mergeTags',
        tagPairs: chunk
      });

      if (response.error) {
        throw new Error(response.error);
      }

      allResults.push(...response.results);
      processedPairs += chunk.length;

      updateProgress(processedPairs, totalPairs, `Completed batch ${chunkNum}/${totalChunks}`);

      // Small delay for UI update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Combine all results
    const response = {
      success: true,
      results: allResults,
      stats: {
        pairsProcessed: allResults.length,
        messagesUpdated: allResults.reduce((sum, r) => sum + r.movedCount, 0),
        sourceTagsCount: new Set(allResults.map(r => r.sourceTag)).size,
        targetTagsCount: new Set(allResults.map(r => r.targetTag)).size,
        tagsReduced: new Set(allResults.map(r => r.sourceTag)).size - new Set(allResults.map(r => r.targetTag)).size
      }
    };

    hideProgress();

    // Success - Verwende Statistiken aus Response
    const stats = response.stats || {
      pairsProcessed: response.results.length,
      messagesUpdated: response.results.reduce((sum, r) => sum + r.movedCount, 0),
      tagsReduced: 0
    };

    // Hole aktuelle Tag-Anzahl
    const currentTagsResponse = await browser.runtime.sendMessage({ action: 'analyzeTags' });
    const currentTagCount = currentTagsResponse.success ? currentTagsResponse.tags.length : '?';
    const usedTagCount = currentTagsResponse.success ? currentTagsResponse.tags.filter(t => t.usage > 0).length : '?';

    clearElement(contentArea);
    actionArea.style.display = 'none';

    // Zeige detaillierte Statistiken
    statsArea.innerHTML = `
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">📦 Tag Pairs Merged</span>
          <span class="stat-value">${stats.pairsProcessed}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📧 Emails Updated</span>
          <span class="stat-value">${stats.messagesUpdated}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">🗑️ Tags Reduced</span>
          <span class="stat-value">${stats.tagsReduced}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📊 Total Tags</span>
          <span class="stat-value">${currentTagCount} (${usedTagCount} used)</span>
        </div>
      </div>
    `;
    statsArea.style.display = 'block';

    // Hinweis ob weitere Analyse empfohlen wird
    let recommendation = '';
    if (stats.tagsReduced === 0) {
      recommendation = `\n\n✨ Your tags are well organized! No further optimization needed.`;
    } else if (stats.tagsReduced > 0) {
      // Berechne Reduktionsrate
      const reductionRate = (stats.tagsReduced / stats.sourceTagsCount) * 100;

      if (reductionRate < 30 && currentTagCount > 500) {
        recommendation = `\n\n💡 Tip: Only ${Math.round(reductionRate)}% reduction achieved. If you didn't use Deep Analysis Mode, try it for better results.`;
      } else if (reductionRate >= 30) {
        recommendation = `\n\n✅ Great! ${Math.round(reductionRate)}% of processed tags were consolidated. Your tags are now well optimized.`;
      }
    }

    showMessage(
      `✅ Successfully completed!\n\n${stats.pairsProcessed} tag pairs merged.\n${stats.messagesUpdated} emails updated.\n${stats.tagsReduced} tags reduced.\n\n📊 Current total: ${currentTagCount} tags (${usedTagCount} used)${recommendation}`,
      'success'
    );

    // Füge "Re-analyze" Button hinzu
    actionArea.innerHTML = `
      <button id="reAnalyzeBtn" class="btn-primary">🔄 Run Analysis Again</button>
      <button id="closeBtn" class="btn-secondary">Close</button>
    `;
    actionArea.style.display = 'flex';

    document.getElementById('reAnalyzeBtn').addEventListener('click', async () => {
      // Öffne Popup wieder für neue Analyse
      await browser.tabs.create({
        url: browser.runtime.getURL('popup/popup.html')
      });
      window.close();
    });

    document.getElementById('closeBtn').addEventListener('click', () => window.close());

  } catch (error) {
    hideProgress();
    contentArea.style.display = 'block';
    showMessage('Error applying changes: ' + error.message, 'error');
    applyBtn.disabled = false;
    applyBtn.textContent = 'Apply Selected';
    cancelBtn.disabled = false;
  }
}

/**
 * Selects all suggestions
 */
function selectAll() {
  document.querySelectorAll('.suggestion-checkbox').forEach((cb, index) => {
    cb.checked = true;
    selectedItems.add(index);
    cb.closest('.suggestion-item').classList.add('selected');
  });
  updateSelectedCount();
}

/**
 * Deselects all suggestions
 */
function selectNone() {
  document.querySelectorAll('.suggestion-checkbox').forEach((cb, index) => {
    cb.checked = false;
    selectedItems.delete(index);
    cb.closest('.suggestion-item').classList.remove('selected');
  });
  updateSelectedCount();
}

/**
 * Updates counter
 */
function updateSelectedCount() {
  const counter = document.getElementById('selectedCount');
  if (counter) {
    counter.textContent = selectedItems.size;
  }

  applyBtn.disabled = selectedItems.size === 0;
}

/**
 * Shows message
 */
function showMessage(text, type) {
  const div = document.createElement('div');
  div.className = type === 'error' ? 'error-message' :
                   type === 'success' ? 'success-message' :
                   'section';
  div.textContent = text;
  div.style.whiteSpace = 'pre-line';

  clearElement(messageArea);
  messageArea.appendChild(div);
}
