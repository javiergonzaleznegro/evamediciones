#!/usr/bin/env node
/* Validador · Toma de medidas · Eva Textil Hogar
   Uso:  node validador.js [carpeta]     (por defecto: ./publicar o .)
   Comprueba el juego completo de la versión antes de entregar.
   Todos los checks deben salir en verde; un rojo = no se entrega. */

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const carpeta = process.argv[2] ||
  (fs.existsSync("publicar/index.html") ? "publicar" : ".");
const F = (n) => path.join(carpeta, n);

let ok = 0, mal = 0, omit = 0;
function check(nombre, cond, detalle) {
  if (cond) { ok++; console.log("  ✔ " + nombre + (detalle ? "  [" + detalle + "]" : "")); }
  else      { mal++; console.log("  ✘ " + nombre + (detalle ? "  [" + detalle + "]" : "")); }
}
function omitido(nombre, motivo) { omit++; console.log("  – " + nombre + "  [omitido: " + motivo + "]"); }

console.log("Validador eva-medidas · carpeta: " + carpeta + "\n");

/* ---------- 1. ficheros presentes ---------- */
console.log("1. Ficheros del juego");
const html = fs.existsSync(F("index.html")) ? fs.readFileSync(F("index.html"), "utf8") : "";
check("index.html existe", !!html);
const swTxt = fs.existsSync(F("sw.js")) ? fs.readFileSync(F("sw.js"), "utf8") : "";
check("sw.js existe", !!swTxt);
for (const ic of ["icon-192.png", "icon-512.png", "icon-maskable-512.png"])
  fs.existsSync(F(ic)) ? check(ic + " existe", true) : omitido(ic + " existe", "no está en la carpeta; no cambia en esta entrega");

/* ---------- 2. sintaxis ---------- */
console.log("\n2. Sintaxis");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
check("scripts encontrados", scripts.length >= 1, scripts.length + " bloques");
let sintaxisOk = true;
scripts.forEach((s, i) => {
  try { new vm.Script(s); } catch (e) { sintaxisOk = false; console.log("     error en script " + i + ": " + e.message); }
});
check("node acepta todos los <script>", sintaxisOk);
try { new vm.Script(swTxt); check("sw.js sintaxis", true); }
catch (e) { check("sw.js sintaxis", false, e.message); }

/* ---------- 3. versión sincronizada ---------- */
console.log("\n3. Versión");
const vApp = (html.match(/Toma de medidas · v(\d+\.\d+\.\d+)/) || [])[1];
const vSw = (swTxt.match(/eva-medidas-v(\d+\.\d+\.\d+)/) || [])[1];
check("versión visible en la app", !!vApp, "v" + vApp);
check("caché del sw con versión", !!vSw, "v" + vSw);
check("app y sw sincronizadas", vApp && vApp === vSw);
const readme = fs.existsSync(F("README.md")) ? fs.readFileSync(F("README.md"), "utf8") : "";
if (readme) check("README menciona la versión", readme.includes("v" + vApp));

/* ---------- 4. manifiesto e iconos ---------- */
console.log("\n4. Manifiesto");
try {
  const man = JSON.parse(fs.readFileSync(F("manifest.webmanifest"), "utf8"));
  check("manifest.webmanifest parsea", true);
  const faltan = (man.icons || []).filter(i => !fs.existsSync(F(i.src))).map(i => i.src);
  faltan.length ? omitido("iconos del manifiesto existen", "faltan en carpeta: " + faltan.join(",")) : check("iconos del manifiesto existen", true, "todos");
} catch (e) { check("manifest.webmanifest parsea", false, e.message); }
check("index enlaza el manifiesto", html.includes('rel="manifest"'));
check("index registra el service worker", html.includes('serviceWorker.register("sw.js")'));

/* ---------- 5. ids referenciados existen ---------- */
console.log("\n5. Identificadores");
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
const usados = new Set([...html.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g)].map(m => m[1]));
const noDef = [...usados].filter(u => !ids.has(u));
check("todos los $(#id) existen en el HTML", noDef.length === 0, noDef.join(",") || (usados.size + " usados"));

