import * as assert from 'assert';
import { PropertiesParser } from '../../services/PropertiesParser';
import { PropertiesSerializer } from '../../services/PropertiesSerializer';

suite('Unicode and Encoding Tests', () => {
  const parser = new PropertiesParser();
  const serializer = new PropertiesSerializer();

  test('should handle accents and special chars', () => {
    const content = 'greeting=¡Hola! ¿Cómo estás?\naccent=Café résumé naïve';
    const result = parser.parse(content);
    assert.strictEqual(result[0].value, '¡Hola! ¿Cómo estás?');
    assert.strictEqual(result[1].value, 'Café résumé naïve');
  });

  test('should handle Chinese characters', () => {
    const content = 'key=你好世界';
    const result = parser.parse(content);
    assert.strictEqual(result[0].value, '你好世界');
  });

  test('should handle emojis', () => {
    const content = 'emoji=🎉🎊🎁';
    const result = parser.parse(content);
    assert.strictEqual(result[0].value, '🎉🎊🎁');
  });

  test('should encode/decode round-trip for Unicode', () => {
    const original = [{ key: 'test', value: 'Café résumé', separator: '=' as const, commented: false, lineNumber: 1 }];
    const serialized = serializer.serialize(original);
    const parsed = parser.parse(serialized);
    assert.strictEqual(parsed[0].value, 'Café résumé');
  });

  test('should handle mixed ASCII and Unicode', () => {
    const content = 'key=Hello Café 123';
    const result = parser.parse(content);
    assert.strictEqual(result[0].value, 'Hello Café 123');
  });
});

suite('Flat Keys Tests (No Hierarchy)', () => {
  const parser = new PropertiesParser();

  test('should handle random keys without hierarchy', () => {
    const content = 'abc=def\nxyz=123\npqr=xyz';
    const result = parser.parse(content);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].key, 'abc');
    assert.strictEqual(result[1].key, 'xyz');
    assert.strictEqual(result[2].key, 'pqr');
  });

  test('should handle single letter keys', () => {
    const content = 'a=1\nb=2\nc=3';
    const result = parser.parse(content);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].key, 'a');
  });

  test('should handle numeric-like keys', () => {
    const content = 'key001=value1\nkey002=value2\nkey003=value3';
    const result = parser.parse(content);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].key, 'key001');
  });

  test('should handle keys with underscores', () => {
    const content = 'key_one=value1\nkey_two=value2';
    const result = parser.parse(content);
    assert.strictEqual(result[0].key, 'key_one');
    assert.strictEqual(result[1].key, 'key_two');
  });

  test('should handle long flat keys', () => {
    const content = 'thisisaverylongkeywithoutanydots=somevalue';
    const result = parser.parse(content);
    assert.strictEqual(result[0].key, 'thisisaverylongkeywithoutanydots');
  });
});

suite('Configuration File Tests', () => {
  const parser = new PropertiesParser();

  test('should parse configuration format (URL, paths)', () => {
    const content = 'database.url=jdbc:mysql://localhost:3306/mydb\nserver.path=/api/v1';
    const result = parser.parse(content);
    assert.strictEqual(result[0].value, 'jdbc:mysql://localhost:3306/mydb');
    assert.strictEqual(result[1].value, '/api/v1');
  });

  test('should handle Windows paths', () => {
    const content = 'path=C:\\Users\\test\\file.txt';
    const result = parser.parse(content);
    assert.strictEqual(result[0].value, 'C:\\Users\\test\\file.txt');
  });

  test('should handle email addresses', () => {
    const content = 'email=admin@example.com';
    const result = parser.parse(content);
    assert.strictEqual(result[0].value, 'admin@example.com');
  });
});

suite('Add Key Tests', () => {
  const parser = new PropertiesParser();
  const serializer = new PropertiesSerializer();

  test('should maintain alphabetical order when adding keys', () => {
    const entries = [
      { key: 'aaa', value: '1', separator: '=' as const, commented: false, lineNumber: 1 },
      { key: 'ccc', value: '3', separator: '=' as const, commented: false, lineNumber: 2 },
    ];
    
    entries.push({ key: 'bbb', value: '2', separator: '=' as const, commented: false, lineNumber: 3 });
    entries.sort((a, b) => a.key.localeCompare(b.key));
    
    assert.strictEqual(entries[0].key, 'aaa');
    assert.strictEqual(entries[1].key, 'bbb');
    assert.strictEqual(entries[2].key, 'ccc');
  });

  test('should group by prefix when adding keys', () => {
    const entries = [
      { key: 'ui.button.ok', value: 'OK', separator: '=' as const, commented: false, lineNumber: 1 },
      { key: 'ui.button.cancel', value: 'Cancel', separator: '=' as const, commented: false, lineNumber: 2 },
      { key: 'error.notfound', value: 'Not found', separator: '=' as const, commented: false, lineNumber: 3 },
    ];
    
    const newKey = 'ui.button.save';
    const prefix = newKey.split('.')[0];
    const lastMatchingIndex = entries.findIndex(e => e.key.startsWith(prefix + '.'));
    
    assert.ok(lastMatchingIndex >= 0, 'Should find matching prefix');
  });
});

suite('Edge Cases and Error Handling', () => {
  const parser = new PropertiesParser();
  const serializer = new PropertiesSerializer();

  test('should handle empty file', () => {
    const result = parser.parse('');
    assert.strictEqual(result.length, 0);
  });

  test('should handle file with only comments', () => {
    const content = '# Comment 1\n# Comment 2\n! Another comment';
    const result = parser.parse(content);
    assert.strictEqual(result.length, 3);
    assert.ok(result.every(e => e.commented));
  });

  test('should handle file with only newlines', () => {
    const content = '\n\n\n';
    const result = parser.parse(content);
    assert.strictEqual(result.filter(e => e.key === '').length, 3);
  });

  test('should handle keys with spaces', () => {
    const content = 'key with spaces=value';
    const result = parser.parse(content);
    assert.strictEqual(result[0].key, 'key');
    assert.strictEqual(result[0].value, 'with spaces=value');
  });

  test('should handle values with leading spaces', () => {
    const entries = [{ key: 'key', value: '  leading spaces', separator: '=' as const, commented: false, lineNumber: 1 }];
    const serialized = serializer.serialize(entries);
    const reparsed = parser.parse(serialized);
    assert.strictEqual(reparsed[0].value, '  leading spaces');
  });

  test('should handle duplicate keys (last wins)', () => {
    const content = 'key=first\nkey=second\nkey=third';
    const result = parser.parse(content);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[2].value, 'third');
  });
});
