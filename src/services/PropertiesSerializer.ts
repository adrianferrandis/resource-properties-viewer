import type { PropertyEntry } from '../types';

/**
 * Serializes a list of PropertyEntry back into a .properties formatted string.
 * This serializer focuses on round-trip fidelity with a simple, well-defined
 * output format that mirrors a typical .properties syntax while preserving
 * metadata stored in PropertyEntry (comments, commented entries, and separators).
 */
export class PropertiesSerializer {
  /** Serialize a list of entries to a single .properties string. */
  serialize(entries: PropertyEntry[]): string {
    const lines: string[] = [];
    for (const entry of entries) {
      // Preserve blank lines if an entry explicitly represents one
      if (entry.key === '' && entry.value === '' && !entry.comment && !entry.commented) {
        lines.push('');
        continue;
      }
      // Optional comment line before the entry
      if (entry.comment !== undefined && entry.comment !== null) {
        lines.push('# ' + entry.comment);
      }
      // Serialize the single entry line (may be multi-line value)
      lines.push(this.serializeEntry(entry));
    }
    return lines.join('\n');
  }

  /** Serialize a single entry, preserving its formatting and escaping. */
  serializeEntry(entry: PropertyEntry): string {
    // If this is a blank line represented by empty key/value, emit a blank line
    if (entry.key === '' && entry.value === '') {
      return '';
    }

    const prefix = entry.commented ? '# ' : '';
    // Escape key (to be safe for non-ASCII; leave ASCII intact for readability)
    const keyEscaped = this.escapeUnicode(this.escapeLeadingKey(entry.key));

    // Value handling: support multi-line with backslash continuation
    const valueLines = entry.value.split('\n');
    const firstLineEscaped = this.escapeUnicode(this.escapeValue(valueLines[0], true));

    const sep = entry.separator;

    const lines: string[] = [];
    // First line contains the key, separator, and first value segment
    if (valueLines.length > 1) {
      // multi-line value: end first line with a trailing continuation
      lines.push(`${prefix}${keyEscaped}${sep}${firstLineEscaped} \\`);
      // Remaining lines are indented continuations
      for (let i = 1; i < valueLines.length; i++) {
        const seg = this.escapeUnicode(this.escapeValue(valueLines[i], false));
        lines.push('    ' + seg);
      }
    } else {
      lines.push(`${prefix}${keyEscaped}${sep}${firstLineEscaped}`);
    }

    return lines.join('\n');
  }

  // Helpers -----------------------------------------------------------------
  private escapeLeadingKey(key: string): string {
    // If key is empty, return as-is
    if (key.length === 0) return key;
    // Escape a few spaces that could lead the key to be misinterpreted
    if (key.startsWith(' ')) {
      return '\\' + key;
    }
    return key;
  }

  private escapeUnicode(input: string): string {
    // Convert all non-ASCII characters to \uXXXX escapes
    return input.replace(/[^\x00-\x7F]/g, (c) => {
      const code = c.charCodeAt(0);
      return `\\u${code.toString(16).padStart(4, '0')}`;
    });
  }

  private escapeValue(input: string, isFirstLine: boolean): string {
    let s = input;
    s = s.replace(/\\/g, '\\\\');
    s = s.replace(/([=!:#])/g, '\\$1');
    if (isFirstLine && s.startsWith(' ')) {
      s = '\\' + s;
    }
    s = this.escapeUnicode(s);
    return s;
  }
}

export default PropertiesSerializer;