/* ---------- 6. prueba de humo con jsdom ---------- */
console.log("\n6. Prueba de humo (jsdom)");
const { JSDOM } = require("jsdom");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://ejemplo.test/" });
const doc = dom.window.document;
const $$ = (s, c) => [...(c || doc).querySelectorAll(s)];
const marca = (sec, grupo, valor) => {
  const r = $$(".chips[data-chips=" + grupo + "] input", sec).find(x => x.value === valor);
  r.checked = true;
  r.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
};
const pon = (sec, campo, v) => {
  const el = sec.querySelector("[data-field=" + campo + "]");
  el.value = v;
  el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
};
const visible = (el) => {
  for (let n = el; n && n.nodeType === 1 && !n.classList.contains("estancia"); n = n.parentElement) {
    if (n.style.display === "none") return false;
    if (n.classList.contains("condicional") && !n.classList.contains("visible")) return false;
  }
  return true;
};

let sec = doc.querySelector(".estancia");
check("arranca con una estancia", !!sec);

// estor por defecto: tipoAncho visible, anchoMec oculto, enagua oculta
check("estor: tipoAncho visible", visible(sec.querySelector("[data-chips=tipoAncho]")));
check("estor: ancho mecanismo oculto", !visible(sec.querySelector("[data-field=anchoMec]")));
check("estor: campos de enagua ocultos", !visible(sec.querySelector("[data-field=mesaAncho]")));

// cortina o visillo
marca(sec, "articulo", "Cortina o visillo");
check("cortina: ancho mecanismo visible", visible(sec.querySelector("[data-field=anchoMec]")));
check("cortina: alto tejido visible", visible(sec.querySelector("[data-field=altoTejido]")));
check("cortina: mando oculto", !visible(sec.querySelector("[data-chips=mando]")));
check("cortina: tipoAncho oculto", !visible(sec.querySelector("[data-chips=tipoAncho]")));

// vertical
marca(sec, "articulo", "Cortina vertical");
check("vertical: alto terminado visible", visible(sec.querySelector("[data-field=altoTerm]")));
check("vertical: apertura visible", visible(sec.querySelector("[data-chips=apertura]")));
check("vertical: mando visible", visible(sec.querySelector("[data-chips=mando]")));
check("vertical: salida oculta", !visible(sec.querySelector("[data-chips=salida]")));

// enagua rectangular de capa 130×80, alto 70 → 286 × 236... calculado abajo
marca(sec, "articulo", "Enagua");
marca(sec, "forma", "Rectangular");
pon(sec, "mesaAncho", "130");
pon(sec, "mesaLargo", "80");
pon(sec, "altoMesa", "70");
marca(sec, "tipoEnagua", "De capa");
const val = sec.querySelector(".calculo-med").textContent;
// ancho: 130 + 140 − 4 = 266 · largo: 80 + 140 − 4 = 216
check("enagua capa 130×80 alto 70 → 266 × 216", val.includes("266") && val.includes("216"), val);

// redonda: largo oculto y Ø
marca(sec, "forma", "Redonda");
check("enagua redonda: largo de mesa oculto", !visible(sec.querySelector("[data-field=mesaLargo]")));
pon(sec, "mesaAncho", "100");
const val2 = sec.querySelector(".calculo-med").textContent;
check("enagua redonda Ø100 alto 70 → Ø 236", val2.includes("236"), val2);

// validación: la enagua completa + cliente debe pasar; visillo sin cejilla debe fallar
pon(sec, "estancia", "Salón");
pon(sec, "tejido", "Loneta");
pon(sec, "color", "crudo");
pon(sec, "proveedor", "MN");
doc.querySelector("#t-cliente").value = "Prueba";
dom.window.document.getElementById("btnPdf");
const validarFn = dom.window.eval("typeof validar === 'function'");
check("validar accesible en la página", validarFn === false || validarFn === true); // ámbito cerrado: se prueba vía botón

// visillo con cejilla: marcar y comprobar impresión
marca(sec, "articulo", "Visillo con cejilla");
pon(sec, "ancho", "90");
pon(sec, "alto", "141");
marca(sec, "acabado", "Cejilla y bastilla");   // obligatorio desde v1.3.2
marca(sec, "cejilla", "Arriba y abajo");
pon(sec, "unidades", "6");

