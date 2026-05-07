# Resource Bundle Editor

[![Version](https://img.shields.io/visual-studio-marketplace/v/adrianferrandis.resource-bundle-editor)](https://marketplace.visualstudio.com/items?itemName=adrianferrandis.resource-bundle-editor)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/adrianferrandis.resource-bundle-editor)](https://marketplace.visualstudio.com/items?itemName=adrianferrandis.resource-bundle-editor)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/adrianferrandis.resource-bundle-editor)](https://marketplace.visualstudio.com/items?itemName=adrianferrandis.resource-bundle-editor)

A powerful Visual Studio Code extension for editing Java `.properties` files with a modern, spreadsheet-like interface. Inspired by Eclipse's ResourceBundle Editor, but built specifically for VS Code with native integration and real-time synchronization.

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
- **International characters**: Full Unicode support
- **Round-trip fidelity**: No data loss on save/load

## Quick Start

### Installation

#### From VS Code Marketplace
1. Open VS Code
2. Press `Cmd/Ctrl+Shift+X` to open Extensions
3. Search for "Resource Bundle Editor"
4. Click **Install**

#### From VSIX
1. Download `.vsix` from [releases](https://github.com/adrianferrandis/resource-properties-viewer/releases)
2. Run command: `Extensions: Install from VSIX`
3. Select the file

### Usage

#### Opening Files
- Right-click any `.properties` file → **"Open with Resource Bundle Editor"**
- Or use Command Palette: `Cmd/Ctrl+Shift+P` → "Resource Bundle Editor"

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

- VS Code 1.74.0 or higher
- Node.js 18+ (for development only)

## Configuration

```json
{
  "resourceBundleEditor.showRelatedFiles": true,
  "resourceBundleEditor.defaultLocale": "en",
  "resourceBundleEditor.unicodeEscapeDefault": true,
  "resourceBundleEditor.keySeparator": "."
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

## Development

```bash
# Clone repository
git clone https://github.com/adrianferrandis/resource-properties-viewer.git
cd resource-bundle-editor

# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run watch

# Run tests
npm test

# Package
npm run package

# Publish
npm run publish
```

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

## Support

- 🐛 [Report bugs](https://github.com/adrianferrandis/resource-properties-viewer/issues)
- 💡 [Request features](https://github.com/adrianferrandis/resource-properties-viewer/issues)
- ❓ [Ask questions](https://github.com/adrianferrandis/resource-properties-viewer/discussions)

## License

[MIT](LICENSE) © Adrian Ferrandis

---

**Enjoy editing properties files!** 🚀

If you find this extension helpful, please consider [starring the repository](https://github.com/adrianferrandis/resource-properties-viewer) ⭐
