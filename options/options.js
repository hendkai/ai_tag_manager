/**
 * Options Page Script
 */

// Elemente
const aiProviderSelect = document.getElementById('aiProvider');
const saveButton = document.getElementById('saveButton');
const testButton = document.getElementById('testButton');
const messageDiv = document.getElementById('message');

// Provider-spezifische Einstellungen
const providerSettings = {
  openai: document.getElementById('openai-settings'),
  anthropic: document.getElementById('anthropic-settings'),
  google: document.getElementById('google-settings'),
  ollama: document.getElementById('ollama-settings')
};

// Zeige/Verstecke Provider-Einstellungen
aiProviderSelect.addEventListener('change', (e) => {
  Object.values(providerSettings).forEach(el => el.classList.remove('active'));
  const selected = e.target.value;
  if (providerSettings[selected]) {
    providerSettings[selected].classList.add('active');
  }
});

// Load saved settings
async function loadSettings() {
  try {
    const settings = await browser.storage.local.get({
      // KI-Anbieter
      aiProvider: 'openai',

      // OpenAI
      openaiApiKey: '',
      openaiModel: 'gpt-4o-mini',
      openaiEndpoint: '',

      // Anthropic
      anthropicApiKey: '',
      anthropicModel: 'claude-3-5-sonnet-20241022',

      // Google
      googleApiKey: '',
      googleModel: 'gemini-1.5-flash',

      // Ollama
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3.2',

      // Tag-Management
      autoMerge: false,
      similarityThreshold: 0.8,
      removeUnused: false,
      caseSensitive: false,

      // Custom Prompts
      customPromptSimilar: 'Bevorzuge deutsche Tag-Namen, wo sinnvoll.',
      customPromptRename: 'Bevorzuge deutsche Tag-Namen, wo sinnvoll.',
      customPromptCategorize: 'Erstelle Kategorienamen auf Deutsch.',

      // Erweitert
      maxTagsPerAnalysis: 100,
      enableLogging: false
    });

    // Set values
    document.getElementById('aiProvider').value = settings.aiProvider;

    document.getElementById('openaiApiKey').value = settings.openaiApiKey;
    document.getElementById('openaiModel').value = settings.openaiModel;
    document.getElementById('openaiEndpoint').value = settings.openaiEndpoint;

    document.getElementById('anthropicApiKey').value = settings.anthropicApiKey;
    document.getElementById('anthropicModel').value = settings.anthropicModel;

    document.getElementById('googleApiKey').value = settings.googleApiKey;
    document.getElementById('googleModel').value = settings.googleModel;

    document.getElementById('ollamaEndpoint').value = settings.ollamaEndpoint;
    document.getElementById('ollamaModel').value = settings.ollamaModel;

    document.getElementById('autoMerge').checked = settings.autoMerge;
    document.getElementById('similarityThreshold').value = settings.similarityThreshold;
    document.getElementById('removeUnused').checked = settings.removeUnused;
    document.getElementById('caseSensitive').checked = settings.caseSensitive;

    document.getElementById('customPromptSimilar').value = settings.customPromptSimilar;
    document.getElementById('customPromptRename').value = settings.customPromptRename;
    document.getElementById('customPromptCategorize').value = settings.customPromptCategorize;

    document.getElementById('maxTagsPerAnalysis').value = settings.maxTagsPerAnalysis;
    document.getElementById('enableLogging').checked = settings.enableLogging;

    // Show active provider settings
    Object.values(providerSettings).forEach(el => el.classList.remove('active'));
    if (providerSettings[settings.aiProvider]) {
      providerSettings[settings.aiProvider].classList.add('active');
    }
  } catch (error) {
    showMessage('Error loading settings: ' + error.message, 'error');
  }
}

// Save settings
saveButton.addEventListener('click', async () => {
  try {
    const settings = {
      aiProvider: document.getElementById('aiProvider').value,

      // IMPORTANT: Trim whitespace from API keys!
      openaiApiKey: document.getElementById('openaiApiKey').value.trim(),
      openaiModel: document.getElementById('openaiModel').value,
      openaiEndpoint: document.getElementById('openaiEndpoint').value.trim(),

      anthropicApiKey: document.getElementById('anthropicApiKey').value.trim(),
      anthropicModel: document.getElementById('anthropicModel').value,

      googleApiKey: document.getElementById('googleApiKey').value.trim(),
      googleModel: document.getElementById('googleModel').value,

      ollamaEndpoint: document.getElementById('ollamaEndpoint').value.trim(),
      ollamaModel: document.getElementById('ollamaModel').value,

      autoMerge: document.getElementById('autoMerge').checked,
      similarityThreshold: parseFloat(document.getElementById('similarityThreshold').value),
      removeUnused: document.getElementById('removeUnused').checked,
      caseSensitive: document.getElementById('caseSensitive').checked,

      customPromptSimilar: document.getElementById('customPromptSimilar').value.trim(),
      customPromptRename: document.getElementById('customPromptRename').value.trim(),
      customPromptCategorize: document.getElementById('customPromptCategorize').value.trim(),

      maxTagsPerAnalysis: parseInt(document.getElementById('maxTagsPerAnalysis').value),
      enableLogging: document.getElementById('enableLogging').checked
    };

    await browser.storage.local.set(settings);
    showMessage('✓ Settings saved successfully!', 'success');
  } catch (error) {
    showMessage('Error saving: ' + error.message, 'error');
  }
});

// Test AI connection
testButton.addEventListener('click', async () => {
  showMessage('Testing connection...', 'info');
  testButton.disabled = true;

  try {
    // Get current provider from the form (not from storage)
    const provider = document.getElementById('aiProvider').value;
    let apiKey = '';

    // Get the API key from the current input field values (not from storage!)
    // IMPORTANT: Trim whitespace!
    switch (provider) {
      case 'openai':
        apiKey = document.getElementById('openaiApiKey').value.trim();
        if (!apiKey) {
          throw new Error('OpenAI API Key missing - please enter it in the field above');
        }
        break;
      case 'anthropic':
        apiKey = document.getElementById('anthropicApiKey').value.trim();
        if (!apiKey) {
          throw new Error('Anthropic API Key missing - please enter it in the field above');
        }
        break;
      case 'google':
        apiKey = document.getElementById('googleApiKey').value.trim();
        if (!apiKey) {
          throw new Error('Google AI API Key missing - please enter it in the field above');
        }
        break;
      case 'ollama':
        // Ollama doesn't require API key
        break;
      default:
        throw new Error('Unknown provider');
    }

    // Send test request to Background Script
    const response = await browser.runtime.sendMessage({
      action: 'testAIConnection',
      provider: provider,
      apiKey: apiKey
    });

    if (response.success) {
      showMessage('✓ Connection successful! AI is responding.', 'success');
    } else {
      showMessage('✗ Connection failed: ' + response.error, 'error');
    }
  } catch (error) {
    showMessage('✗ Error testing: ' + error.message, 'error');
  } finally {
    testButton.disabled = false;
  }
});

// Show message
function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = type;
  messageDiv.style.display = 'block';

  // Hide after 5 seconds
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}

// Load settings on start
loadSettings();
