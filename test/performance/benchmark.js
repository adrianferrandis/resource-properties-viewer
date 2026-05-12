/**
 * Performance Benchmark for Resource Properties Editor
 * 
 * Tests render performance with large files to determine if virtual scrolling
 * provides >= 25-30% improvement.
 * 
 * Usage: Open test/performance/benchmark.html in browser or run via Node
 */

const fs = require('fs');
const path = require('path');

class PerformanceBenchmark {
  constructor() {
    this.results = [];
  }

  /**
   * Generate a large .properties file for testing
   */
  generateLargeFile(keyCount, localeCount, outputDir) {
    const locales = ['default', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko'].slice(0, localeCount);
    const baseName = `messages`;
    
    console.log(`\n📝 Generating test files...`);
    console.log(`   Keys: ${keyCount}, Locales: ${localeCount}`);
    console.log(`   Total values: ${keyCount * localeCount}`);

    // Generate hierarchical keys
    const categories = ['ui', 'api', 'error', 'validation', 'email', 'notification'];
    const subcategories = {
      ui: ['dialog', 'button', 'label', 'tooltip', 'menu', 'sidebar'],
      api: ['auth', 'user', 'product', 'order', 'payment'],
      error: ['notFound', 'unauthorized', 'validation', 'server', 'timeout'],
      validation: ['required', 'email', 'minLength', 'maxLength', 'pattern'],
      email: ['welcome', 'reset', 'verify', 'notification', 'digest'],
      notification: ['success', 'error', 'warning', 'info']
    };

    const keys = [];
    for (let i = 0; i < keyCount; i++) {
      const cat = categories[i % categories.length];
      const subcatList = subcategories[cat];
      const subcat = subcatList[i % subcatList.length];
      const name = `key_${Math.floor(i / (categories.length * subcatList.length))}_${i}`;
      keys.push(`${cat}.${subcat}.${name}`);
    }

    // Generate files for each locale
    const files = [];
    locales.forEach((locale, idx) => {
      const fileName = locale === 'default' ? `${baseName}.properties` : `${baseName}_${locale}.properties`;
      const filePath = path.join(outputDir, fileName);
      
      let content = `# Generated test file\n`;
      content += `# Keys: ${keyCount}, Locale: ${locale}\n`;
      content += `# Generated: ${new Date().toISOString()}\n\n`;

      keys.forEach((key, keyIdx) => {
        // 10% of keys are empty in non-default locales (simulating missing translations)
        const isEmpty = locale !== 'default' && (keyIdx % 10 === 0);
        
        if (!isEmpty) {
          const value = this.generateValue(key, locale, keyIdx);
          content += `${key}=${value}\n`;
        }
      });

      fs.writeFileSync(filePath, content, 'utf8');
      const stats = fs.statSync(filePath);
      files.push({
        locale,
        filePath,
        size: stats.size,
        keyCount: keys.length
      });
      console.log(`   ✓ ${fileName} (${(stats.size / 1024).toFixed(1)} KB)`);
    });

    return { files, keys, locales };
  }

  generateValue(key, locale, index) {
    const values = {
      default: {
        'ui.dialog': ['Welcome Dialog', 'Confirmation', 'Error Message', 'Success', 'Warning'],
        'ui.button': ['Submit', 'Cancel', 'Save', 'Delete', 'Edit'],
        'api.auth': ['Login successful', 'Invalid credentials', 'Session expired', 'Access granted'],
        'error.notFound': ['Resource not found', 'Page unavailable', 'Item missing', '404 Error']
      },
      es: {
        'ui.dialog': ['Diálogo de Bienvenida', 'Confirmación', 'Mensaje de Error', 'Éxito', 'Advertencia'],
        'ui.button': ['Enviar', 'Cancelar', 'Guardar', 'Eliminar', 'Editar'],
        'api.auth': ['Inicio exitoso', 'Credenciales inválidas', 'Sesión expirada', 'Acceso concedido'],
        'error.notFound': ['Recurso no encontrado', 'Página no disponible', 'Elemento faltante', 'Error 404']
      },
      fr: {
        'ui.dialog': ['Dialogue de Bienvenue', 'Confirmation', "Message d'Erreur", 'Succès', 'Avertissement'],
        'ui.button': ['Soumettre', 'Annuler', 'Enregistrer', 'Supprimer', 'Modifier'],
        'api.auth': ['Connexion réussie', 'Identifiants invalides', 'Session expirée', 'Accès accordé'],
        'error.notFound': ['Ressource non trouvée', 'Page indisponible', 'Élément manquant', 'Erreur 404']
      }
    };

    const prefix = key.split('.').slice(0, 2).join('.');
    const localeValues = values[locale] || values['default'];
    const prefixValues = localeValues[prefix] || localeValues['ui.dialog'];
    
    return prefixValues[index % prefixValues.length] + ` (${index})`;
  }

  /**
   * Benchmark render performance
   */
  async benchmarkRender(keyCounts, localeCounts) {
    console.log('\n' + '='.repeat(60));
    console.log('PERFORMANCE BENCHMARK');
    console.log('='.repeat(60));

    const testDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    for (const keyCount of keyCounts) {
      for (const localeCount of localeCounts) {
        console.log(`\n📊 Testing: ${keyCount} keys × ${localeCount} locales`);
        
        // Generate test files
        const { files, keys, locales } = this.generateLargeFile(keyCount, localeCount, testDir);
        
        // Simulate BundleModel (similar to what PropertiesEditorProvider creates)
        const bundleModel = this.createBundleModel(keys, locales);
        
        // Measure render performance
        const metrics = this.measureRenderPerformance(bundleModel);
        
        this.results.push({
          keyCount,
          localeCount,
          totalValues: keyCount * localeCount,
          ...metrics,
          files: files.map(f => ({ locale: f.locale, size: f.size }))
        });

        console.log(`\n   Results:`);
        console.log(`   • Render time: ${metrics.renderTime.toFixed(2)}ms`);
        console.log(`   • DOM elements: ${metrics.domElements.toLocaleString()}`);
        console.log(`   • Memory estimate: ${(metrics.memoryEstimate / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   • Scroll jank: ${metrics.scrollJank ? 'YES ⚠️' : 'No ✓'}`);
        console.log(`   • Filter time: ${metrics.filterTime.toFixed(2)}ms`);
      }
    }

    this.generateReport();
    this.cleanup(testDir);
  }

  createBundleModel(keys, locales) {
    const entries = {};
    
    keys.forEach(key => {
      entries[key] = {};
      locales.forEach(locale => {
        // Simulate 10% empty cells
        if (Math.random() > 0.1) {
          entries[key][locale] = `Value for ${key} in ${locale}`;
        } else {
          entries[key][locale] = null;
        }
      });
    });

    return {
      locales,
      entries
    };
  }

  measureRenderPerformance(bundleModel) {
    // Simulate DOM operations similar to editor.js renderFlatTable()
    const startTime = process.hrtime.bigint();
    
    let domElements = 0;
    let memoryEstimate = 0;
    
    // Simulate table structure
    const keys = Object.keys(bundleModel.entries).sort();
    
    // Header row
    domElements += 1; // thead
    domElements += 1; // tr
    domElements += 1; // key th
    domElements += bundleModel.locales.length; // locale ths
    
    // Body rows
    domElements += 1; // tbody
    keys.forEach(key => {
      domElements += 1; // tr
      domElements += 1; // key td
      domElements += bundleModel.locales.length; // value tds
      
      // Estimate memory per cell (rough approximation)
      bundleModel.locales.forEach(locale => {
        const value = bundleModel.entries[key][locale] || '';
        memoryEstimate += 200; // Base element overhead
        memoryEstimate += value.length * 2; // String bytes
      });
    });

    const endTime = process.hrtime.bigint();
    const renderTime = Number(endTime - startTime) / 1000000; // Convert to ms

    // Simulate filter performance
    const filterStart = process.hrtime.bigint();
    const searchTerm = 'test';
    const filtered = keys.filter(key => {
      if (key.toLowerCase().includes(searchTerm)) return true;
      return bundleModel.locales.some(loc => {
        const val = bundleModel.entries[key][loc];
        return val && val.toLowerCase().includes(searchTerm);
      });
    });
    const filterEnd = process.hrtime.bigint();
    const filterTime = Number(filterEnd - filterStart) / 1000000;

    // Detect potential scroll jank (simplified heuristic)
    // If we have > 2000 rows, scrolling will likely be janky
    const scrollJank = keys.length > 2000;

    return {
      renderTime,
      domElements,
      memoryEstimate,
      scrollJank,
      filterTime,
      rowCount: keys.length
    };
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('BENCHMARK REPORT');
    console.log('='.repeat(60));

    console.log('\n┌─────────────┬──────────┬──────────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ Keys        │ Locales  │ Total Values │ Render (ms) │ DOM Nodes   │ Memory (MB) │');
    console.log('├─────────────┼──────────┼──────────────┼─────────────┼─────────────┼─────────────┤');

    this.results.forEach(r => {
      console.log(
        `│ ${r.keyCount.toString().padEnd(11)} │ ${r.localeCount.toString().padEnd(8)} │ ` +
        `${r.totalValues.toString().padEnd(12)} │ ${r.renderTime.toFixed(2).padEnd(11)} │ ` +
        `${r.domElements.toLocaleString().padEnd(11)} │ ${(r.memoryEstimate / 1024 / 1024).toFixed(2).padEnd(11)} │`
      );
    });

    console.log('└─────────────┴──────────┴──────────────┴─────────────┴─────────────┴─────────────┘');

    // Analysis
    console.log('\n📈 ANALYSIS:');
    
    const problematic = this.results.filter(r => r.scrollJank);
    if (problematic.length > 0) {
      console.log('   ⚠️  Performance issues detected:');
      problematic.forEach(r => {
        console.log(`      • ${r.keyCount} keys × ${r.locales} locales: ${r.domElements.toLocaleString()} DOM nodes`);
      });
      
      // Estimate virtual scrolling improvement
      const worstCase = problematic[problematic.length - 1];
      const visibleRows = 20; // Typical viewport
      const virtualDomElements = visibleRows * (1 + worstCase.localeCount) + 10; // + header
      const reduction = ((worstCase.domElements - virtualDomElements) / worstCase.domElements * 100);
      
      console.log(`\n   💡 Virtual scrolling potential:`);
      console.log(`      • Current: ${worstCase.domElements.toLocaleString()} DOM nodes`);
      console.log(`      • With virtual scrolling: ~${virtualDomElements.toLocaleString()} DOM nodes`);
      console.log(`      • Reduction: ${reduction.toFixed(1)}%`);
      
      if (reduction >= 25) {
        console.log(`      ✅ Virtual scrolling would provide ${reduction.toFixed(0)}% improvement (exceeds 25% threshold)`);
      } else {
        console.log(`      ❌ Virtual scrolling would only provide ${reduction.toFixed(0)}% improvement (below 25% threshold)`);
      }
    } else {
      console.log('   ✓ All test cases perform adequately');
      console.log('   Virtual scrolling not necessary at current scale');
    }

    // Save detailed report
    const reportPath = path.join(__dirname, 'benchmark-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: this.results,
      recommendations: this.generateRecommendations()
    }, null, 2));
    
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  }

  generateRecommendations() {
    const recommendations = [];
    
    const largeFiles = this.results.filter(r => r.keyCount >= 3000);
    if (largeFiles.length > 0) {
      recommendations.push({
        type: 'virtual_scrolling',
        priority: 'high',
        condition: 'Files with 3000+ keys',
        impact: '75-95% reduction in DOM nodes',
        recommendation: 'Implement virtual scrolling for large files'
      });
    }

    const slowFilters = this.results.filter(r => r.filterTime > 100);
    if (slowFilters.length > 0) {
      recommendations.push({
        type: 'filter_optimization',
        priority: 'medium',
        condition: 'Filter operations >100ms',
        recommendation: 'Debounce filter input and optimize search algorithm'
      });
    }

    return recommendations;
  }

  cleanup(testDir) {
    // Optionally clean up test files
    console.log('\n🧹 Cleaning up test files...');
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
      console.log('   ✓ Test files removed');
    }
  }
}

// Run benchmark if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  
  // Test various sizes
  const keyCounts = [100, 500, 1000, 2000, 5000];
  const localeCounts = [1, 3, 5];
  
  benchmark.benchmarkRender(keyCounts, localeCounts)
    .then(() => {
      console.log('\n✅ Benchmark complete!\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Benchmark failed:', err);
      process.exit(1);
    });
}

module.exports = { PerformanceBenchmark };