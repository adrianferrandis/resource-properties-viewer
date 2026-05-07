import * as vscode from 'vscode';
import * as path from 'path';

export interface BundleFile {
  fileName: string;
  fileUri: string;
  locale: string | null;
  displayName: string;
}

export class BundleDiscovery {
  async discoverRelatedFiles(fileUri: string): Promise<BundleFile[]> {
    const uri = vscode.Uri.parse(fileUri);
    const dir = path.dirname(uri.fsPath);
    const baseName = this.getBaseName(path.basename(uri.fsPath));
    
    const bundleFiles: BundleFile[] = [];
    
    try {
      const dirUri = vscode.Uri.file(dir);
      const entries = await vscode.workspace.fs.readDirectory(dirUri);
      
      for (const [name, type] of entries) {
        if (type === vscode.FileType.File && name.endsWith('.properties')) {
          const fileBaseName = this.getBaseName(name);
          if (fileBaseName === baseName) {
            const filePath = path.join(dir, name);
            const locale = this.parseLocaleFromFileName(name);
            bundleFiles.push({
              fileName: name,
              fileUri: vscode.Uri.file(filePath).toString(),
              locale,
              displayName: this.getDisplayName(locale)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error discovering related files:', error);
    }
    
    // Sort: default first, then alphabetically by locale
    bundleFiles.sort((a, b) => {
      if (a.locale === null) return -1;
      if (b.locale === null) return 1;
      return a.locale.localeCompare(b.locale);
    });
    
    return bundleFiles;
  }
  
  parseLocaleFromFileName(fileName: string): string | null {
    // Remove .properties extension
    const withoutExt = fileName.replace(/\.properties$/, '');
    
    // Check for locale suffix pattern: basename[_locale]
    const underscoreIndex = withoutExt.indexOf('_');
    if (underscoreIndex === -1) {
      return null; // Default locale (no suffix)
    }
    
    // Extract locale part after first underscore
    return withoutExt.substring(underscoreIndex + 1);
  }
  
  getDisplayName(locale: string | null): string {
    if (locale === null) {
      return 'Default';
    }
    
    // Common locale mappings
    const localeMap: { [key: string]: string } = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'en_US': 'English (US)',
      'en_GB': 'English (UK)',
      'es_ES': 'Spanish (Spain)',
      'es_MX': 'Spanish (Mexico)',
      'fr_FR': 'French (France)',
      'fr_CA': 'French (Canada)',
      'de_DE': 'German (Germany)',
      'pt_BR': 'Portuguese (Brazil)',
      'pt_PT': 'Portuguese (Portugal)',
      'zh_CN': 'Chinese (Simplified)',
      'zh_TW': 'Chinese (Traditional)',
      'ja_JP': 'Japanese'
    };
    
    if (localeMap[locale]) {
      return localeMap[locale];
    }
    
    // Try to parse language code
    const langCode = locale.split('_')[0].toLowerCase();
    if (localeMap[langCode]) {
      return localeMap[langCode];
    }
    
    // Fallback: return the locale code itself
    return locale;
  }
  
  private getBaseName(fileName: string): string {
    // Remove .properties extension
    const withoutExt = fileName.replace(/\.properties$/, '');
    
    // Remove locale suffix if present
    const underscoreIndex = withoutExt.indexOf('_');
    if (underscoreIndex === -1) {
      return withoutExt;
    }
    
    return withoutExt.substring(0, underscoreIndex);
  }
}
