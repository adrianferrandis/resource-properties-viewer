# Demo Application - Resource Bundle Editor

Esta carpeta contiene una aplicación de ejemplo para probar la extensión Resource Bundle Editor.

## Archivos

- `messages.properties` - Idioma por defecto (español)
- `messages_en.properties` - Inglés
- `messages_es.properties` - Español (con algunas claves faltantes para probar)
- `messages_fr.properties` - Francés

## Cómo probar

1. Abre VSCode en la carpeta `demo-app`
2. Haz clic en cualquier archivo `.properties`
3. El editor visual debería abrirse automáticamente
4. Prueba:
   - Editar celdas haciendo doble clic
   - Ver el resaltado de claves faltantes (en español)
   - Usar el filtro de búsqueda
   - Cambiar entre vista plana y jerárquica
   - Añadir nuevas claves
   - Eliminar claves

## Características a probar

✅ Tabla unificada con claves como filas e idiomas como columnas
✅ Edición inline de celdas
✅ Resaltado de claves faltantes (amarillo)
✅ Detección automática de archivos relacionados
✅ Persistencia de cambios en los archivos originales
✅ Compatible con temas de VSCode
