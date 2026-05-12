// Represents a single key-value entry in a .properties file
export interface PropertyEntry {
  key: string;
  value: string;
  valueRaw?: string;          // Raw value as it appears in file (preserves formatting)
  comment?: string;           // Comment before this entry
  commented: boolean;         // Whether this entry is commented out (# prefix)
  separator: '=' | ':' | ' '; // The separator used (preserved for round-trip)
  lineNumber: number;          // Line number in original file
}

// Represents a parsed .properties file
export interface PropertiesFile {
  locale: string | null;      // null for default, 'en', 'es', etc.
  entries: PropertyEntry[];
  rawContent: string;         // Original file content
}

// Represents a locale column in the table
export interface LocaleInfo {
  locale: string | null;      // null = default, 'en', 'es_ES', etc.
  displayName: string;        // Human-readable name
  fileName: string;           // Full file name
  fileUri: string;            // Full file URI
}

// The unified bundle model - matrix of keys × locales
export interface BundleModel {
  baseName: string;           // e.g., "messages" from messages.properties
  keys: string[];             // All unique keys across all locales
  locales: LocaleInfo[];      // All discovered locales
  entries: Map<string, Map<string | null, PropertyEntry | null>>;
  // entries.get(key).get(locale) = PropertyEntry or null if missing
}