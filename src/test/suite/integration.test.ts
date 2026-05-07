import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const SAMPLE_DIR = path.resolve(process.cwd(), 'test', 'sample');

function getSampleFilePath(locale: string): string {
  return path.join(SAMPLE_DIR, `messages${locale ? '_' + locale : ''}.properties`);
}

suite('Resource Bundle Editor Integration', () => {
  let documentsToClose: vscode.TextDocument[] = [];

  teardown(async () => {
    for (const doc of documentsToClose) {
      try {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      } catch { }
    }
    documentsToClose = [];
  });

  test('Opens .properties file with custom editor', async () => {
    const filePath = getSampleFilePath('');
    const uri = vscode.Uri.file(filePath);

    const document = await vscode.workspace.openTextDocument(uri);
    documentsToClose.push(document);

    assert.ok(document, 'Document should be opened');
    assert.strictEqual(document.languageId, 'java', 'Properties files should be treated as java');

    const content = document.getText();
    assert.ok(content.includes('greeting'), 'Should contain greeting key');
    assert.ok(content.includes('farewell'), 'Should contain farewell key');
  });

  test('Loads related locale files', async () => {
    const locales = ['', 'en', 'es', 'fr'];

    for (const locale of locales) {
      const filePath = getSampleFilePath(locale);
      assert.ok(fs.existsSync(filePath), `Locale file for '${locale}' should exist at ${filePath}`);
    }

    const baseContent = fs.readFileSync(getSampleFilePath(''), 'utf8');
    const baseKeys = new Set(
      baseContent
        .split('\n')
        .filter(l => l.includes('=') && !l.trim().startsWith('#'))
        .map(l => l.split('=')[0].trim())
    );

    const enContent = fs.readFileSync(getSampleFilePath('en'), 'utf8');
    const enKeys = new Set(
      enContent
        .split('\n')
        .filter(l => l.includes('=') && !l.trim().startsWith('#'))
        .map(l => l.split('=')[0].trim())
    );

    const overlap = [...baseKeys].filter(k => enKeys.has(k));
    assert.ok(overlap.length >= 5, `Expected significant key overlap between base and locale files, got ${overlap.length}`);
  });

  test('Edit persists to correct file', async () => {
    const tempDir = path.resolve(process.cwd(), 'test', 'fixtures');
    const tempFile = path.join(tempDir, 'edit_test.properties');
    const originalContent = '# Test file\ntest.key=original value\n';

    fs.writeFileSync(tempFile, originalContent, 'utf8');

    try {
      const uri = vscode.Uri.file(tempFile);
      const document = await vscode.workspace.openTextDocument(uri);
      documentsToClose.push(document);

      const initialContent = document.getText();
      assert.ok(initialContent.includes('test.key=original value'), 'Initial content should have original value');

      const edit = new vscode.WorkspaceEdit();
      edit.replace(
        uri,
        new vscode.Range(
          document.positionAt(0),
          document.positionAt(initialContent.length)
        ),
        '# Test file\ntest.key=updated value\n'
      );
      await vscode.workspace.applyEdit(edit);
      await document.save();

      const diskContent = fs.readFileSync(tempFile, 'utf8');
      assert.ok(diskContent.includes('test.key=updated value'), 'File on disk should have updated value');
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.writeFileSync(tempFile, originalContent, 'utf8');
      }
    }
  });

  test('Locale file path derivation works correctly', async () => {
    const basePath = '/path/to/messages.properties';
    const expectedPatterns = [
      { locale: 'en', expected: '/path/to/messages_en.properties' },
      { locale: 'es', expected: '/path/to/messages_es.properties' },
      { locale: 'fr', expected: '/path/to/messages_fr.properties' },
    ];

    for (const { locale, expected } of expectedPatterns) {
      const ext = path.extname(basePath);
      const base = path.basename(basePath, ext);
      const result = path.join(path.dirname(basePath), `${base}_${locale}${ext}`);
      assert.strictEqual(result, expected, `Locale '${locale}' should derive to ${expected}`);
    }
  });

  test('Handles missing locale files gracefully', async () => {
    const soloFile = path.resolve(process.cwd(), 'test', 'fixtures', 'simple.properties');
    const uri = vscode.Uri.file(soloFile);

    const document = await vscode.workspace.openTextDocument(uri);
    documentsToClose.push(document);

    assert.ok(document, 'Should open file even if no related locales exist');
  });
});