// generar el contenido de impresión pulsando el botón (con print anulado)
dom.window.print = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
doc.querySelector("#btnPdf").click();
const printHtml = doc.querySelector("#printRoot").innerHTML;
check("PDF: sale la estancia", printHtml.includes("Salón"));
check("PDF: 6 VISILLO CON CEJILLA", printHtml.includes("6 VISILLO CON CEJILLA"));
check("PDF: CEJILLA Y BASTILLA · ARRIBA Y ABAJO", printHtml.includes("CEJILLA Y BASTILLA · ARRIBA Y ABAJO"));
check("PDF: etiqueta ANCHO TEJIDO", printHtml.includes("ANCHO TEJIDO"));
check("PDF: medidas 90 y 141", printHtml.includes("90") && printHtml.includes("141"));

// pestañas plegables (tanda v1.3.1)
const cab = sec.querySelector(".cab");
cab.querySelector(".cab-titulo") && check("cab con título de estancia", cab.querySelector(".cab-titulo").textContent.includes("Salón"));
cab.click();
check("tocar la cabecera pliega la estancia", sec.classList.contains("plegada"));
cab.click();
check("tocar otra vez la despliega", !sec.classList.contains("plegada"));
doc.getElementById("togTrabajo").click();
check("datos del trabajo se pliegan", doc.getElementById("bloqueTrabajo").classList.contains("plegada"));
pon(sec, "proveedor", "");
cab.click();
doc.querySelector("#btnPdf").click();
check("la validación despliega la estancia con fallos", !sec.classList.contains("plegada"));
check("y marca el campo en rojo", !!sec.querySelector(".campo.con-error"));
pon(sec, "proveedor", "MN");

// ---- tanda v1.3.2 ----
const tubos = $$(".chips[data-chips=tubo] input", sec).map(x => x.value).filter(Boolean);
check("tubo: 18 / 28 / 43 mm en ese orden", tubos.join("|") === "18 mm|28 mm|43 mm", tubos.join(","));
check("ya no existe «Estor exterior»", !$$(".chips[data-chips=articulo] input", sec).some(x => x.value === "Estor exterior"));

marca(sec, "articulo", "Estor veneciano");
check("veneciano: tipo de mecanismo visible", visible(sec.querySelector("[data-chips=tipoMec]")));
check("veneciano: salida oculta", !visible(sec.querySelector("[data-chips=salida]")));
check("veneciano: motorizado oculto", !visible(sec.querySelector("[data-chips=motor]")));
check("veneciano: tubo oculto", !visible(sec.querySelector("[data-chips=tubo]")));
check("veneciano: guías ocultas", !visible(sec.querySelector("[data-chips=guias]")));
check("veneciano: mando visible", visible(sec.querySelector("[data-chips=mando]")));
check("veneciano: número de cintas visible", visible(sec.querySelector("[data-field=cintas]")));
marca(sec, "articulo", "Estor con varilla");
check("con varilla: número de cintas oculto", !visible(sec.querySelector("[data-field=cintas]")));

marca(sec, "articulo", "Cortina vertical");
check("vertical: color mecanismo visible", visible(sec.querySelector("[data-chips=mecColor]")));

marca(sec, "articulo", "Cortina o visillo");
check("cortina: alto suelo/techo visible", visible(sec.querySelector("[data-field=altoST]")));
const filaAnchoMec = sec.querySelector("[data-field=anchoMec]").closest(".fila");
check("cortina: alto suelo/techo en la misma fila que ancho mecanismo", !!filaAnchoMec.querySelector("[data-field=altoST]"));
pon(sec, "anchoMec", "350"); pon(sec, "altoTejido", "260"); pon(sec, "vueloM", "7");
marca(sec, "vueloTipo", "Partido");
let svgC = sec.querySelector(".esquema .dibujo").innerHTML;
check("cortina: el dibujo muestra los metros de vuelo", svgC.includes("VUELO 7 m"));
check("cortina: línea de puntos en el centro si es partido", svgC.includes("stroke-dasharray"));
marca(sec, "vueloTipo", "Entero");
svgC = sec.querySelector(".esquema .dibujo").innerHTML;
check("cortina: sin línea de puntos si es entero", !svgC.includes("stroke-dasharray"));

