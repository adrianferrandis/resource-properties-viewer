import type { PropertyEntry } from '../types/properties';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Java .properties file parser (subset of the spec) with a tiny
 * TDD-friendly surface. This implementation focuses on correctness for
 * the common cases used by the tests in this repository.
 */
export class PropertiesParser {
  parse(content: string): PropertyEntry[] {
    // Normalize line endings and split into lines
    const raw = content.replace(/\r\n?/g, '\n');
    // First unfold line continuations
    const unfoldedLines = this.unfoldContinuations(raw.split('\n'));

    const entries: PropertyEntry[] = [];
    const indexByKey = new Map<string, number>();
    let lineNumber = 0;

    for (const line of unfoldedLines) {
      lineNumber++;
      const originalLine = line; // preserve for debugging if needed
      const trimmed = originalLine.trim();

      if (trimmed.length === 0) {
        // Blank line - preserve as an entry with empty key/value to allow round-trip
        const blank: PropertyEntry = {
          key: '',
          value: '',
          commented: false,
          separator: ' ',
          lineNumber,
        };
        entries.push(blank);
        continue;
      }

      // Comment lines - start with # or ! (after optional whitespace)
      const leadingWhitespaceMatch = originalLine.match(/^\s+/);
      const firstNonWS = originalLine.replace(/^\s+/, '');
      const isComment = firstNonWS.startsWith('#') || firstNonWS.startsWith('!');
      if (isComment) {
        const commentText = firstNonWS.replace(/^([#!])\s?/, '');
        const entry: PropertyEntry = {
          key: '',
          value: '',
          commented: true,
          comment: commentText,
          separator: ' ',
          lineNumber,
        } as PropertyEntry;
        // Do not treat as a real key in the bundle, but expose the line as a commented entry
        entries.push(entry);
        continue;
      }

      // Normal key=value entry, with possible separators '=' or ':' or whitespace
      const { keyRaw, valueRaw, sep } = this.splitKeyValue(originalLine);
      // Decode escapes for both key and value
      const key = this.decodeEscapes(keyRaw);
      const value = this.decodeEscapes(valueRaw);

      const entry: PropertyEntry = {
        key,
        value,
        valueRaw,
        commented: false,
        separator: sep,
        lineNumber,
      };

      // If this key existed before, replace previous one (last wins rule)
      if (indexByKey.has(key)) {
        const idx = indexByKey.get(key)!;
        entries[idx] = entry;
      } else {
        indexByKey.set(key, entries.length);
        entries.push(entry);
      }
    }

    // Return final array
    return entries;
  }

  /** Unfold line continuations. A line ending with an odd number of backslashes
   * is treated as continued on the next line. */
  private unfoldContinuations(lines: string[]): string[] {
    const result: string[] = [];
    let current = '';
    let continuing = false;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // Remove trailing CR if present (defensive)
      if (line.endsWith('\r')) line = line.slice(0, -1);
      // Detect continuation by counting trailing backslashes
      let trailBackslashes = 0;
      for (let j = line.length - 1; j >= 0 && line[j] === '\\'; j--) {
        trailBackslashes++;
      }
      const cont = trailBackslashes % 2 === 1; // odd number -> continuation marker
      // Remove the last backslash (the continuation marker) if continuing
      if (cont) {
        line = line.substring(0, line.length - 1);
      }
      if (current.length > 0) {
        current += line;
      } else {
        current = line;
      }
      if (cont) {
        // wait for next line
        continuing = true;
        continue;
      } else {
        result.push(current);
        current = '';
        continuing = false;
      }
    }
    // If file ends with a continuation, push the last accumulated line
    if (current.length > 0) result.push(current);
    return result;
  }

  /** Split a line into raw key and value parts using the earliest unescaped separator.
   * Returns keyRaw, valueRaw and the separator character used. If no separator found,
   * valueRaw is empty and separator is a space by default.
   */
  private splitKeyValue(line: string): { keyRaw: string; valueRaw: string; sep: '=' | ':' | ' ' } {
    // First, look for unescaped '=' or ':' separators
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '=' || ch === ':') {
        // count preceding backslashes to see if this separator is escaped
        let bs = 0;
        let k = i - 1;
        while (k >= 0 && line[k] === '\\') { bs++; k--; }
        if (bs % 2 === 0) {
          const keyRaw = line.substring(0, i);
          const valueRaw = line.substring(i + 1);
          return { keyRaw, valueRaw, sep: ch as '=' | ':' | ' ' };
        }
      }
    }
    // If no unescaped '=' or ':' found, look for first unescaped whitespace
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === ' ' || ch === '\t') {
        let bs = 0;
        let k = i - 1;
        while (k >= 0 && line[k] === '\\') { bs++; k--; }
        if (bs % 2 === 0) {
          const keyRaw = line.substring(0, i);
          const valueRaw = line.substring(i + 1);
          return { keyRaw, valueRaw, sep: ' ' };
        }
      }
    }
    // No separator found
    return { keyRaw: line, valueRaw: '', sep: ' ' };
  }

  /** Decode Java properties escapes in a string. Handles:
   *  - simple escapes: \t, \n, \r, \\, \=, \:, \ (space)
   *  - Unicode escapes: \uXXXX
   */
  private decodeEscapes(input: string): string {
    let out = '';
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === '\\' && i + 1 < input.length) {
        const next = input[i + 1];
        if (next === 'u' && i + 5 < input.length) {
          const hex = input.substring(i + 2, i + 6);
          const code = parseInt(hex, 16);
          if (!isNaN(code)) {
            out += String.fromCharCode(code);
            i += 5;
            continue;
          }
        }
        // common escapes
        switch (next) {
          case 't': out += '\t'; break;
          case 'n': out += '\n'; break;
          case 'r': out += '\r'; break;
          case '\\': out += '\\'; break;
          case '=': out += '='; break;
          case ':': out += ':'; break;
          case ' ': out += ' '; break;
          default:
            // Unknown escape, keep as literal next character
            out += next;
        }
        i++; // skip the escaped char
      } else {
        out += ch;
      }
    }
    return out;
  }
}
