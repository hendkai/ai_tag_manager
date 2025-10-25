/**
 * Results Page - Shows AI suggestions for confirmation
 */

let currentSuggestions = [];
let currentType = '';
let selectedItems = new Set();

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

  // Show corresponding view
  switch (currentType) {
    case 'similar':
      showSimilarTagsSuggestions(currentSuggestions);
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
function showSimilarTagsSuggestions(suggestions) {
  pageIcon.textContent = '🔍';
  pageTitle.textContent = 'Merge Similar Tags';

  // Statistics
  const totalGroups = suggestions.length;
  const totalTags = suggestions.reduce((sum, s) => sum + s.group.length, 0);

  statsArea.innerHTML = `
    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">Groups Found</span>
        <span class="stat-value">${totalGroups}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Tags Affected</span>
        <span class="stat-value">${totalTags}</span>
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
 * Applies selected suggestions
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

  try {
    const selected = Array.from(selectedItems).map(i => currentSuggestions[i]);

    let response;

    if (currentType === 'similar') {
      // Convert to tag pairs for mergeTags
      const tagPairs = [];
      for (const suggestion of selected) {
        const targetTag = suggestion.suggested_name;
        for (const sourceTag of suggestion.group) {
          if (sourceTag !== targetTag) {
            tagPairs.push({ sourceTag, targetTag });
          }
        }
      }

      response = await browser.runtime.sendMessage({
        action: 'mergeTags',
        tagPairs: tagPairs
      });

    } else if (currentType === 'rename') {
      // Convert to tag pairs for renaming
      const tagPairs = selected.map(s => ({
        sourceTag: s.old_name,
        targetTag: s.new_name
      }));

      response = await browser.runtime.sendMessage({
        action: 'mergeTags',
        tagPairs: tagPairs
      });
    }

    if (response.error) {
      throw new Error(response.error);
    }

    // Success
    const totalMoved = response.results.reduce((sum, r) => sum + r.movedCount, 0);

    contentArea.innerHTML = '';
    actionArea.style.display = 'none';
    statsArea.style.display = 'none';

    showMessage(
      `✅ Successfully completed!\n\n${response.results.length} tag operations performed.\n${totalMoved} emails updated.`,
      'success'
    );

    setTimeout(() => window.close(), 3000);

  } catch (error) {
    showMessage('Error applying changes: ' + error.message, 'error');
    applyBtn.disabled = false;
    applyBtn.textContent = 'Apply Selected';
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

  messageArea.innerHTML = '';
  messageArea.appendChild(div);
}
