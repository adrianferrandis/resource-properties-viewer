import assert from 'assert';
import { PropertiesSerializer } from '../../services/PropertiesSerializer';
import type { PropertyEntry } from '../../types';

// Simple mock parse just for round-trip verification in tests.
function mockParse(text: string): PropertyEntry[] {
  const lines = text.split('\n');
  const entries: PropertyEntry[] = [];
  let pendingComment: string | undefined = undefined;
  let currentIndex = 1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      // blank line, represent as a blank entry
      entries.push({ key: '', value: '', comment: undefined, commented: false, separator: '=', lineNumber: currentIndex++ });
      continue;
    }
    if (line.startsWith('# ')) {
      // Could be a preceding comment line or a commented entry line
      const rest = line.substring(2);
      // If there is a pending comment and no current entry started, treat as a real comment line
      // Otherwise, treat as a commented entry line (no pending comment)
      if (pendingComment === undefined) {
        // treat as a comment line, store for next entry
        pendingComment = rest;
        continue;
      } else {
        // treat as a commented entry line
        const [k, sep, ...restVal] = rest.split(/([=:\s])/);
        const value = restVal.length ? restVal.join('').trim() : '';
        entries.push({ key: (rest.includes('=') || rest.includes(':') ? rest.split(/([=:\s])/)[0] : rest), value, comment: undefined, commented: true, separator: '=', lineNumber: currentIndex++ });
        pendingComment = undefined;
        continue;
      }
    }
    // Regular entry line: key<sep>value
    const m = line.match(/^([^=:\s]+)([=:\s])(.*)$/);
    if (m) {
      const [, key, sep, val] = m;
      entries.push({ key, value: val, comment: pendingComment, commented: false, separator: sep as any, lineNumber: currentIndex++, });
      pendingComment = undefined;
      continue;
    }
    // Fallback: whole line treated as a value with a dummy key
    entries.push({ key: 'line', value: line, comment: pendingComment, commented: false, separator: '=', lineNumber: currentIndex++ });
    pendingComment = undefined;
  }
  return entries;
}

describe('PropertiesSerializer', () => {
  it('round-trips entries: parse -> serialize -> parse yields equivalent entries', () => {
    const serializer = new PropertiesSerializer();
    const original: PropertyEntry[] = [
      { key: 'greeting', value: 'Hello World', comment: 'Common greeting', commented: false, separator: '=', lineNumber: 1 },
      { key: 'status', value: 'ok', comment: undefined, commented: false, separator: '=', lineNumber: 2 },
    ];

    const serialized = serializer.serialize(original);
    const reparsed = mockParse(serialized);
    // Compare deep equality for key properties (lineNumber may follow order)
    assert.strictEqual(reparsed.length, original.length);
    for (let i = 0; i < original.length; i++) {
      const a = original[i];
      const b = reparsed[i];
      // We compare a subset that should be preserved by round-trip via our own parser
      assert.strictEqual(b.key, a.key);
      assert.strictEqual(b.value, a.value);
      assert.strictEqual(b.comment, a.comment);
      assert.strictEqual(b.commented, a.commented);
      assert.strictEqual(b.separator, a.separator);
    }
  });

  it('escapes unicode characters in values', () => {
    const serializer = new PropertiesSerializer();
    const entry: PropertyEntry = {
      key: 'unicode',
      value: 'こんにちは',
      comment: undefined,
      commented: false,
      separator: '=',
      lineNumber: 1,
    };
    const out = serializer.serializeEntry(entry);
    assert.ok(out.includes('\\u3053\\u3093\\u306b\\u3061\\u306f'));
  });

  it('escapes special characters in values', () => {
    const serializer = new PropertiesSerializer();
    const entry: PropertyEntry = {
      key: 'var',
      value: 'a=b:c!#',
      comment: undefined,
      commented: false,
      separator: '=',
      lineNumber: 1,
    };
    const out = serializer.serializeEntry(entry);
    // Expect escapes before =, :, !, #
    assert.ok(out.includes('a\\=b\\:c\\!\\#'));
  });

  it('preserves comments and commented entries', () => {
    const serializer = new PropertiesSerializer();
    const entry1: PropertyEntry = {
      key: 'k', value: 'v', comment: 'note', commented: false, separator: '=', lineNumber: 1
    } as any;
    const entry2: PropertyEntry = {
      key: 'k2', value: 'v2', comment: undefined, commented: true, separator: '=', lineNumber: 2
    } as any;
    const s = serializer.serialize([entry1, entry2]);
    assert.ok(s.includes('# note'));
    assert.ok(s.includes('# ' + entry2.key));
  });

  it('preserves different separators', () => {
    const serializer = new PropertiesSerializer();
    const a: PropertyEntry = { key: 'a', value: '1', comment: undefined, commented: false, separator: '=', lineNumber: 1 };
    const b: PropertyEntry = { key: 'b', value: '2', comment: undefined, commented: false, separator: ':', lineNumber: 2 };
    const s = serializer.serialize([a, b]);
    assert.ok(s.includes('a=1'));
    // Ensure second line uses ':' separator before value
    assert.ok(s.includes('b:2'));
  });
});
