const fs = require('fs');
const path = require('path');

/**
 * Generates test .properties files of various sizes for E2E testing
 */
class TestDataGenerator {
  constructor(outputDir) {
    this.outputDir = outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Generate a small file (100 keys, 3 locales) - baseline test
   */
  generateSmall() {
    return this.generateFileSet('small', 100, ['default', 'en', 'es']);
  }

  /**
   * Generate a medium file (1000 keys, 5 locales) - typical enterprise app
   */
  generateMedium() {
    return this.generateFileSet('medium', 1000, ['default', 'en', 'es', 'fr', 'de']);
  }

  /**
   * Generate a large file (5000 keys, 5 locales) - stress test
   */
  generateLarge() {
    return this.generateFileSet('large', 5000, ['default', 'en', 'es', 'fr', 'de']);
  }

  /**
   * Generate an extra large file (10000 keys, 3 locales) - extreme test
   */
  generateExtraLarge() {
    return this.generateFileSet('xlarge', 10000, ['default', 'en', 'es']);
  }

  /**
   * Generate hierarchical keys with realistic structure
   */
  generateFileSet(name, keyCount, locales) {
    const categories = {
      ui: {
        dialog: ['title', 'message', 'confirm', 'cancel', 'close'],
        button: ['save', 'delete', 'edit', 'create', 'cancel', 'submit'],
        label: ['name', 'email', 'password', 'username', 'address'],
        tooltip: ['help', 'info', 'warning', 'error'],
        menu: ['file', 'edit', 'view', 'tools', 'help'],
        sidebar: ['navigation', 'filters', 'actions', 'settings']
      },
      api: {
        auth: ['login', 'logout', 'register', 'reset', 'verify'],
        user: ['profile', 'settings', 'preferences', 'activity'],
        product: ['list', 'detail', 'create', 'update', 'delete'],
        order: ['create', 'status', 'history', 'cancel', 'refund'],
        payment: ['process', 'method', 'confirmation', 'receipt']
      },
      error: {
        notFound: ['resource', 'page', 'user', 'product', 'order'],
        unauthorized: ['access', 'permission', 'token', 'session'],
        validation: ['required', 'format', 'length', 'range', 'pattern'],
        server: ['generic', 'database', 'network', 'timeout'],
        conflict: ['duplicate', 'version', 'state']
      },
      validation: {
        required: ['field', 'email', 'password', 'username'],
        email: ['format', 'domain', 'exists'],
        minLength: ['password', 'username', 'name'],
        maxLength: ['description', 'comment', 'bio'],
        pattern: ['phone', 'zip', 'username']
      },
      email: {
        welcome: ['subject', 'body', 'button', 'footer'],
        reset: ['subject', 'body', 'link', 'expires'],
        verify: ['subject', 'body', 'code', 'link'],
        notification: ['subject', 'body', 'action'],
        digest: ['subject', 'summary', 'items', 'frequency']
      },
      notification: {
        success: ['save', 'delete', 'update', 'create'],
        error: ['generic', 'network', 'validation', 'server'],
        warning: ['unsaved', 'expire', 'limit'],
        info: ['update', 'tip', 'feature']
      }
    };

    const categoryNames = Object.keys(categories);
    const keys = [];
    
    for (let i = 0; i < keyCount; i++) {
      const cat = categoryNames[i % categoryNames.length];
      const subcats = Object.keys(categories[cat]);
      const subcat = subcats[Math.floor(i / categoryNames.length) % subcats.length];
      const items = categories[cat][subcat];
      const item = items[i % items.length];
      const suffix = Math.floor(i / (categoryNames.length * subcats.length * items.length));
      
      const key = suffix > 0 
        ? `${cat}.${subcat}.${item}_${suffix}`
        : `${cat}.${subcat}.${item}`;
      
      keys.push(key);
    }

    // Generate files for each locale
    const files = [];
    locales.forEach(locale => {
      const fileName = locale === 'default' 
        ? `${name}.properties`
        : `${name}_${locale}.properties`;
      const filePath = path.join(this.outputDir, fileName);
      
      let content = `# Test file: ${name}\n`;
      content += `# Locale: ${locale}\n`;
      content += `# Keys: ${keyCount}\n`;
      content += `# Generated: ${new Date().toISOString()}\n\n`;

      keys.forEach((key, idx) => {
        // Simulate 10% missing translations in non-default locales
        if (locale !== 'default' && idx % 10 === 0) {
          return; // Skip this key (empty translation)
        }

        const value = this.getLocalizedValue(key, locale, idx);
        
        // Add comment every 50 keys
        if (idx % 50 === 0) {
          content += `\n# Section ${Math.floor(idx / 50) + 1}\n`;
        }
        
        content += `${key}=${value}\n`;
      });

      fs.writeFileSync(filePath, content, 'utf8');
      const stats = fs.statSync(filePath);
      files.push({
        name: fileName,
        path: filePath,
        locale,
        keyCount,
        size: stats.size
      });
    });

    return {
      name,
      keyCount,
      locales,
      files,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    };
  }

  getLocalizedValue(key, locale, index) {
    const values = {
      default: {
        'ui.dialog.title': 'Dialog Title',
        'ui.button.save': 'Save',
        'api.auth.login': 'Login successful',
        'error.notFound.resource': 'Resource not found'
      },
      en: {
        'ui.dialog.title': 'Dialog Title',
        'ui.button.save': 'Save',
        'api.auth.login': 'Login successful',
        'error.notFound.resource': 'Resource not found'
      },
      es: {
        'ui.dialog.title': 'Título del Diálogo',
        'ui.button.save': 'Guardar',
        'api.auth.login': 'Inicio de sesión exitoso',
        'error.notFound.resource': 'Recurso no encontrado'
      },
      fr: {
        'ui.dialog.title': "Titre de la Boîte de Dialogue",
        'ui.button.save': 'Enregistrer',
        'api.auth.login': 'Connexion réussie',
        'error.notFound.resource': 'Ressource non trouvée'
      },
      de: {
        'ui.dialog.title': 'Dialogtitel',
        'ui.button.save': 'Speichern',
        'api.auth.login': 'Anmeldung erfolgreich',
        'error.notFound.resource': 'Ressource nicht gefunden'
      }
    };

    const baseKey = key.replace(/_\d+$/, '');
    const localeData = values[locale] || values['default'];
    const baseValue = localeData[baseKey];
    
    if (baseValue) {
      return `${baseValue} (${index})`;
    }

    // Generate generic value
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1].replace(/_\d+$/, '');
    return `${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)} value ${index} for ${locale}`;
  }