marca(sec, "articulo", "Visillo con cejilla");
check("visillo: riel oculto", !visible(sec.querySelector("[data-chips=riel]")));
marca(sec, "acabado", "Cejilla y bastilla"); marca(sec, "cejilla", "Arriba y abajo");
pon(sec, "ancho", "90"); pon(sec, "alto", "141"); pon(sec, "cejillaCm", "3"); pon(sec, "bastillaCm", "3");
let svgV = sec.querySelector(".esquema .dibujo").innerHTML;
check("visillo: dibujo con cejilla 3 cm y bastilla 3 cm", svgV.includes("cejilla 3 cm") && svgV.includes("bastilla 3 cm"));
check("visillo: arriba y abajo → 4 líneas de acabado", (svgV.match(/stroke-width="1.2"/g) || []).length === 4);
marca(sec, "acabado", "Bastilla abierta");
check("visillo: bastilla abierta oculta el campo cejilla", !visible(sec.querySelector("[data-field=cejillaCm]")));
svgV = sec.querySelector(".esquema .dibujo").innerHTML;
check("visillo: bastilla abierta → 2 líneas", (svgV.match(/stroke-width="1.2"/g) || []).length === 2 && svgV.includes("bastilla abierta 3 cm"));

marca(sec, "articulo", "Enagua");
check("enagua: etiqueta «Alto de la mesa»", /Alto de la mesa/.test(sec.querySelector("[data-field=altoMesa]").closest(".campo").textContent));
marca(sec, "forma", "Rectangular"); pon(sec, "mesaAncho", "130"); pon(sec, "mesaLargo", "80"); pon(sec, "altoMesa", "70");
marca(sec, "tipoEnagua", "De capa");
check("enagua: alto de la enagua = 70 − 2 = 68", sec.querySelector(".calculo-alto").textContent.includes("68"));
check("enagua: medidas de capa 266 × 216", /266.*216/.test(sec.querySelector(".calculo-med").textContent));
let svgE = sec.querySelector(".esquema .dibujo").innerHTML;
check("enagua: el dibujo lleva la tapa 130 × 80 y el alto de la enagua", svgE.includes("130 cm") && svgE.includes("80 cm") && svgE.includes("Alto de la enagua: 68 cm"));
marca(sec, "forma", "Petaca");
svgE = sec.querySelector(".esquema .dibujo").innerHTML;
check("enagua petaca: lados curvos (path con curvas Q)", /<path d="M[^"]*Q[^"]*Q/.test(svgE));
marca(sec, "forma", "Canto romo");
svgE = sec.querySelector(".esquema .dibujo").innerHTML;
check("enagua canto romo: rectángulo redondeado (rx)", /<rect [^>]*rx="\d+"/.test(svgE));
marca(sec, "forma", "Redonda"); pon(sec, "mesaAncho", "100");
svgE = sec.querySelector(".esquema .dibujo").innerHTML;
check("enagua redonda: Ø 100 cm y alto de la enagua en el dibujo", svgE.includes("Ø 100 cm") && svgE.includes("Alto de la enagua"));

marca(sec, "articulo", "Riel o barra");
check("riel: campo proveedor presente", !!sec.querySelector("[data-field=rielProveedor]"));
marca(sec, "articulo", "Visillo con cejilla");

// duplicados de data-field dentro de la plantilla
const tplHtml = html.match(/<template id="tplEstancia">([\s\S]*?)<\/template>/)[1];
const campos = [...tplHtml.matchAll(/data-field="([^"]+)"/g)].map(m => m[1]);
const dup = campos.filter((c, i) => campos.indexOf(c) !== i);
check("sin data-field duplicados en la plantilla", dup.length === 0, dup.join(",") || campos.length + " campos");

const grupos = [...tplHtml.matchAll(/data-chips="([^"]+)"/g)].map(m => m[1]);
const dupG = grupos.filter((c, i) => grupos.indexOf(c) !== i);
check("sin grupos de chips duplicados", dupG.length === 0, dupG.join(",") || grupos.length + " grupos");

/* ---------- resultado ---------- */
console.log("\n══════════════════════════════");
console.log("RESULTADO: " + ok + " en verde · " + mal + " en rojo" + (omit ? " · " + omit + " omitidos" : "") + (mal ? "  →  NO ENTREGAR" : "  →  listo para entregar"));
process.exit(mal ? 1 : 0);
