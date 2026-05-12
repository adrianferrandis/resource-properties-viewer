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
      // Handle commented entries (standalone comment lines)
      if (entry.commented) {
        // If there's a comment field, use it (as produced by parser)
        // Otherwise reconstruct from key/value (for manually created entries)
        if (entry.comment) {
          lines.push('# ' + entry.comment);
        } else if (entry.key) {
          const sep = entry.separator || '=';
          lines.push('# ' + entry.key + sep + entry.value);
        } else {
          lines.push('#');
        }
        continue;
      }

      // Preserve blank lines if an entry explicitly represents one
      if (entry.key === '' && entry.value === '' && !entry.comment) {
        lines.push('');
        continue;
      }

      // Optional comment line before the entry
      if (entry.comment !== undefined && entry.comment !== null) {
        lines.push('# ' + entry.comment);
      }

      // Serialize the single entry line
      lines.push(this.serializeEntry(entry));
    }
    return lines.join('\n');
  }

  /** Serialize a single entry, preserving its formatting and escaping. */
  serializeEntry(entry: PropertyEntry): string {
    // Handle blank lines
    if (entry.key === '' && entry.value === '') {
      return '';
    }

    // Escape key (to be safe for non-ASCII; leave ASCII intact for readability)
    const keyEscaped = this.escapeUnicode(this.escapeLeadingKey(entry.key));

    // Use valueRaw if available to preserve original formatting, otherwise fall back to escaped value
    const valueToUse = entry.valueRaw !== undefined ? entry.valueRaw : this.escapeValue(entry.value, true);

    const sep = entry.separator;

    // Handle case where there's no value (key-only entry)
    if (valueToUse === '') {
      return keyEscaped;
    }

    return `${keyEscaped}${sep}${valueToUse}`;
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
