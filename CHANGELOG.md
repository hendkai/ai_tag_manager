# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-26

### Added
- **🔥 Deep Analysis Mode**: Analyze ALL tags in a single AI request for comprehensive similarity detection
  - Auto-enabled for 500+ tags
  - Compares all tags with each other in one pass
  - Finds maximum similarities without batch limitations
- **⚠️ Token Limit Detection**: Automatic detection and warning when AI hits output token limits
  - Shows coverage percentage (tags analyzed vs. total)
  - Displays expected vs. found groups comparison
  - Provides actionable solutions (switch model, disable deep mode, reduce tags)
- **Truncated JSON Recovery**: Automatically recovers partial results from incomplete AI responses
  - Extracts all complete groups from truncated JSON
  - Prevents complete failure when token limit is reached
- **Tag Deduplication**: Automatically removes duplicate tags from multiple groups
  - Fixes AI errors where tags appear in multiple groups
  - Ensures each tag only appears once
- **UI Warning System**:
  - Warning box in popup after analysis
  - Prominent warning panel in results page with detailed statistics
  - Current model information and recommendations
- **Educational Content**:
  - Comprehensive "Understanding AI Models & Token Limits" section in settings
  - Model comparison table with quality ratings
  - Recommendations by tag count (500, 1000, 2000+ tags)
  - Deep Analysis Mode explanation
- **Model Recommendations**:
  - Per-provider recommendations (OpenAI, Anthropic, Google)
  - Clear indication of best models for different tag counts
  - ⭐ Highlighted recommended models in dropdowns

### Changed
- **AI Prompts**: Optimized to use compact 3-5 word reasons (saves tokens for more groups)
- **Response Format**: Consistent object format with groups + warning metadata
- **Model Dropdown Labels**: Updated with capacity and quality information
- **README**: Translated to English with expanded documentation
- **Version**: Bumped to 1.1.0

### Fixed
- Tags appearing in multiple groups (118% coverage bug)
- JSON parse errors from truncated AI responses now handled gracefully
- Incomplete results now properly recovered and displayed to user

## [1.0.0] - 2024-10-24

### Added
- Initial release
- ⭐ Interactive preview page for AI suggestions
  - Users can select/deselect each suggestion individually
  - Shows preview of changes (old → new)
  - Apply only selected suggestions
- AI-powered tag analysis for Thunderbird
- Support for OpenAI (GPT-4o, GPT-4o-mini, GPT-3.5)
- Support for Anthropic (Claude 3.5 Sonnet, Claude 3.5 Haiku)
- Support for Google AI (Gemini 1.5 Flash, Gemini 1.5 Pro)
- Support for Ollama (local, free)
- Automatic finding of similar tags
- Tag name improvement suggestions
- Automatic tag categorization
- Tag analysis with usage statistics
- Tag cleanup (remove unused tags)
- Merge similar tags
- Settings page for API configuration
- Popup interface for quick access

### Features
- Complete privacy control (only tag names are sent to AI)
- Offline mode with Ollama
- Customizable similarity thresholds
- Support for all Thunderbird accounts and folders
- Recursive processing of folder structures
- Progress bar during tag merge operations
- Detailed logging for debugging

## [Unreleased]

### Planned
- Undo/Redo functionality for tag changes
- Tag rules and automation
- More AI providers (Mistral, etc.)
- Tag suggestions based on email content
- Import/Export of tag configurations
- Multi-language user interface
- Automatic tagging of new emails
- Tag templates and presets
- Batch processing optimization
- Tag usage analytics
