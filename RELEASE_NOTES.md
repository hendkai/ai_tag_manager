# AI Tag Manager v1.1.0 - Production Ready 🎉

This release marks the extension as production-ready with comprehensive token limit handling, user warnings, and complete documentation.

## 🔥 New Features

### Deep Analysis Mode
- Analyze ALL tags in a single AI request for comprehensive similarity detection
- Auto-enabled for 500+ tags
- Compares all tags with each other in one pass
- Finds maximum similarities without batch limitations

### Token Limit Detection & Warnings
- Automatic detection when AI hits output token limits
- Shows coverage percentage (tags analyzed vs. total)
- Displays expected vs. found groups comparison
- Provides actionable solutions:
  - Switch to larger model (GPT-4o, Claude Sonnet, Gemini Pro)
  - Disable Deep Analysis Mode (uses batches instead)
  - Remove unused tags first to reduce count

### UI Warning System
- Warning box in popup after analysis showing coverage
- Prominent warning panel in results page with detailed statistics
- Current model information and recommendations
- Educational content explaining token limits

### Truncated JSON Recovery
- Automatically recovers partial results from incomplete AI responses
- Extracts all complete groups from truncated JSON
- Prevents complete failure when token limit is reached
- Shows exactly how many groups were recovered

### Tag Deduplication
- Automatically removes duplicate tags from multiple groups
- Fixes AI errors where tags appear in multiple groups (118% coverage bug)
- Ensures each tag only appears once

### Educational Content
- Comprehensive "Understanding AI Models & Token Limits" section in settings
- Model comparison table with quality ratings
- Recommendations by tag count (500, 1000, 2000+ tags)
- Deep Analysis Mode explanation with benefits/limitations

### Model Recommendations
- Per-provider recommendations (OpenAI, Anthropic, Google)
- Clear indication of best models for different tag counts
- ⭐ Highlighted recommended models in dropdowns
- Quality ratings for each model

## 🔧 Improvements

- **AI Prompts**: Optimized to use compact 3-5 word reasons (saves tokens for more groups)
- **Response Format**: Consistent object format with groups + warning metadata
- **Model Dropdown Labels**: Updated with capacity and quality information
- **Documentation**: Complete English translation with expanded guides

## 🐛 Bug Fixes

- Fixed tags appearing in multiple groups (118% coverage bug)
- Fixed JSON parse errors from truncated AI responses
- Incomplete results now properly recovered and displayed to user

## 📊 What You Get

**Version 1.1.0** includes:
- 🔥 Deep Analysis Mode (ALL tags in one pass)
- ⚠️ Smart Token Limit Warnings (UI + Console)
- 🔄 Automatic Partial Result Recovery
- 🎯 Tag Deduplication (fixes multi-group bug)
- 📚 Educational Content (token limits explained)
- ⭐ Model Recommendations (per tag count)
- 🤖 4 AI Providers (OpenAI, Anthropic, Google, Ollama)
- ✨ Interactive Results Page
- 📊 Progress Tracking
- 🌍 Complete English Documentation

## 📦 Installation

### From Release (Recommended)
1. Download `ai-tag-manager-v1.1.0.xpi` from this release
2. Open Thunderbird
3. Go to `Menu` → `Add-ons and Themes` (Ctrl+Shift+A)
4. Click the gear icon ⚙️
5. Select `Install Add-on From File...`
6. Choose the downloaded .xpi file

### From Source
```bash
git clone https://github.com/hendkai/ai_tag_manager
cd ai_tag_manager
# Load in Thunderbird via about:debugging
```

## 🚀 Getting Started

1. **Configure API Key**: Click AI Tag Manager icon → Settings
2. **Choose Provider**: OpenAI, Anthropic, Google AI, or Ollama (local)
3. **Analyze Tags**: Click "Analyze Tags" to see your tag statistics
4. **Find Similarities**: Enable Deep Analysis Mode for best results with 500+ tags

## 📊 Model Recommendations

| Tag Count | Best Model | Output Limit | Quality |
|-----------|------------|--------------|---------|
| < 500 tags | Any model | - | Good |
| 500-1000 tags | GPT-4o-mini, Gemini 1.5 Flash | 16K / 8K | Good |
| 1000-2000 tags | ⭐ GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro | 16K / 8K | Excellent |
| 2000+ tags | ⭐ GPT-4o only | 16K | Excellent |

## 🔒 Privacy & Security

- API keys stored locally only (in Thunderbird's Storage API)
- No data collection
- Only tag names sent to AI APIs (never email content!)
- Ollama option for completely local AI processing

## 📝 Full Changelog

See [CHANGELOG.md](https://github.com/hendkai/ai_tag_manager/blob/main/CHANGELOG.md) for complete version history.

## 🤝 Contributing

Contributions welcome! Please open an issue or pull request.

## 📄 License

MIT License - see [LICENSE](https://github.com/hendkai/ai_tag_manager/blob/main/LICENSE) file

---

**Developed with ❤️ for better email management**

🤖 Co-Authored-By: Claude via [Claude Code](https://claude.com/claude-code)
