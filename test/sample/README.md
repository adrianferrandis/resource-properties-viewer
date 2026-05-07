# Sample Test Files

These .properties files are for testing the Resource Properties Viewer extension.

## Files

- messages.properties - Default locale (fallback)
- messages_en.properties - English locale
- messages_es.properties - Spanish locale (some keys missing for testing)
- messages_fr.properties - French locale

## Testing Scenarios

1. **Open messages.properties** - Should show all keys with all 4 locales as columns
2. **Missing Key Highlighting** - Keys ui.dialog.yes, ui.dialog.no, error.required should be highlighted as missing in Spanish column
3. **Edit a cell** - Change a value and verify it's saved to correct file
4. **Unicode handling** - Verify unicode.example displays correctly
5. **Add new key** - Add a new key and verify it appears in all files

## Usage

Open any of these .properties files in VSCode with the extension installed.
The custom editor should open showing the table view.