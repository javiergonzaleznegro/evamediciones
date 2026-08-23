# Toma de medidas · Eva Textil Hogar

Aplicación interna para tomar medidas de estores, cortinas y rieles en casa del
cliente y generar un PDF por estancia, listo para enviar al proveedor.

**Versión actual: v1.3.1**

---

## Qué hace

- Una ficha por estancia con todos los campos fijos, para que no se olvide ninguno.
- Cada artículo (estor, cortina o visillo, visillo con cejilla, cortina vertical, noche y día, enagua, riel) muestra solo sus propios campos.
- Distingue de forma obligatoria **ancho de tejido** y **ancho de mecanismo**.
- Dibuja el esquema con las cotas según se escriben las medidas.
- Genera un **PDF A4 por estancia** con el formato de las hojas de siempre.
- Permite **pasar un trabajo a medias** de un dispositivo a otro en un archivo `.txt`.
- Botones **A− / A+** para agrandar la letra; el tamaño elegido se recuerda.
- Funciona **sin cobertura** una vez abierta la primera vez.

## Dónde se guardan los datos

En el propio dispositivo, en el navegador. **No se sube nada a internet ni a
ningún servidor.** Publicar este repositorio expone solo el programa, nunca los
datos de clientes. Al pulsar «Empezar un trabajo nuevo» se borra lo que hubiera.

---

## Publicar con GitHub Pages

1. Crear un repositorio nuevo llamado `eva-medidas`, de tipo **Public**.
2. Subir estos archivos a la raíz (`Add file` → `Upload files` → `Commit changes`):
   - `index.html`
   - `manifest.webmanifest`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
   - `icon-maskable-512.png`
   - `README.md`
3. `Settings` → `Pages` → en **Source** elegir `Deploy from a branch`,
   rama `main` y carpeta `/ (root)` → `Save`.
4. Esperar uno o dos minutos. La dirección será:
   `https://USUARIO.github.io/eva-medidas/`

## Instalar en el móvil o la tablet

1. Abrir esa dirección con **Chrome** (Android).
2. Menú `⋮` → **Añadir a pantalla de inicio**.
3. Aparece con su icono y se abre a pantalla completa, como cualquier app.

---

## Actualizar a una versión nueva

1. Subir el `index.html` nuevo **con el mismo nombre**, encima del anterior.
2. En `sw.js`, cambiar la línea `const CACHE = "eva-medidas-vX.Y.Z";` al número
   de la versión nueva. Sin esto, los dispositivos pueden seguir con la copia
   antigua guardada.
3. Comprobar en el móvil: abrir la app y mirar el número de versión al final de
   la página. Si no ha cambiado, cerrarla del todo y volver a abrirla.

## Historial de versiones

| Versión | Cambios |
|---|---|
| v1.0.0 | Primera versión: fichas por estancia, esquema con cotas, PDF por estancia, borradores en `.txt`, icono propio. |
| v1.1.0 | Se puede desmarcar una opción pulsándola otra vez. Botones fuera de la barra fija. Logotipo real en la cabecera e iconos en secciones y botones. |
| v1.2.0 | Fecha en casilla de texto con botón «Hoy» (el calendario de Android se desbordaba). Cabecera de tamaño fijo. Esquema que se adapta al ancho disponible. |
| v1.2.1 | Icono con la regla de cinco marcas y en azul #0060C0, con más contraste. |
| v1.3.0 | Cada artículo abre su propio menú con sus datos: cortina o visillo, visillo con cejilla, cortina vertical, noche y día y enagua. La enagua de capa calcula sola sus medidas (mesa + 2×alto − 4 cm) y dibuja la forma de la mesa. |
| v1.3.1 | Pestañas plegables: «Datos del trabajo» y cada estancia se pliegan tocando su cabecera. Al cargar un trabajo con varias estancias, vienen plegadas con su nombre a la vista. |
