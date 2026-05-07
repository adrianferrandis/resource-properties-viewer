# Resource Properties Editor - Agent Guide

## Project Overview
VS Code extension for editing Java `.properties` files with visual table editor, multi-locale support, and real-time sync.

**Published:** https://marketplace.visualstudio.com/items?itemName=adrianferrandis.resource-properties-editor  
**Repo:** https://github.com/adrianferrandis/resource-properties-viewer

## Architecture

```
src/
├── extension.ts                    # Entry point, command registration
├── providers/
│   └── PropertiesEditorProvider.ts # Custom editor (CustomTextEditorProvider)
├── services/
│   ├── BundleDiscovery.ts          # Auto-detect related locale files
│   ├── PropertiesParser.ts         # Parse .properties with Unicode support
│   └── PropertiesSerializer.ts     # Serialize entries back to file
├── media/
│   ├── editor.js                   # Webview UI (table/tree/raw views)
│   └── editor.css                  # VS Code theme-compatible styles
└── types/                          # TypeScript interfaces
```

## Key Patterns

### Real-Time Sync (Critical!)
When editing/deleting, update in-memory model BEFORE disk write to prevent `onDidChangeTextDocument` from overwriting with stale data:
```typescript
// Set flag to ignore external change events
this.isApplyingEdit = true;
await vscode.workspace.applyEdit(edit);
this.isApplyingEdit = false;

// Update model immediately
this.currentBundleModel.entries[key][locale] = value;
webviewPanel.webview.postMessage({ type: 'update', model: this.currentBundleModel });
```

### Webview Communication
- `postMessage({ type: 'update', model })` → Refresh UI
- `onDidReceiveMessage` handlers: 'ready', 'edit', 'addKey', 'deleteKey', 'toggleComment'

### Filter Modes
- `filterMode = 'keys'` → Search only key names (🔑)
- `filterMode = 'all'` → Search keys + values (📝, button highlighted when active)

## Build & Publish

```bash
npm run build          # esbuild → dist/extension.js
npm run package        # Create .vsix
npm run publish        # Publish to Marketplace
```

**Important:**
- Always run `npm run build` before testing/publishing
- Extension name: `resource-properties-editor` (v0.0.1)
- Uses `vscode:prepublish` hook for auto-build

## Common Tasks

### Fix UI Not Updating After Edit
Check `isApplyingEdit` flag is set around `applyEdit()` calls.

### Add New Message Type
1. Add to `src/types/messages.ts`
2. Handle in `PropertiesEditorProvider.ts` switch statement
3. Implement in `media/editor.js`

### Update Styles
Modify `media/editor.css` - uses CSS variables from VS Code theme (`--vscode-*`).

## Testing
- Demo files in `demo-app/`
- Test files in `test/sample/`
- Run `npm test` for unit tests

## Extension Manifest (package.json)
- **activationEvents:** `onCustomEditor:resourceBundleEditor.propertiesEditor`
- **viewType:** `resourceBundleEditor.propertiesEditor`
- **contributes:** Commands, menus, customEditors, configuration

## Gotchas
- **Webview inline onclick:** Doesn't work in VS Code, use `element.onclick`
- **SVG icons:** Not allowed in Marketplace, use PNG
- **Focus loss on filter:** Call `renderFlatTable()` not `render()` to preserve toolbar
- **File encoding:** Always UTF-8, handle Unicode escapes in parser/serializer
