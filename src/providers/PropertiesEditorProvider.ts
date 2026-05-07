import * as vscode from 'vscode';
import type { WebviewMessage } from '../types';
import { BundleDiscovery, BundleFile } from '../services/BundleDiscovery';
import { PropertiesParser } from '../services/PropertiesParser';
import { PropertiesSerializer } from '../services/PropertiesSerializer';

type BundleModel = {
  locales: string[];
  entries: { [key: string]: { [locale: string]: string | null } };
};
type EditMessage = { type: string; key: string; locale: string; value: string };

const EXTERNAL_SYNC_DEBOUNCE = 100;

export class PropertiesEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'resourceBundleEditor.propertiesEditor';

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new PropertiesEditorProvider(context);
    return vscode.window.registerCustomEditorProvider(
      PropertiesEditorProvider.viewType,
      provider,
      { supportsMultipleEditorsPerDocument: true }
    );
  }

  private readonly bundleDiscovery = new BundleDiscovery();
  private readonly propertiesParser = new PropertiesParser();
  private readonly propertiesSerializer = new PropertiesSerializer();
  private bundleFilesByLocale: Map<string | null, BundleFile> = new Map();
  private currentBundleModel: BundleModel | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private keySeparator: string = '.';
  private isApplyingEdit = false;

  constructor(private readonly context: vscode.ExtensionContext) {
    const cfg = vscode.workspace.getConfiguration('resourceBundleEditor');
    this.keySeparator = cfg.get<string>('keySeparator', '.');
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    try {
      const bundleFiles = await this.bundleDiscovery.discoverRelatedFiles(document.uri.toString());
      const bundleModel = await this.loadBundleModel(bundleFiles);
      this.currentBundleModel = bundleModel;
      this.bundleFilesByLocale = new Map(bundleFiles.map(b => [b.locale, b]));
      webviewPanel.webview.postMessage({ type: 'init', model: bundleModel });

      const onDidChange = vscode.workspace.onDidChangeTextDocument(async (e) => {
        if (this.isApplyingEdit) return;
        const changed = bundleFiles.find(b => b.fileUri === e.document.uri.toString());
        if (changed) {
          if (this.debounceTimer) clearTimeout(this.debounceTimer);
          this.debounceTimer = setTimeout(async () => {
            const refreshedFiles = await this.bundleDiscovery.discoverRelatedFiles(document.uri.toString());
            const refreshedModel = await this.loadBundleModel(refreshedFiles);
            this.currentBundleModel = refreshedModel;
            this.bundleFilesByLocale = new Map(refreshedFiles.map(b => [b.locale, b]));
            webviewPanel.webview.postMessage({ type: 'update', model: refreshedModel });
          }, EXTERNAL_SYNC_DEBOUNCE);
        }
      });
      webviewPanel.onDidDispose(() => onDidChange.dispose());
    } catch (err) {
      webviewPanel.webview.postMessage({ type: 'error', message: 'Failed to load bundle files' });
    }

    webviewPanel.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      switch ((message as any).type) {
        case 'ready': {
          if (this.currentBundleModel) {
            webviewPanel.webview.postMessage({ type: 'init', model: this.currentBundleModel });
          }
          break;
        }
        case 'edit': {
          await this.handleEdit(message as EditMessage, document, webviewPanel);
          break;
        }
        case 'addKey': {
          await this.handleAddKey(message as any, document, webviewPanel);
          break;
        }
        case 'deleteKey': {
          await this.handleDeleteKey(message as any, document, webviewPanel);
          break;
        }
        case 'toggleComment': {
          await this.handleToggleComment(message as any, document, webviewPanel);
          break;
        }
      }
    });
  }

  private async handleAddKey(message: any, document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel): Promise<void> {
    try {
      const { key } = message;
      if (!key || !key.trim()) return;

      const bundleFiles = await this.bundleDiscovery.discoverRelatedFiles(document.uri.toString());
      const edit = new vscode.WorkspaceEdit();

      for (const bf of bundleFiles) {
        try {
          const uri = vscode.Uri.parse(bf.fileUri);
          const contentBytes = await vscode.workspace.fs.readFile(uri);
          let content = Buffer.from(contentBytes).toString('utf8');
          const originalLines = content.split(/\r?\n/);

          const parsed = this.propertiesParser.parse(content);
          const existingKey = parsed.find(e => e.key === key && !e.commented);
          
          if (!existingKey) {
            const keyParts = key.split('.');
            const prefix = keyParts.length > 1 ? keyParts[0] : null;
            
            let insertLine = parsed.length;
            let lastMatchingPrefixLine = -1;
            
            for (let i = 0; i < parsed.length; i++) {
              const entryKey = parsed[i].key;
              if (entryKey < key) {
                insertLine = i + 1;
              }
              if (prefix && entryKey.startsWith(prefix + '.')) {
                lastMatchingPrefixLine = i + 1;
              }
            }
            
            if (lastMatchingPrefixLine > 0) {
              insertLine = lastMatchingPrefixLine;
            }
            
            const newLine = `${key}=`;
            originalLines.splice(insertLine, 0, newLine);
            
            const newContent = originalLines.join('\n') + (originalLines[originalLines.length - 1].endsWith('\n') ? '' : '\n');
            edit.replace(uri, new vscode.Range(0, 0, content.split(/\r?\n/).length, 0), newContent);
          }
        } catch { }
      }

      this.isApplyingEdit = true;
      await vscode.workspace.applyEdit(edit);
      this.isApplyingEdit = false;
      const refreshed = await this.loadBundleModel(await this.bundleDiscovery.discoverRelatedFiles(document.uri.toString()));
      this.currentBundleModel = refreshed;
      this.bundleFilesByLocale = new Map(await this.listBundleFiles(document));
      webviewPanel.webview.postMessage({ type: 'update', model: refreshed });
    } catch (err) {
      this.isApplyingEdit = false;
      webviewPanel.webview.postMessage({ type: 'error', message: 'Failed to add key: ' + (err instanceof Error ? err.message : String(err)) });
    }
  }

  private async handleDeleteKey(message: any, document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel): Promise<void> {
    const { key } = message;
    if (!key) return;

    const bundleFiles = await this.bundleDiscovery.discoverRelatedFiles(document.uri.toString());
    const edit = new vscode.WorkspaceEdit();

    for (const bf of bundleFiles) {
      try {
        const uri = vscode.Uri.parse(bf.fileUri);
        const contentBytes = await vscode.workspace.fs.readFile(uri);
        const content = Buffer.from(contentBytes).toString('utf8');
        const lines = content.split(/\r?\n/);
        const newLines = lines.filter(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('#') || trimmed === '') return true;
          const keyMatch = line.match(/^([^=:\s]+)/);
          return keyMatch?.[1] !== key;
        });

        if (newLines.length !== lines.length) {
          const newContent = newLines.join('\n') + '\n';
          edit.replace(uri, new vscode.Range(0, 0, lines.length, 0), newContent);
        }
      } catch { }
    }

    this.isApplyingEdit = true;
    await vscode.workspace.applyEdit(edit);
    this.isApplyingEdit = false;

    if (this.currentBundleModel) {
      delete this.currentBundleModel.entries[key];
      webviewPanel.webview.postMessage({ type: 'update', model: this.currentBundleModel });
    }
  }

  private async handleToggleComment(message: any, document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel): Promise<void> {
    const { key } = message;
    if (!key) return;

    const bundleFiles = await this.bundleDiscovery.discoverRelatedFiles(document.uri.toString());
    const edit = new vscode.WorkspaceEdit();

    for (const bf of bundleFiles) {
      try {
        const uri = vscode.Uri.parse(bf.fileUri);
        const contentBytes = await vscode.workspace.fs.readFile(uri);
        const content = Buffer.from(contentBytes).toString('utf8');
        const lines = content.split(/\r?\n/);
        let modified = false;

        const newLines = lines.map((line) => {
          const trimmed = line.trimStart();
          const keyRegex = new RegExp('^' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(=|:|\\s|$)');
          if (keyRegex.test(trimmed)) {
            modified = true;
            if (trimmed.startsWith('#')) {
              return line.replace(/^(\s*#\s?)/, '');
            } else {
              return line.replace(/^(\s*)/, '$1# ');
            }
          }
          return line;
        });

        if (modified) {
          const newContent = newLines.join('\n') + '\n';
          edit.replace(uri, new vscode.Range(0, 0, lines.length, 0), newContent);
        }
      } catch { }
    }

    this.isApplyingEdit = true;
    await vscode.workspace.applyEdit(edit);
    this.isApplyingEdit = false;
    const refreshed = await this.loadBundleModel(await this.bundleDiscovery.discoverRelatedFiles(document.uri.toString()));
    this.currentBundleModel = refreshed;
    this.bundleFilesByLocale = new Map(await this.listBundleFiles(document));
    webviewPanel.webview.postMessage({ type: 'update', model: refreshed });
  }

  private async handleEdit(message: EditMessage, document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel): Promise<void> {
    try {
      const { key, locale, value } = message;
      const lookupLocale = locale === 'default' ? null : locale;
      const bundleFile = this.bundleFilesByLocale.get(lookupLocale);
      let targetUri: vscode.Uri;

      if (bundleFile) {
        targetUri = vscode.Uri.parse(bundleFile.fileUri);
      } else {
        const newFilePath = this.deriveLocaleFilePath(document.uri.toString(), lookupLocale || 'default');
        targetUri = vscode.Uri.file(newFilePath);
      }

      let content = '';
      try {
        const contentBytes = await vscode.workspace.fs.readFile(targetUri);
        content = Buffer.from(contentBytes).toString('utf8');
      } catch { }

      const parsed = this.propertiesParser.parse(content);
      const entry = parsed.find(e => e.key === key);
      if (entry) {
        entry.value = value;
      } else {
        parsed.push({
          key,
          value,
          separator: '=',
          commented: false,
          lineNumber: parsed.length + 1
        });
      }

      const updatedContent = this.propertiesSerializer.serialize(parsed);
      const edit = new vscode.WorkspaceEdit();
      const originalLines = content.split(/\r?\n/);
      edit.replace(targetUri, new vscode.Range(0, 0, originalLines.length, 0), updatedContent);
      
      this.isApplyingEdit = true;
      await vscode.workspace.applyEdit(edit);
      this.isApplyingEdit = false;

      if (this.currentBundleModel) {
        const modelLocale = locale === 'default' ? 'default' : locale;
        if (!this.currentBundleModel.entries[key]) {
          this.currentBundleModel.entries[key] = {};
        }
        this.currentBundleModel.entries[key][modelLocale] = value;
        webviewPanel.webview.postMessage({ type: 'update', model: this.currentBundleModel });
      }
    } catch {
      this.isApplyingEdit = false;
      webviewPanel.webview.postMessage({ type: 'error', message: 'Failed to save edit' });
    }
  }

  private async loadBundleModel(bundleFiles: BundleFile[]): Promise<BundleModel & { _rawContents?: string[] }> {
    const locales = bundleFiles.map(b => b.locale || 'default');
    const entries: BundleModel['entries'] = {};
    const rawContents: string[] = [];

    for (const bf of bundleFiles) {
      try {
        const uri = vscode.Uri.parse(bf.fileUri);
        const contentBytes = await vscode.workspace.fs.readFile(uri);
        const content = Buffer.from(contentBytes).toString('utf8');
        rawContents.push(content);
        const parsed = this.propertiesParser.parse(content);

        for (const entry of parsed) {
          if (entry.commented) continue;
          if (!entries[entry.key]) entries[entry.key] = {};
          entries[entry.key][bf.locale || 'default'] = entry.value;
        }
      } catch { 
        rawContents.push('');
      }
    }

    for (const key of Object.keys(entries)) {
      locales.forEach(loc => {
        if (entries[key][loc] === undefined) entries[key][loc] = null;
      });
    }

    return { locales, entries, _rawContents: rawContents };
  }

  private deriveLocaleFilePath(baseUri: string, locale: string): string {
    const pathModule = require('path');
    const dir = pathModule.dirname(vscode.Uri.parse(baseUri).fsPath);
    const ext = '.properties';
    const base = pathModule.basename(vscode.Uri.parse(baseUri).fsPath, ext);
    const localeFile = locale === 'default' ? `${base}${ext}` : `${base}_${locale}${ext}`;
    return pathModule.join(dir, localeFile);
  }

  private async listBundleFiles(document: vscode.TextDocument): Promise<[string | null, BundleFile][]> {
    const files = await this.bundleDiscovery.discoverRelatedFiles(document.uri.toString());
    return files.map(f => [f.locale, f]);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.css'));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https:;">
  <title>Properties Editor</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div id="app"><div class="loading">Loading...</div></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private getNonce(): string {
    let nonce = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      nonce += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return nonce;
  }
}
