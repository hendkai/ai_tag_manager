# 🤖 AI Tag Manager for Thunderbird

An intelligent Thunderbird extension that uses artificial intelligence to automatically manage, optimize, and clean up your email tags.

## ✨ Features

### AI-Powered Tag Management
- **Find Similar Tags**: AI analyzes your tags and finds similar or duplicate tags (e.g., "Project", "Projects", "project")
- **Improve Tag Names**: Get suggestions for more consistent and clearer tag names
- **Automatic Categorization**: Organize your tags into meaningful categories (Projects, Priorities, Status, etc.)
- **⭐ Interactive Suggestions**: All AI suggestions are displayed in a clear preview page - you decide which ones to apply!
- **🔥 Deep Analysis Mode**: Analyze ALL tags in a single request for comprehensive similarity detection

### Tag Management
- **Tag Analysis**: Overview of all tags with usage statistics
- **Merge Tags**: Automatically merge similar tags
- **Cleanup**: Remove unused tags automatically
- **Consistency**: Ensure uniform naming conventions
- **Smart Warnings**: Token limit detection with actionable recommendations

### Supported AI Providers
- **OpenAI** (GPT-4o, GPT-4o-mini, GPT-3.5)
  - ⭐ GPT-4o recommended for 1000+ tags (16K output limit)
- **Anthropic** (Claude 3.5 Sonnet, Claude 3.5 Haiku)
  - ⭐ Claude 3.5 Sonnet recommended for 1000+ tags (8K output limit)
- **Google AI** (Gemini 1.5 Flash, Gemini 1.5 Pro)
  - ⭐ Gemini 1.5 Pro recommended for 1000+ tags (8K output limit)
- **Ollama** (local, free - llama3.2, mistral, gemma2, etc.)

## 📦 Installation

### From Source

1. **Clone or download the repository**
   ```bash
   git clone https://github.com/hendkai/ai_tag_manager
   cd ai_tag_manager
   ```

2. **Install in Thunderbird**
   - Open Thunderbird
   - Go to `Menu` → `Add-ons and Themes` (or press `Ctrl+Shift+A`)
   - Click the gear icon ⚙️
   - Select `Install Add-on From File...`
   - Navigate to the folder and select `manifest.json`

### Alternative: Debug Mode

For development and testing:
1. Open `about:debugging` in Thunderbird
2. Click `This Thunderbird`
3. Click `Load Temporary Add-on...`
4. Select the `manifest.json` file

## 🚀 Getting Started

### 1. Configure API Key

Open the extension settings:
- Click the AI Tag Manager icon in the toolbar
- Select `⚙️ Open Settings`

Choose your preferred AI provider and enter your API key:

