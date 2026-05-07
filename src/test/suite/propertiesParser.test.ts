import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { PropertiesParser } from '../../../services/PropertiesParser';

function readFixture(name: string): string {
  const fp = path.resolve(process.cwd(), 'test', 'fixtures', name);
  return fs.readFileSync(fp, 'utf8');
}

describe('PropertiesParser - Phase 2.1', () => {
  it('parses a simple properties file with multiple separators and comments', () => {
    const parser = new PropertiesParser();
    const content = readFixture('simple.properties');
    const entries = parser.parse(content);

    // Simple keys
    const byKey = new Map(entries.filter(e => e.key !== '').map(e => [e.key, e]));

    assert.strictEqual(byKey.get('greeting')?.value, 'Hello');
    assert.strictEqual(byKey.get('Farewell')?.value, 'Goodbye');
    // Last-wins for duplicates
    assert.strictEqual(byKey.get('duplicate')?.value, 'second');
    // Continuation value
    assert.strictEqual(byKey.get('multiLine')?.value, 'This is a long value that continues on the next line and should be joined');
    // Empty value
    assert.strictEqual(byKey.get('empty')?.value, '');
    // Special key with spaces and path with escaped backslash
    assert.strictEqual(byKey.get('key_with_space')?.value, 'Value with spaces');
    assert.strictEqual(byKey.get('path')?.value, 'C:\\temp');
    // Blank line preserved as an entry with empty key
    const hasBlank = entries.find(e => e.key === '');
    assert.ok(hasBlank, 'Should preserve a blank-line entry');
    // Comments preserved
    const commentEntries = entries.filter(e => e.commented);
    assert.strictEqual(commentEntries.length, 2, 'Two comment lines should be captured');
  });

  it('parses unicode escapes in values', () => {
    const parser = new PropertiesParser();
    const content = readFixture('unicode.properties');
    const entries = parser.parse(content);
    const byKey = new Map(entries.filter(e => e.key !== '').map(e => [e.key, e]));
    // unicodeKey should decode to éValue
    assert.strictEqual(byKey.get('unicodeKey')?.value, 'éValue');
  });

  it('handles line continuations', () => {
    const parser = new PropertiesParser();
    const content = readFixture('continuations.properties');
    const entries = parser.parse(content);
    const byKey = new Map(entries.filter(e => e.key !== '').map(e => [e.key, e]));
    assert.strictEqual(byKey.get('longLine')?.value, 'This is a long value that continues on the next line and should be joined');
  });

  it('parses fixture with comments separately and preserves them', () => {
    const parser = new PropertiesParser();
    const content = readFixture('comments.properties');
    const entries = parser.parse(content);
    const commentEntries = entries.filter(e => e.commented);
    assert.strictEqual(commentEntries.length, 2);
    // The real option key/value should still be parsed
    const actual = entries.find(e => e.key === 'actualKey');
    assert.ok(actual, 'Should contain actualKey from fixture');
    assert.strictEqual(actual!.value, 'actualValue');
  });
});
