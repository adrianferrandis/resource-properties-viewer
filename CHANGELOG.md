# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-05-07

### Added

- Initial release
- Visual table editor for `.properties` files
- Custom editor provider using VSCode's CustomTextEditor API
- Automatic detection of related locale files (e.g., `messages.properties`, `messages_en.properties`)
- Multi-locale support with columns for each locale
- Inline cell editing with direct file persistence
- Unicode escape sequence handling (`\uXXXX`)
- Properties file parsing with comment preservation
- Properties file serialization
- Unit tests for parser and serializer
- Integration tests for editor functionality
- CI pipeline with GitHub Actions
- This CHANGELOG file

### Features

- **Table View**: Spreadsheet-like view with keys as rows and locales as columns
- **Locale Discovery**: Automatically finds related locale files in the same directory
- **Edit Persistence**: Edits are written directly to the appropriate locale file
- **Missing Key Indicators**: Visual highlighting when a key is missing from a locale
- **Unicode Support**: Proper encoding/decoding of Unicode escape sequences

### Technical

- Built with TypeScript
- Uses VSCode Custom Text Editor API
- Supports VSCode 1.74.0+
- Node.js 18+ required for development