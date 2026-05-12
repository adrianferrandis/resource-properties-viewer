import * as assert from 'assert';
import { PropertiesParser } from '../../services/PropertiesParser';
import { PropertiesSerializer } from '../../services/PropertiesSerializer';

describe('PropertiesParser & Serializer - Fidelity Tests', () => {
  const parser = new PropertiesParser();
  const serializer = new PropertiesSerializer();

  describe('Round-trip fidelity - values should remain unchanged', () => {
    
    it('should preserve simple values exactly', () => {
      const input = 'key=simple value\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Simple value should be preserved exactly');
    });

    it('should preserve values with equals signs without escaping', () => {
      const input = 'key=value=with=equals\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Value with equals should remain unchanged');
    });

    it('should preserve values with colons without escaping', () => {
      const input = 'key=value:with:colons\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Value with colons should remain unchanged');
    });

    it('should preserve values with exclamation marks without escaping', () => {
      const input = 'key=value with ! exclamation\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Value with exclamation should remain unchanged');
    });

    it('should preserve values with hash marks without escaping', () => {
      const input = 'key=value with # hash\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Value with hash should remain unchanged');
    });

    it('should preserve unicode characters as-is (not convert to \\uXXXX)', () => {
      const input = 'key=日本語テスト\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Unicode characters should not be escaped');
    });

    it('should preserve unicode escape sequences exactly as written', () => {
      const input = 'key=\\u0048\\u0065\\u006c\\u006c\\u006f\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Unicode escape sequences should be preserved');
    });

    it('should preserve mixed unicode and ascii', () => {
      const input = 'key=Hello日本語World\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Mixed unicode and ascii should be preserved');
    });

    it('should preserve very long values on single line', () => {
      const longValue = 'a'.repeat(1000);
      const input = `key=${longValue}\n`;
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Long value should remain on single line');
    });

    it('should preserve values with leading spaces', () => {
      const input = 'key=   value with leading spaces\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Leading spaces should be preserved');
    });

    it('should preserve values with trailing spaces', () => {
      const input = 'key=value with trailing spaces   \n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Trailing spaces should be preserved');
    });

    it('should preserve values with multiple spaces', () => {
      const input = 'key=value    with    multiple    spaces\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Multiple spaces should be preserved');
    });

    it('should preserve values with tabs', () => {
      const input = 'key=value\twith\ttabs\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Tabs should be preserved');
    });

    it('should preserve backslashes in values', () => {
      const input = 'key=path\\to\\file\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Backslashes should be preserved');
    });

    it('should preserve windows paths', () => {
      const input = 'key=C:\\\\Users\\\\Admin\\\\file.txt\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Windows paths should be preserved');
    });

    it('should preserve special characters combination', () => {
      const input = 'key=a=b:c!#d\\e f\tg\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Special character combinations should be preserved');
    });
  });

  describe('Arabic text handling', () => {
    it('should preserve Arabic text', () => {
      const input = 'key=مرحبا بالعالم\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Arabic text should be preserved');
    });

    it('should preserve Arabic with special characters', () => {
      const input = 'key=مرحبا = بالعالم\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Arabic with special chars should be preserved');
    });
  });

  describe('Chinese text handling', () => {
    it('should preserve Simplified Chinese', () => {
      const input = 'key=你好世界\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Simplified Chinese should be preserved');
    });

    it('should preserve Traditional Chinese', () => {
      const input = 'key=你好世界繁體\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Traditional Chinese should be preserved');
    });

    it('should preserve Chinese with punctuation', () => {
      const input = 'key=你好，世界！這是#測試\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Chinese with punctuation should be preserved');
    });
  });

  describe('Emoji handling', () => {
    it('should preserve emoji characters', () => {
      const input = 'key=Hello 👋 World 🌍\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Emojis should be preserved');
    });

    it('should preserve complex emoji', () => {
      const input = 'key=👨‍👩‍👧‍👦 👨🏽‍💻\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Complex emojis should be preserved');
    });
  });

  describe('Line continuation handling', () => {
    it('should preserve line continuation values logically', () => {
      // Note: Line continuations are processed by the parser (lines joined)
      // The serializer outputs as single line, not as multi-line with \
      const input = 'key=value with \\\n    continuation\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      // Value should be preserved (joined), even if format changes to single line
      assert.ok(output.includes('value with'), 'Should contain first part');
      assert.ok(output.includes('continuation'), 'Should contain continuation part');
    });

    it('should handle multiple line continuations', () => {
      const input = 'key=line1 \\\n    line2 \\\n    line3\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      // Note: This might create a single logical value but should preserve structure
      assert.ok(output.includes('line1'), 'Should contain line1');
      assert.ok(output.includes('line2'), 'Should contain line2');
      assert.ok(output.includes('line3'), 'Should contain line3');
    });
  });

  describe('Separator preservation', () => {
    it('should preserve equals separator', () => {
      const input = 'key=value\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.ok(output.includes('='), 'Equals separator should be preserved');
    });

    it('should preserve colon separator', () => {
      const input = 'key:value\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.ok(output.includes(':'), 'Colon separator should be preserved');
    });

    it('should preserve space separator', () => {
      const input = 'key value\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      // Space separator should be preserved
      assert.ok(output.match(/key[\s:=]+value/), 'Space separator should be preserved');
    });
  });

  describe('Mixed encoding scenarios', () => {
    it('should handle file with mixed languages', () => {
      const input = `
english=Hello World
spanish=Hola Mundo
french=Bonjour le monde
german=Hallo Welt
japanese=こんにちは世界
chinese=你好世界
arabic=مرحبا بالعالم
russian=Привет мир
`.trim() + '\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Mixed language file should be preserved');
    });

    it('should preserve values with quotes', () => {
      const input = 'key="quoted value"\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Quoted values should be preserved');
    });

    it('should preserve values with brackets', () => {
      const input = 'key=[value] {value} (value)\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Bracketed values should be preserved');
    });
  });

  describe('Complex real-world scenarios', () => {
    it('should preserve URL values', () => {
      const input = 'url=https://example.com/path?param=value&other=test\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'URL should be preserved');
    });

    it('should preserve JSON-like values', () => {
      const input = 'json={"key": "value", "nested": {"a": 1}}\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'JSON-like value should be preserved');
    });

    it('should preserve SQL-like values', () => {
      const input = 'query=SELECT * FROM table WHERE id = 1\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'SQL-like value should be preserved');
    });

    it('should preserve template values', () => {
      const input = 'template=Hello {{name}}, your score is {{score}}!\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Template value should be preserved');
    });

    it('should preserve regex patterns', () => {
      const input = 'regex=^[a-zA-Z0-9]+@[a-z]+\\.[a-z]{2,}$\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Regex pattern should be preserved');
    });
  });

  describe('Key preservation', () => {
    it('should preserve keys with dots', () => {
      const input = 'key.with.dots=value\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Key with dots should be preserved');
    });

    it('should preserve keys with spaces (if escaped)', () => {
      const input = 'key\\ with\\ spaces=value\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Key with escaped spaces should be preserved');
    });

    it('should preserve keys with special characters', () => {
      const input = 'key@domain.com=value\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Key with special chars should be preserved');
    });
  });

  describe('Empty and special values', () => {
    it('should preserve empty values', () => {
      const input = 'key=\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Empty value should be preserved');
    });

    it('should preserve values with only spaces', () => {
      const input = 'key=   \n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Value with only spaces should be preserved');
    });

    it('should preserve values with newlines (when escaped)', () => {
      const input = 'key=line1\\nline2\n';
      const entries = parser.parse(input);
      const output = serializer.serialize(entries);
      assert.strictEqual(output, input, 'Value with escaped newline should be preserved');
    });
  });

  describe('Edit operations with valueRaw', () => {
    it('should update existing key value correctly', () => {
      const originalContent = 'abc=el texto que sea\nprueba=123\nxyz=otro valor\n';
      const entries = parser.parse(originalContent);
      
      const entry = entries.find(e => e.key === 'prueba');
      assert.ok(entry, 'Should find prueba entry');
      
      entry.value = '456';
      entry.valueRaw = '456';
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes('prueba=456'), 'Output should contain prueba=456');
      assert.ok(!output.includes('prueba=123'), 'Output should NOT contain old value prueba=123');
      assert.ok(!output.includes('prueba=123prueba='), 'Output should NOT contain duplicated value');
    });

    it('should handle edits in large files', () => {
      let content = '';
      for (let i = 0; i < 100; i++) {
        content += `key${i}=value${i}\n`;
      }
      
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'key50');
      assert.ok(entry, 'Should find key50');
      entry.value = 'MODIFIED';
      entry.valueRaw = 'MODIFIED';
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes('key50=MODIFIED'), 'Should contain modified value');
      assert.ok(!output.includes('key50=value50'), 'Should NOT contain old value');
      assert.ok(output.includes('key49=value49'), 'Should preserve key49');
      assert.ok(output.includes('key51=value51'), 'Should preserve key51');
    });

    it('should handle edits with values containing spaces', () => {
      const content = 'greeting=Hello World\nmessage=This is a long message with spaces\n';
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'message');
      assert.ok(entry, 'Should find message entry');
      entry.value = 'Modified message with spaces';
      entry.valueRaw = 'Modified message with spaces';
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes('message=Modified message with spaces'), 'Should contain modified message');
      assert.ok(!output.includes('message=This is a long message'), 'Should NOT contain old message');
    });

    it('should handle edits with special characters', () => {
      const content = 'config=a=b:c!#d\nurl=http://example.com?param=value\n';
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'config');
      assert.ok(entry, 'Should find config entry');
      entry.value = 'x=y:z@new';
      entry.valueRaw = 'x=y:z@new';
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes('config=x=y:z@new'), 'Should contain new config value');
    });

    it('should handle multiple edits to same key', () => {
      const content = 'test=initial\n';
      let entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'test')!;
      assert.ok(entry, 'Should find test entry');
      
      entry.value = 'first';
      entry.valueRaw = 'first';
      let output1 = serializer.serialize(entries);
      
      entries = parser.parse(output1);
      const entry2 = entries.find(e => e.key === 'test')!;
      assert.ok(entry2, 'Should find test entry 2');
      entry2.value = 'second';
      entry2.valueRaw = 'second';
      let output2 = serializer.serialize(entries);
      
      entries = parser.parse(output2);
      const entry3 = entries.find(e => e.key === 'test')!;
      assert.ok(entry3, 'Should find test entry 3');
      entry3.value = 'third';
      entry3.valueRaw = 'third';
      let output3 = serializer.serialize(entries);
      
      assert.ok(output3.includes('test=third'), 'Should contain third value');
      assert.ok(!output3.includes('test=initial'), 'Should NOT contain initial');
      assert.ok(!output3.includes('test=first'), 'Should NOT contain first');
      assert.ok(!output3.includes('test=second'), 'Should NOT contain second');
    });

    it('should not confuse similar keys', () => {
      const content = 'prueba=123\nprueba2=456\npruebax=789\n';
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'prueba');
      assert.ok(entry, 'Should find prueba entry');
      entry.value = 'MODIFIED';
      entry.valueRaw = 'MODIFIED';
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes('prueba=MODIFIED'), 'Should contain prueba=MODIFIED');
      assert.ok(output.includes('prueba2=456'), 'Should preserve prueba2');
      assert.ok(output.includes('pruebax=789'), 'Should preserve pruebax');
      assert.ok(!output.includes('prueba=123prueba='), 'Should NOT contain corrupted value');
    });
  });
});
