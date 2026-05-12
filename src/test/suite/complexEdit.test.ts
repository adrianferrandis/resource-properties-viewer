import * as assert from 'assert';
import { PropertiesParser } from '../../services/PropertiesParser';
import { PropertiesSerializer } from '../../services/PropertiesSerializer';
import type { PropertyEntry } from '../../types/properties';

describe('Complex Edit Operations Tests', () => {
  const parser = new PropertiesParser();
  const serializer = new PropertiesSerializer();

  function getComplexContent(): string {
    const fs = require('fs');
    const path = require('path');
    return fs.readFileSync(path.resolve(__dirname, '../../../test/fixtures/complex-edit-test.properties'), 'utf8');
  }

  describe('Edit existing values in complex file', () => {
    it('should edit simple value without affecting other entries', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'app.name')!;
      assert.ok(entry, 'Should find app.name');
      
      entry.value = 'Nueva Aplicación Modificada';
      entry.valueRaw = 'Nueva Aplicación Modificada';
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes('app.name=Nueva Aplicación Modificada'), 'Should have new value');
      assert.ok(!output.includes('app.name=Mi Aplicación'), 'Should NOT have old value');
      assert.ok(output.includes('app.version=1.2.3'), 'Should preserve app.version');
      assert.ok(output.includes('unicode.japanese=こんにちは世界'), 'Should preserve Japanese text');
    });

    it('should edit value with special characters', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'app.description')!;
      assert.ok(entry, 'Should find app.description');
      
      const newValue = 'Nueva descripción con @#$%^&*() y = signos';
      entry.value = newValue;
      entry.valueRaw = newValue;
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes(`app.description=${newValue}`), 'Should have new description');
      assert.ok(!output.includes('Esta es una aplicación de prueba'), 'Should NOT have old description');
    });

    it('should edit URL value without corruption', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'db.url')!;
      assert.ok(entry, 'Should find db.url');
      
      const newUrl = 'jdbc:postgresql://prod-db:5432/production?ssl=true';
      entry.value = newUrl;
      entry.valueRaw = newUrl;
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes(`db.url=${newUrl}`), 'Should have new URL');
      assert.ok(!output.includes('jdbc:mysql://localhost'), 'Should NOT have old URL');
    });

    it('should edit value with quotes', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'message.welcome')!;
      assert.ok(entry, 'Should find message.welcome');
      
      const newValue = '"Bienvenido" al sistema modificado';
      entry.value = newValue;
      entry.valueRaw = newValue;
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes(`message.welcome=${newValue}`), 'Should have new welcome message');
      assert.ok(!output.includes('message.welcome=Bienvenido al sistema'), 'Should NOT have old value');
    });

    it('should edit value with spaces and tabs', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'message.greeting')!;
      assert.ok(entry, 'Should find message.greeting');
      
      const newValue = 'Hola   con   múltiples   espacios';
      entry.value = newValue;
      entry.valueRaw = newValue;
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes(`message.greeting=${newValue}`), 'Should preserve spaces in value');
    });

    it('should edit unicode value', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'unicode.japanese')!;
      assert.ok(entry, 'Should find unicode.japanese');
      
      const newValue = 'さようなら世界 (Goodbye World)';
      entry.value = newValue;
      entry.valueRaw = newValue;
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes(`unicode.japanese=${newValue}`), 'Should have new Japanese text');
      assert.ok(!output.includes('こんにちは世界'), 'Should NOT have old Japanese text');
      assert.ok(output.includes('unicode.chinese=你好世界'), 'Should preserve other unicode entries');
    });

    it('should edit mathematical expression', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'math.equation')!;
      assert.ok(entry, 'Should find math.equation');
      
      const newValue = 'x=y*z+a/b-c';
      entry.value = newValue;
      entry.valueRaw = newValue;
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes(`math.equation=${newValue}`), 'Should have new equation');
      assert.ok(!output.includes('a=b+c-d*e/f'), 'Should NOT have old equation');
    });

    it('should edit hierarchical key', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'user.profile.name')!;
      assert.ok(entry, 'Should find user.profile.name');
      
      const newValue = 'Nombre Completo Modificado';
      entry.value = newValue;
      entry.valueRaw = newValue;
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes(`user.profile.name=${newValue}`), 'Should have new profile name');
      assert.ok(output.includes('user.profile.email=Correo electrónico'), 'Should preserve other profile fields');
      assert.ok(output.includes('user.settings.notifications=true'), 'Should preserve settings');
    });

    it('should edit value with backslashes (Windows path)', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'path.windows')!;
      assert.ok(entry, 'Should find path.windows');
      
      const newValue = 'D:\\\\Users\\\\Test\\\\Documents\\\\new.txt';
      entry.value = newValue;
      entry.valueRaw = newValue;
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes(`path.windows=${newValue}`), 'Should have new Windows path');
    });

    it('should edit JSON value', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'config.json')!;
      assert.ok(entry, 'Should find config.json');
      
      const newValue = '{"enabled": false, "timeout": 60, "retries": 5, "cache": true}';
      entry.value = newValue;
      entry.valueRaw = newValue;
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes(`config.json=${newValue}`), 'Should have new JSON config');
    });

    it('should edit multiline escaped value', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'multiline.text')!;
      assert.ok(entry, 'Should find multiline.text');
      
      const newValue = 'Primera línea modificada\\nSegunda línea\\nTercera línea nueva';
      entry.value = newValue;
      entry.valueRaw = newValue;
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes(`multiline.text=${newValue}`), 'Should have new multiline text');
    });

    it('should edit similar keys independently', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      // Edit only 'key', not 'key2', 'key10', etc.
      const entry = entries.find(e => e.key === 'key')!;
      assert.ok(entry, 'Should find key');
      
      const newValue = 'VALOR MODIFICADO';
      entry.value = newValue;
      entry.valueRaw = newValue;
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes(`key=${newValue}`), 'Should have modified key');
      assert.ok(output.includes('key2=valor con 2'), 'Should preserve key2');
      assert.ok(output.includes('key10=valor con 10'), 'Should preserve key10');
      assert.ok(output.includes('keyTest=valor de test'), 'Should preserve keyTest');
      assert.ok(output.includes('key_test=con underscore'), 'Should preserve key_test');
    });

    it('should preserve empty values when editing nearby entries', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'backup.schedule')!;
      assert.ok(entry, 'Should find backup.schedule');
      
      entry.value = '0 0 3 * * ?';
      entry.valueRaw = '0 0 3 * * ?';
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes('backup.schedule=0 0 3 * * ?'), 'Should have new schedule');
      assert.ok(output.includes('empty.value='), 'Should preserve empty value with equals');
      assert.ok(output.includes('spaces.value=   '), 'Should preserve spaces value');
    });
  });

  describe('Multiple consecutive edits', () => {
    it('should handle multiple edits to different keys', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      // Edit multiple keys
      const entry1 = entries.find(e => e.key === 'app.name')!;
      entry1.value = 'App 1';
      entry1.valueRaw = 'App 1';
      
      const entry2 = entries.find(e => e.key === 'app.version')!;
      entry2.value = '2.0.0';
      entry2.valueRaw = '2.0.0';
      
      const entry3 = entries.find(e => e.key === 'ui.theme')!;
      entry3.value = 'light';
      entry3.valueRaw = 'light';
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes('app.name=App 1'), 'Should have app.name');
      assert.ok(output.includes('app.version=2.0.0'), 'Should have app.version');
      assert.ok(output.includes('ui.theme=light'), 'Should have ui.theme');
      assert.ok(!output.includes('app.version=1.2.3'), 'Should NOT have old app.version');
      assert.ok(!output.includes('ui.theme=dark'), 'Should NOT have old ui.theme');
    });

    it('should handle edit-delete-add sequence', () => {
      const content = getComplexContent();
      let entries = parser.parse(content);
      
      // Edit existing
      const entry = entries.find(e => e.key === 'cache.enabled')!;
      entry.value = 'false';
      entry.valueRaw = 'false';
      
      // Simulate removing an entry
      entries = entries.filter(e => e.key !== 'cache.ttl');
      
      // Add new entry
      entries.push({
        key: 'cache.newKey',
        value: 'newValue',
        valueRaw: 'newValue',
        separator: '=',
        commented: false,
        lineNumber: entries.length + 1
      });
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes('cache.enabled=false'), 'Should have edited cache.enabled');
      assert.ok(!output.includes('cache.ttl=3600'), 'Should NOT have deleted cache.ttl');
      assert.ok(output.includes('cache.newKey=newValue'), 'Should have new key');
    });
  });

  describe('Add new keys to complex file', () => {
    it('should add new key without corrupting existing entries', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      // Add new key
      entries.push({
        key: 'new.key.added',
        value: 'valor nuevo añadido',
        valueRaw: 'valor nuevo añadido',
        separator: '=',
        commented: false,
        lineNumber: entries.length + 1
      });
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes('new.key.added=valor nuevo añadido'), 'Should have new key');
      assert.ok(output.includes('validation.required=El campo'), 'Should preserve validation messages');
      assert.ok(output.includes('unicode.emoji=Hello 👋 World'), 'Should preserve emojis');
      assert.ok(output.includes('math.equation=a=b+c-d*e/f'), 'Should preserve math equations');
    });

    it('should add key with special characters', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      entries.push({
        key: 'special.new.key',
        value: 'Valor con = y : y ! @ #',
        valueRaw: 'Valor con = y : y ! @ #',
        separator: '=',
        commented: false,
        lineNumber: entries.length + 1
      });
      
      const output = serializer.serialize(entries);
      
      assert.ok(output.includes('special.new.key=Valor con = y : y ! @ #'), 'Should have new key with special chars');
    });
  });

  describe('Verify no data corruption', () => {
    it('should not duplicate values when editing', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      const entry = entries.find(e => e.key === 'key')!;
      assert.ok(entry, 'Should find key');
      
      const originalValue = entry.value;
      entry.value = 'MODIFICADO';
      entry.valueRaw = 'MODIFICADO';
      
      const output = serializer.serialize(entries);
      
      // Count occurrences of key
      const keyOccurrences = (output.match(/^key=/gm) || []).length;
      assert.strictEqual(keyOccurrences, 1, 'Key should appear exactly once');
      
      assert.ok(!output.includes(`${originalValue}key=`), 'Should NOT have duplicated/corrupted value');
      assert.ok(!output.includes(`key=${originalValue}key=`), 'Should NOT have corrupted format');
    });

    it('should maintain file structure after edits', () => {
      const content = getComplexContent();
      const entries = parser.parse(content);
      
      // Edit a few entries
      const entry1 = entries.find(e => e.key === 'app.name')!;
      entry1.value = 'MOD';
      entry1.valueRaw = 'MOD';
      
      const entry2 = entries.find(e => e.key === 'category.shopping')!;
      entry2.value = '🛒 Shopping Modified';
      entry2.valueRaw = '🛒 Shopping Modified';
      
      const output = serializer.serialize(entries);
      
      // Verify no data loss
      assert.ok(output.includes('app.name=MOD'), 'Should have modified app.name');
      assert.ok(output.includes('category.shopping=🛒 Shopping Modified'), 'Should have modified shopping');
      assert.ok(output.includes('db.host=localhost'), 'Should preserve db.host');
      assert.ok(output.includes('message.farewell='), 'Should preserve message.farewell');
      assert.ok(output.includes('security.password.minLength=8'), 'Should preserve security settings');
      assert.ok(output.includes('notification.newMessage=Tienes'), 'Should preserve notifications');
    });
  });
});