  /**
   * Generate all test files
   */
  generateAll() {
    console.log('Generating test data...\n');
    
    const small = this.generateSmall();
    console.log(`✓ Small: ${small.keyCount} keys, ${small.locales.length} locales (${(small.totalSize / 1024).toFixed(1)} KB)`);
    
    const medium = this.generateMedium();
    console.log(`✓ Medium: ${medium.keyCount} keys, ${medium.locales.length} locales (${(medium.totalSize / 1024).toFixed(1)} KB)`);
    
    const large = this.generateLarge();
    console.log(`✓ Large: ${large.keyCount} keys, ${large.locales.length} locales (${(large.totalSize / 1024).toFixed(1)} KB)`);
    
    const xlarge = this.generateExtraLarge();
    console.log(`✓ XLarge: ${xlarge.keyCount} keys, ${xlarge.locales.length} locales (${(xlarge.totalSize / 1024).toFixed(1)} KB)`);

    return { small, medium, large, xlarge };
  }

  /**
   * Clean up generated files
   */
  cleanup() {
    if (fs.existsSync(this.outputDir)) {
      fs.rmSync(this.outputDir, { recursive: true });
      console.log(`\n✓ Cleaned up ${this.outputDir}`);
    }
  }
}

// CLI usage
if (require.main === module) {
  const generator = new TestDataGenerator('./test-data');
  generator.generateAll();
}

module.exports = { TestDataGenerator };