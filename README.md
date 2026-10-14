# GoTracker

Catálogo público estático para GitHub Pages. Inglés por defecto. Búsqueda de nombres en inglés, español de España y Latinoamérica, francés, alemán, italiano, japonés, coreano, chino simplificado y tradicional. Las imágenes y los nombres se incluyen en el proyecto y no dependen de servicios externos al consultar la web.

## Abrir una vista previa

Desde esta carpeta, ejecuta `python -m http.server 8765` y abre `http://localhost:8765`. Sirve también en la subcarpeta de un repositorio de GitHub Pages. No necesita npm install ni un servidor de aplicación.

## Publicar

Sube el contenido de esta carpeta a la raíz de tu repositorio en la rama `main`, incluidos `.github` y `.nojekyll`. En Settings → Pages, selecciona GitHub Actions como origen. El flujo incluido valida los datos y publica la web. Referencia: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Una única edición para todos los idiomas

El archivo maestro de mantenimiento es `downloads/GoTracker_Catalog_EN.xlsx`. Edita sus columnas In collection, ZIP folder, Released in GO y GO to HOME. No cambies los números de Dex ni los nombres que identifican las filas. Usa Yes/No; en GO to HOME también se admite N/A. Si agregas archivos, reemplaza también `downloads/GoTracker.zip` con la colección actualizada.

Guarda el Excel y súbelo al mismo repositorio. Al publicar, el flujo lee ese archivo una sola vez y actualiza `data/catalog.json`, que comparten todas las vistas de idioma. No hay diez listas de disponibilidad que mantener ni macros. El JSON generado durante el flujo se publica sin crear un commit automático en el repositorio.

Para actualizar la vista local: `python -m pip install openpyxl==3.1.5` y después `python tools/sync-from-excel.py`. Para comprobar nombres, filtros y datos: `node tools/check.mjs`.

No edites la disponibilidad directamente en el JSON si mantienes activada la sincronización con Excel: el siguiente despliegue vuelve a leer el maestro. Los nombres de los diez idiomas se conservan dentro del JSON; modificar un nombre no altera la identidad ni la disponibilidad de la especie.

## Compartir búsquedas

El botón Share search copia un enlace con idioma y filtros. Por ejemplo, `?lang=es-419&available=no&go=yes&home=yes` muestra las entradas que faltan y que ya se pueden transferir desde GO a HOME. Buscar un nombre alemán mientras la interfaz está en inglés también funciona.

## Alcance y créditos

La lista agrupa especies y formas regionales. Disponibilidad significa al menos un ejemplar, no todas las variantes. La carpeta es la ubicación del archivo, no todos los juegos compatibles. Los nombres localizados provienen de las tablas de PKHeX; imágenes y catálogo de referencia de Ofca / OfcaTBS, conservados de la hoja proporcionada. Los Pokémon y sus imágenes pertenecen a sus respectivos titulares. Las referencias se conservan en la sección Data and credits y en `data/catalog.json`.

Revisión de contenido: 14/10/2026. Spinda, Zygarde y Eternatus figuran con transferencia bloqueada desde GO; los no lanzados figuran con N/A. La fecha cambia al sincronizar cambios en los datos, pero la sincronización no verifica automáticamente nuevos lanzamientos ni restricciones.
