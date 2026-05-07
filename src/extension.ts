import * as vscode from 'vscode';
import { PropertiesEditorProvider } from './providers';

export function activate(context: vscode.ExtensionContext) {
  // Register the custom editor provider
  context.subscriptions.push(PropertiesEditorProvider.register(context));

  // Register command: Open with Resource Bundle Editor
  context.subscriptions.push(
    vscode.commands.registerCommand('resourceBundleEditor.open', async (uri?: vscode.Uri) => {
      const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
      
      if (!targetUri) {
        vscode.window.showErrorMessage('No file selected');
        return;
      }

      if (!targetUri.fsPath.endsWith('.properties')) {
        vscode.window.showErrorMessage('Resource Bundle Editor only works with .properties files');
        return;
      }

      try {
        await vscode.commands.executeCommand(
          'vscode.openWith',
          targetUri,
          PropertiesEditorProvider.viewType
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to open Resource Bundle Editor: ${error}`);
      }
    })
  );

  // Register command: Reload Resource Bundle
  context.subscriptions.push(
    vscode.commands.registerCommand('resourceBundleEditor.reload', async () => {
      const activeEditor = vscode.window.activeTextEditor;
      
      if (!activeEditor) {
        vscode.window.showInformationMessage('No active editor to reload');
        return;
      }

      const document = activeEditor.document;
      
      if (!document.uri.fsPath.endsWith('.properties')) {
        vscode.window.showInformationMessage('Resource Bundle Reload only works with .properties files');
        return;
      }

      try {
        // Force reload by reopening the file
        await vscode.commands.executeCommand(
          'vscode.openWith',
          document.uri,
          PropertiesEditorProvider.viewType,
          { preview: false }
        );
        vscode.window.showInformationMessage('Resource Bundle reloaded successfully');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to reload: ${error}`);
      }
    })
  );

  // Register command: Show Resource Bundle Info
  context.subscriptions.push(
    vscode.commands.registerCommand('resourceBundleEditor.showInfo', async () => {
      const activeEditor = vscode.window.activeTextEditor;
      
      if (!activeEditor || !activeEditor.document.uri.fsPath.endsWith('.properties')) {
        vscode.window.showInformationMessage('Open a .properties file to see Resource Bundle information');
        return;
      }

      const fileName = activeEditor.document.fileName;
      const baseName = fileName.replace(/(_[a-zA-Z_]+)?\.properties$/, '');
      
      vscode.window.showInformationMessage(
        `Resource Bundle: ${baseName}`,
        'OK'
      );
    })
  );

  // Show welcome message on first activation
  const hasShownWelcome = context.globalState.get<boolean>('resourceBundleEditor.welcomeShown');
  if (!hasShownWelcome) {
    vscode.window.showInformationMessage(
      'Resource Bundle Editor is now active! Open any .properties file to start editing.',
      'Open Demo',
      'Dismiss'
    ).then(selection => {
      if (selection === 'Open Demo') {
        // Open the demo folder
        const demoPath = vscode.Uri.file(context.extensionPath + '/demo-app');
        vscode.commands.executeCommand('vscode.openFolder', demoPath);
      }
      context.globalState.update('resourceBundleEditor.welcomeShown', true);
    });
  }
}

export function deactivate() {}
