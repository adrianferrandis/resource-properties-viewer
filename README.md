# Resource Properties Viewer

[![Version](https://img.shields.io/visual-studio-marketplace/v/adrianferrandis.resource-properties-viewer)](https://marketplace.visualstudio.com/items?itemName=adrianferrandis.resource-properties-viewer)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/adrianferrandis.resource-properties-viewer)](https://marketplace.visualstudio.com/items?itemName=adrianferrandis.resource-properties-viewer)
[![Tests](https://img.shields.io/badge/tests-121%20passing-brightgreen.svg)](https://github.com/adrianferrandis/resource-properties-viewer/actions)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> A powerful Visual Studio Code extension for editing Java `.properties` files with a modern, spreadsheet-like interface. Inspired by Eclipse's ResourceBundle Editor, but built specifically for VS Code with native integration and real-time synchronization.

## Features

### 🎨 Visual Table Editor
- **Spreadsheet-like interface**: Keys as rows and locales as columns
- **Inline cell editing**: Double-click any cell to edit directly
- **Real-time updates**: Changes reflected immediately without manual save
- **Support for both single-file and multi-locale bundles**

### 🌍 Multi-Locale Support
- **Automatic locale detection**: Discovers related files (`messages.properties`, `messages_en.properties`, etc.)
- **Simultaneous editing**: Edit all locales from one unified view
- **Missing translation indicators**: Visual highlighting for incomplete translations
- **Standard Java naming conventions**: Works out of the box with existing projects

### 🌳 Hierarchical Tree View
- **Namespaced keys**: Organize keys hierarchically (e.g., `ui.dialog.title`)
- **Collapsible sections**: Expand/collapse namespaces
- **Prefix grouping**: Related keys stay together

### 🔍 Advanced Filtering
- **Two filter modes**:
  - 🔑 **Keys only**: Search only in key names
  - 📝 **Keys + Values**: Search in both keys and values
- **Instant search**: Results update as you type
- **Visual feedback**: Clear mode indicators

### 🛠️ Key Management
- **➕ Add keys**: One-click addition with dialog
- **🗑️ Delete keys**: Confirmation dialog for safety
- **Right-click menu**: Quick actions on any key
- **Alphabetic sorting**: Automatic organization

### 📝 Additional Views
- **📋 Flat view**: Traditional table layout
- **🌳 Tree view**: Hierarchical organization
- **📄 Raw view**: See original file content

### 🔤 Unicode Support
- **Toggle escapes**: Show/hide `\uXXXX` sequences
- **International characters**: Full Unicode support (Arabic, Chinese, Japanese, Emoji, etc.)
- **Round-trip fidelity**: Files are saved exactly as they were read - no unwanted escaping
- **Multiple encodings**: UTF-8 support with proper handling of special characters

## ✨ What's New

### Latest Release (v0.0.5)

#### 🛡️ Enhanced Security
- **Dependency audit**: All known vulnerabilities fixed (0 critical issues)
- **Pinned versions**: Exact dependency versions for reproducible builds
- **pnpm v11**: Latest package manager with enhanced security features
- **121 automated tests**: Comprehensive test coverage for reliability

#### 🎯 Visual Editor as Default (Optional)
- **Editor title button**: Quick access to visual editor from any `.properties` file
- **Switch seamlessly**: Toggle between text and visual editor anytime
- **Non-intrusive**: Files open in text editor by default, visual editor available on demand

#### ✨ Perfect Round-Trip Fidelity
- **Preserves exact formatting**: Values with `=`, `:`, `!`, `#` are no longer escaped
- **Unicode preservation**: Characters like 日本語, العربية, 👋🌍 stay as-is (no `\uXXXX` conversion)
- **Long values**: Single-line values remain on one line, no forced formatting
- **Special characters**: Backslashes, tabs, spaces preserved exactly
- **100+ edit operations tested**: Complex file editing without data corruption

## 🎯 Why This Extension?

| Feature | Plain Text Editor | This Extension |
|---------|-------------------|----------------|
| Multi-locale view | ❌ Manual switching | ✅ Side-by-side comparison |
| Hierarchical keys | ❌ Flat list | ✅ Tree view with collapse/expand |
| Unicode handling | ❌ Raw `\uXXXX` escapes | ✅ Native characters with toggle |
| Format preservation | ⚠️ Easy to break | ✅ Perfect round-trip fidelity |
| Search & filter | ❌ Limited | ✅ Keys only or Keys+Values |
| Add/Delete keys | ❌ Manual edit | ✅ One-click operations |

## Quick Start

### Installation

#### From VS Code Marketplace
1. Open VS Code
2. Press `Cmd/Ctrl+Shift+X` to open Extensions
3. Search for "Resource Properties Viewer"
4. Click **Install**

#### From VSIX
1. Download `.vsix` from [releases](https://github.com/adrianferrandis/resource-properties-viewer/releases)
2. Run command: `Extensions: Install from VSIX`
3. Select the file

### Usage

#### Opening Files
You have **three ways** to open the visual editor:

**Option 1: Editor Title Button** (Recommended)
- Open any `.properties` file (it opens as text by default)
- Click the **📋 Open Preview** button in the top-right corner of the editor

**Option 2: Right-Click Menu**
- Right-click any `.properties` file in the explorer or editor
- Select **"Open with Resource Properties Viewer"**

**Option 3: Command Palette**
- Press `Cmd/Ctrl+Shift+P`
- Type "Open with Resource Properties Viewer"

#### Switching Views
- **Text → Visual**: Click the **📋 Open Preview** button or use the command
- **Visual → Text**: Use VS Code's "Reopen Editor With" command or click the icon in the visual editor's toolbar

#### Editing
1. Double-click a cell
2. Type your value
3. Press `Enter` to save
4. Changes apply immediately!

#### Adding Keys
1. Click **➕ Add Key** button
2. Enter key name (use `.` for hierarchy)
3. Key is added to all locale files

#### Filtering
- Type in search box
- Toggle 🔑/📝 to change search mode
- Clear box to show all

## Requirements

- VS Code 1.99.0 or higher
- Node.js 22+ (for development only)

## Configuration

```json
{
  "resourcePropertiesViewer.showRelatedFiles": true,
  "resourcePropertiesViewer.defaultLocale": "en",
  "resourcePropertiesViewer.unicodeEscapeDefault": true,
  "resourcePropertiesViewer.keySeparator": "."
}
```

| Setting | Description | Default |
|---------|-------------|---------|
| `showRelatedFiles` | Auto-detect related locale files | `true` |
| `defaultLocale` | Default locale to display | `"en"` |
| `unicodeEscapeDefault` | Show `\uXXXX` escapes | `true` |
| `keySeparator` | Hierarchy separator | `"."` |

## Examples

### Multi-Locale Project
```
src/main/resources/
├── messages.properties      (default)
├── messages_en.properties   (English)
├── messages_es.properties   (Spanish)
├── messages_fr.properties   (French)
└── messages_de.properties   (German)
```

The editor automatically shows all 5 locales side by side!

### Hierarchical Keys
```properties
# Organized by namespace
ui.dialog.title=Welcome
ui.dialog.ok=OK
ui.dialog.cancel=Cancel

api.error.notFound=Resource not found
api.error.unauthorized=Access denied
```

Tree view automatically groups by `ui` and `api` prefixes.

### Complex Values Preserved Exactly
```properties
# URLs - no escaping
jdbc.url=jdbc:mysql://localhost:3306/db?useSSL=false&serverTimezone=UTC

# JSON content
config.json={"enabled": true, "timeout": 30}

# Unicode text (not converted to \uXXXX)
japanese=こんにちは世界
arabic=مرحبا بالعالم
emoji=Hello 👋 World 🌍

# Values with special characters
math=a=b+c-d*e/f
time=HH:mm:ss
cron=0 0 12 * * ?
```

All these formats are preserved exactly as written - no unwanted escaping!

## Development

This project uses [pnpm](https://pnpm.io/) for package management (v11+) with enhanced security features.

```bash
# Clone repository
git clone https://github.com/adrianferrandis/resource-properties-viewer.git
cd resource-properties-viewer

# Install pnpm (if not already installed)
npm install -g pnpm@11

# Install dependencies
pnpm install

# Build
pnpm run build

# Watch mode
pnpm run watch

# Run tests (121 tests included)
pnpm test

# Package
pnpm run package

# Publish
pnpm run publish
```

### Tech Stack

- **TypeScript** - Type-safe code with strict checking
- **pnpm** - Fast, secure package manager (v11+)
- **esbuild** - Ultra-fast bundler (<10ms builds)
- **VS Code Extension API** - Custom editors and webviews
- **Mocha** - Testing framework with 121 comprehensive tests
- **GitHub Actions** - Automated CI/CD with security audits

### Quality Metrics

| Metric | Status | Details |
|--------|--------|---------|
| **Test Coverage** | 121 tests | All features tested |
| **Security Audit** | 0 vulnerabilities | pnpm audit clean |
| **Build Time** | <10ms | esbuild bundling |
| **Bundle Size** | ~28KB | Minified + gzipped |
| **CI/CD** | ✅ Passing | GitHub Actions |

## Architecture

```
src/
├── extension.ts                 # Extension entry point
├── providers/
│   └── PropertiesEditorProvider.ts  # Custom editor provider
├── services/
│   ├── BundleDiscovery.ts       # Auto-detect locale files
│   ├── PropertiesParser.ts      # Parse .properties files
│   └── PropertiesSerializer.ts  # Serialize to .properties
├── media/
│   ├── editor.js               # Webview UI
│   └── editor.css              # VS Code theme styles
└── test/                       # Test suite
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Contributing

Contributions welcome! Please read our [Contributing Guide](https://github.com/adrianferrandis/resource-properties-viewer/blob/main/CONTRIBUTING.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🗺️ Roadmap

### Coming Soon
- **🤖 AI-Powered Features**: Translation suggestions using Language Model API
- **⚡ Performance**: Virtual scrolling for files with 1000+ keys
- **🔄 Bulk Operations**: Multi-select, copy-paste across locales
- **🔍 Advanced Search**: Find and replace across all locales
- **📊 Export/Import**: CSV, JSON, Excel format support

### Under Consideration
- **🌐 Real-time Collaboration**: Live Share integration
- **📝 Comment Editing**: Visual comment management
- **🎨 Custom Themes**: User-defined color schemes
- **⌨️ Vim Mode**: Keyboard-centric editing

Have a feature request? [Open an issue](https://github.com/adrianferrandis/resource-properties-viewer/issues) or [start a discussion](https://github.com/adrianferrandis/resource-properties-viewer/discussions)!

## Troubleshooting

### File encoding issues?
The extension uses UTF-8 encoding. If you see garbled characters, ensure your `.properties` files are saved as UTF-8 (not ISO-8859-1 or other legacy encodings).

### Values being escaped?
As of v0.0.3, the extension preserves your values exactly as written. If you see `\uXXXX` escapes or escaped special characters (`\=`, `\:`), the file was likely edited by an older version or different tool. Simply open and save with this extension to restore clean formatting.

### Extension not opening?
Make sure you're right-clicking on a `.properties` file. The extension activates automatically when you use "Open with Resource Properties Viewer".

## Support

- 🐛 [Report bugs](https://github.com/adrianferrandis/resource-properties-viewer/issues)
- 💡 [Request features](https://github.com/adrianferrandis/resource-properties-viewer/issues)
- ❓ [Ask questions](https://github.com/adrianferrandis/resource-properties-viewer/discussions)

## License

[MIT](LICENSE) © Adrian Ferrandis

---

**Enjoy editing properties files!** 🚀

If you find this extension helpful, please consider [starring the repository](https://github.com/adrianferrandis/resource-properties-viewer) ⭐