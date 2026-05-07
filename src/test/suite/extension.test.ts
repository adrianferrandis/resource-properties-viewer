import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { PropertiesParser } from '../../services/PropertiesParser';
import { PropertiesSerializer } from '../../services/PropertiesSerializer';
import { BundleDiscovery } from '../../services/BundleDiscovery';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  suite('PropertiesParser', () => {
    const parser = new PropertiesParser();

    test('should parse simple key-value pairs', () => {
      const content = 'key1=value1\nkey2=value2';
      const result = parser.parse(content);
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].key, 'key1');
      assert.strictEqual(result[0].value, 'value1');
    });

    test('should handle different separators (=, :, space)', () => {
      const content = 'key1=value1\nkey2:value2\nkey3 value3';
      const result = parser.parse(content);
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].value, 'value1');
      assert.strictEqual(result[1].value, 'value2');
      assert.strictEqual(result[2].value, 'value3');
    });

    test('should decode Unicode escapes', () => {
      const content = 'key=\\u0043\\u0061\\u0066\\u00e9';
      const result = parser.parse(content);
      assert.strictEqual(result[0].value, 'Café');
    });

    test('should handle commented lines', () => {
      const content = '# This is a comment\nkey=value\n! Another comment';
      const result = parser.parse(content);
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].commented, true);
      assert.strictEqual(result[1].commented, false);
    });

    test('should handle empty values', () => {
      const content = 'key1=\nkey2=';
      const result = parser.parse(content);
      assert.strictEqual(result[0].value, '');
      assert.strictEqual(result[1].value, '');
    });

    test('should handle values with equals signs', () => {
      const content = 'key=value=with=equals';
      const result = parser.parse(content);
      assert.strictEqual(result[0].value, 'value=with=equals');
    });

    test('should parse flat keys (no hierarchy)', () => {
      const content = 'aaa=value1\nbbb=value2\nccc=value3';
      const result = parser.parse(content);
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].key, 'aaa');
      assert.strictEqual(result[1].key, 'bbb');
      assert.strictEqual(result[2].key, 'ccc');
    });

    test('should handle multi-line values with backslash', () => {
      const content = 'key=line1\\\nline2';
      const result = parser.parse(content);
      assert.strictEqual(result[0].value, 'line1line2');
    });
  });

  suite('PropertiesSerializer', () => {
    const serializer = new PropertiesSerializer();

    test('should serialize simple entries', () => {
      const entries = [{
        key: 'key1',
        value: 'value1',
        separator: '=' as const,
        commented: false,
        lineNumber: 1
      }];
      const result = serializer.serialize(entries);
      assert.ok(result.includes('key1=value1'));
    });

    test('should escape special characters', () => {
      const entries = [{
        key: 'key',
        value: 'value=with=special:chars!',
        separator: '=' as const,
        commented: false,
        lineNumber: 1
      }];
      const result = serializer.serialize(entries);
      assert.ok(result.includes('value\\=with\\=special\\:chars\\!'));
    });

    test('should escape backslashes before special chars', () => {
      const entries = [{
        key: 'key',
        value: 'path\\to\\file',
        separator: '=' as const,
        commented: false,
        lineNumber: 1
      }];
      const result = serializer.serialize(entries);
      assert.ok(result.includes('path\\\\to\\\\file'));
    });

    test('should encode Unicode characters', () => {
      const entries = [{
        key: 'key',
        value: 'Café',
        separator: '=' as const,
        commented: false,
        lineNumber: 1
      }];
      const result = serializer.serialize(entries);
      assert.ok(result.includes('Caf\\u00e9'));
    });

    test('should handle empty values', () => {
      const entries = [{
        key: 'key',
        value: '',
        separator: '=' as const,
        commented: false,
        lineNumber: 1
      }];
      const result = serializer.serialize(entries);
      assert.ok(result.includes('key='));
    });

    test('should preserve comments', () => {
      const entries = [{
        key: '',
        value: '',
        separator: '=' as const,
        commented: true,
        comment: 'This is a comment',
        lineNumber: 1
      }];
      const result = serializer.serialize(entries);
      assert.ok(result.includes('# This is a comment'));
    });

    test('round-trip: parse then serialize should preserve data', () => {
      const parser = new PropertiesParser();
      const original = 'key1=value1\nkey2=value2\n# comment\nkey3=Café';
      const parsed = parser.parse(original);
      const serialized = serializer.serialize(parsed);
      const reparsed = parser.parse(serialized);
      
      assert.strictEqual(reparsed.length, parsed.length);
      assert.strictEqual(reparsed[0].key, parsed[0].key);
      assert.strictEqual(reparsed[0].value, parsed[0].value);
    });
  });

  suite('BundleDiscovery', () => {
    const discovery = new BundleDiscovery();

    test('should extract locale from filename', () => {
      assert.strictEqual(discovery.parseLocaleFromFileName('messages.properties'), null);
      assert.strictEqual(discovery.parseLocaleFromFileName('messages_en.properties'), 'en');
      assert.strictEqual(discovery.parseLocaleFromFileName('messages_en_US.properties'), 'en_US');
      assert.strictEqual(discovery.parseLocaleFromFileName('messages_es.properties'), 'es');
    });

    test('should get display name for locale', () => {
      assert.strictEqual(discovery.getDisplayName(null), 'Default');
      assert.strictEqual(discovery.getDisplayName('en'), 'English');
      assert.strictEqual(discovery.getDisplayName('es'), 'Spanish');
      assert.strictEqual(discovery.getDisplayName('fr'), 'French');
      assert.strictEqual(discovery.getDisplayName('unknown'), 'unknown');
    });
  });

  suite('Integration', () => {
    test('extension should be present', () => {
      assert.ok(vscode.extensions.getExtension('undefined_publisher.resource-bundle-editor'));
    });

    test('should activate', async () => {
      const ext = vscode.extensions.getExtension('undefined_publisher.resource-bundle-editor');
      if (ext) {
        await ext.activate();
        assert.strictEqual(ext.isActive, true);
      }
    });
  });
});