#### OpenAI
- Register at [platform.openai.com](https://platform.openai.com/)
- Create an API key at [API Keys](https://platform.openai.com/api-keys)
- Recommended model: `gpt-4o` for 1000+ tags, `gpt-4o-mini` for <1000 tags

#### Anthropic (Claude)
- Register at [console.anthropic.com](https://console.anthropic.com/)
- Create an API key
- Recommended model: `claude-3-5-sonnet-20241022` for best quality

#### Google AI
- Create an API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Recommended model: `gemini-1.5-pro` for 1000+ tags

#### Ollama (Local & Free!)
- Install [Ollama](https://ollama.ai)
- Run: `ollama pull llama3.2`
- No API costs! Runs completely locally.

### 2. Analyze Tags

1. Click the AI Tag Manager icon
2. Click `📊 Analyze Tags`
3. You'll see an overview of your tags

### 3. Use AI Functions

#### Find Similar Tags
- Click `🔍 Find Similar Tags`
- Enable **🔥 Deep Analysis Mode** for comprehensive analysis (recommended for 500+ tags)
- AI analyzes your tags and suggests merges
- **Preview page opens**: Review each suggestion individually
- Select which suggestions to apply
- Click "Apply Selected" to execute chosen changes

#### Improve Tag Names
- Click `✨ Improve Tag Names`
- Get suggestions for more consistent names
- **Interactive selection**: Choose only the improvements you like
- E.g., "ToDo" → "todo", "IMPORTANT" → "important"

#### Categorize Tags
- Click `📁 Categorize Tags`
- AI sorts your tags into meaningful categories
- **Overview view**: Informative display of your organized tags
- Helps organize large tag collections

## 📊 Understanding Token Limits

### What are tokens?
Tokens are pieces of text that AI models process. When analyzing tags, the AI needs tokens for both reading your tags (input) and writing suggestions (output).

### Why does this matter?
Each AI model has a **maximum output limit**. With many tags (500+), the AI might find hundreds of similar groups, but if it hits the token limit, it can only return a fraction of them.

### Model Recommendations

| Tag Count | Best Model | Output Limit | Quality |
|-----------|------------|--------------|---------|
| < 500 tags | Any model | - | Good |
| 500-1000 tags | GPT-4o-mini, Gemini 1.5 Flash | 16K / 8K | Good |
| 1000-2000 tags | ⭐ GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro | 16K / 8K | Excellent |
| 2000+ tags | ⭐ GPT-4o only | 16K | Excellent |

### What happens with insufficient tokens?
If you have 1000 tags and use a smaller model, the AI might only return 30-50 groups instead of 100+. The extension will:
- ✅ Automatically recover partial results
- ⚠️ Display a warning with coverage percentage
- 💡 Recommend appropriate models for your tag count

## ⚙️ Settings

### Tag Management Options

- **Automatic Merging**: Tags are merged after confirmation
- **Similarity Threshold**: How similar tags must be (0.0 - 1.0)
- **Remove Unused Tags**: Automatic deletion during cleanup
- **Case Sensitive**: Distinction during analysis

### Advanced Options

- **Max. Tags per Analysis**: Limit for very large tag lists
- **Detailed Logging**: For debugging and development
- **🔥 Deep Analysis Mode**: Send ALL tags in ONE request for maximum coverage

## 🔒 Privacy & Security

- **API keys are stored locally only** (in Thunderbird's Storage API)
- **No data collection**: This extension collects no user data
- **Only tag names are sent to AI APIs** (never email content!)
- **Ollama option**: Use AI completely locally without cloud connection

## 🛠️ Development

### Project Structure

```
ai_tag_manager/
├── manifest.json           # Extension manifest
├── scripts/
│   ├── background.js       # Background logic
│   └── aiIntegration.js    # AI API integration
├── popup/
│   ├── popup.html          # Popup UI
│   └── popup.js            # Popup logic
├── results/                # ⭐ NEW
│   ├── results.html        # Preview page for AI suggestions
│   └── results.js          # Interactive selection logic
├── options/
│   ├── options.html        # Settings page
│   └── options.js          # Settings logic
├── icons/                  # App icons
└── README.md
```

### Debugging

1. Open `about:debugging` in Thunderbird
2. Click on the extension
3. Open the `Console` for logs
4. Enable "Detailed Logging" in settings

### View Logs

```javascript
// In Browser Console (Ctrl+Shift+J)
browser.runtime.sendMessage({action: 'analyzeTags'})
  .then(console.log)
```

## 📝 Known Limitations

- **API Costs**: OpenAI, Anthropic, and Google AI incur costs (use Ollama for free alternative)
- **Rate Limits**: AI APIs have request limits
- **Token Limits**: Large tag lists (1000+) may require larger models for complete results
- **Thunderbird >= 91**: Requires Thunderbird version 91 or higher

## 🤝 Contributing

Contributions are welcome! Please create a pull request or open an issue.

### Set Up Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd ai_tag_manager

# Load in Thunderbird (about:debugging)
```

## 📄 License

MIT License - see LICENSE file

## 🆘 Support

For questions or issues:
1. Check the [FAQ](#faq)
2. Open an issue on GitHub
3. Enable "Detailed Logging" for debug information

## ❓ FAQ

### Why doesn't the AI find similar tags?

- Your tags might already be very well organized
- Try reducing the similarity threshold
- Ensure the API key is correct
- For 1000+ tags, use a larger model (GPT-4o recommended)

### Are my emails sent to the AI?

No! Only the **tag names** are analyzed, never email content.

### Can I use the extension without internet?

Yes, with **Ollama**! Install Ollama locally and all AI functions run offline.

### How much does it cost?

- **Ollama**: Free (local)
- **OpenAI**: ~$0.001 per request (gpt-4o-mini), ~$0.005 per request (gpt-4o)
- **Anthropic**: ~$0.003 per request (Claude 3.5 Haiku), ~$0.015 per request (Claude 3.5 Sonnet)
- **Google**: Free (with limits), then ~$0.001 per request

### Which AI provider is best?

- **For cost**: Ollama (free) or OpenAI gpt-4o-mini
- **For quality with large tag lists (1000+)**: GPT-4o or Claude 3.5 Sonnet
- **For privacy**: Ollama (completely local)
- **For speed**: Gemini 1.5 Flash or GPT-4o-mini

### What is Deep Analysis Mode?

Deep Analysis Mode sends ALL your tags in ONE single AI request for comprehensive comparison. Benefits:
- ✅ Finds every possible similarity in a single pass
- ✅ Compares all tags with each other
- ✅ Best results for large tag collections
- ⚠️ Requires larger models (GPT-4o, Claude Sonnet) for 1000+ tags
- ⚠️ Higher API costs but fewer total requests

### I'm getting token limit warnings. What should I do?

When you see "Token limit reached" warnings:
1. **Best solution**: Switch to a larger model (GPT-4o for 1000+ tags)
2. **Alternative**: Disable Deep Analysis Mode (uses batches instead)
3. **Optional**: Remove unused tags first to reduce total count

The extension automatically recovers partial results and shows you exactly how many groups were found vs. expected.

## 🎯 Roadmap

- [x] Deep Analysis Mode for comprehensive tag comparison
- [x] Token limit detection and warnings
- [x] Automatic partial result recovery
- [x] Model recommendations based on tag count
- [ ] Undo/Redo for tag changes
- [ ] Tag rules and automation
- [ ] More AI providers (Mistral, etc.)
- [ ] Tag suggestions based on email content
- [ ] Import/Export tag configurations
- [ ] Multi-language user interface

---

**Developed with ❤️ for better email management**
