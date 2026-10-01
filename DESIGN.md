# DESIGN.md — Germa 66

Guía visual obligatoria para todo el frontend. Cualquier persona (o IA) que cree o modifique
una página debe seguir este documento. Si algo no está cubierto aquí, elige la opción que
se sienta más "página de manga impresa" y menos "plantilla de dashboard".

---

## 1. Concepto

**Manga shōnen de piratas, impreso en papel.** La interfaz debe sentirse como un tomo de
manga japonés de aventuras en el mar: tinta negra sobre papel, viñetas de distintos tamaños,
tramas de puntos, líneas de velocidad y momentos de impacto, con el imaginario pirata de
carteles de recompensa, cartas náuticas, timones, rosas de los vientos y olas dibujadas a tinta.
Germa 66 es un reino militar-científico, así que el tono mezcla energía de aventura con
precisión técnica: planos, sellos, fichas de registro.

**Manga, no cómic americano.** Nada de estética de superhéroes o pop art: sin letra tipo
cómic (Bangers y similares), sin onomatopeyas en inglés ("¡POW!", "¡CLANK!"), sin sombras
de color detrás del texto. Las onomatopeyas van en katakana, como en el manga original.

Tres palabras guía: **tinta, impacto, orden.**

- Tinta: contrastes fuertes, bordes negros gruesos, nada difuso.
- Impacto: los momentos importantes (guardar, error, login) tienen peso visual y movimiento.
- Orden: es un sistema de gestión; tablas y formularios deben ser claros y fáciles de leer.
  El estilo nunca sacrifica la usabilidad.

Inspiración en el estilo manga en general. **No usar personajes, logos ni arte oficial de
ninguna serie.** Todo el arte e íconos deben ser originales.

---

## 2. Paleta

Definir siempre como variables CSS en `:root` y usar solo estas variables.

```css
:root {
  /* Base */
  --papel:        #F4EFE6;  /* fondo principal, papel envejecido */
  --papel-claro:  #FBF8F2;  /* superficies elevadas: viñetas, modales */
  --tinta:        #111111;  /* texto, bordes, sombras duras */
  --tinta-suave:  #4A4A4A;  /* texto secundario */
  --trama:        #D9D2C5;  /* puntos de screentone, separadores */

  /* Acentos (usar con moderación) */
  --rojo:         #C8102E;  /* acento principal: acciones primarias, alertas, títulos clave */
  --azul-mar:     #1D4E89;  /* enlaces, información, estado "en proceso" */
  --dorado:       #E8A317;  /* destacados, insignias, estado "pendiente" */
  --verde:        #2E7D32;  /* éxito, estado "completado" */
  --rosa:         #B8336A;  /* solo como color de capítulo (Reportes) */

  /* Mar nocturno: fondo de la app (las viñetas siguen siendo de papel) */
  --mar:          #13233B;  /* fondo general, con patrón seigaiha en --mar-trama */
  --mar-profundo: #0B1628;  /* barra superior y menú lateral */
  --mar-claro:    #223A5E;  /* hover y separadores sobre el mar */
  --mar-trama:    #1C3152;  /* líneas del seigaiha (olas en escamas) */
  --texto-mar:    #E9E3D6;  /* texto secundario sobre el mar */
  --sombra-color: #03070D;  /* color de las sombras duras */
}
```

Reglas:
- **Papel sobre mar nocturno.** El fondo de la aplicación, la barra superior y el menú son
  azul marino oscuro (`--mar*`). Todo el contenido (viñetas, tablas, formularios, globos)
  vive en viñetas de papel, con tinta negra. Sobre el mar el texto va en `--papel-claro` o
  `--texto-mar`, y el foco del teclado en `--dorado` (el rojo no llega a 3:1 sobre el mar).
- Dentro de las viñetas, el 80 % es papel + tinta. Los acentos son el 20 % restante.
- **Un solo acento dominante por pantalla.** Normalmente el rojo.
- **Colores de capítulo (hermanos Vinsmoke).** Cada módulo se identifica con el color de
  un hermano: Inventario `--rojo` (Ichiji), Cyborgs `--azul-mar` (Niji), Reinos clientes
  `--dorado` (Sanji), Pedidos `--verde` (Yonji), Reportes `--rosa` (Reiju). Administración
  usa `--tinta-suave`. El color de capítulo solo aparece en el número "CAP. 0X", el banderín
  de la cabecera del módulo y la sombra del ítem activo del menú; nunca como fondo de áreas
  grandes ni como franja gruesa en un lateral de una viñeta. Sobre `--dorado` el texto va en `--tinta`; sobre los demás, en `--papel-claro`.
- Prohibido: degradados morados/azules, neón, colores pastel genéricos, negro puro como
  fondo, y viñetas o tablas oscuras: lo oscuro es solo el mar de fondo, nunca el contenido.
- Contraste mínimo de texto: 4.5:1 (WCAG AA).

---

## 3. Tipografía

```html
<link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;800&family=Pirata+One&family=Rye&display=swap" rel="stylesheet">
<!-- Reggae One solo con los caracteres katakana usados (parámetro &text=) -->
<link href="https://fonts.googleapis.com/css2?family=Reggae+One&display=swap&text=..." rel="stylesheet">
```

```css
:root {
  --fuente-titulo:  'Pirata One', 'Georgia', serif;          /* títulos, nombre del reino */
  --fuente-cartel:  'Rye', 'Georgia', serif;                 /* letra de cartel de recompensa */
  --fuente-sfx:     'Reggae One', 'Pirata One', sans-serif;  /* onomatopeyas en katakana */
  --fuente-texto:   'M PLUS Rounded 1c', 'Segoe UI', sans-serif;
}
```

| Uso | Fuente | Notas |
|---|---|---|
| Títulos de página (h1), nombre del reino | Pirata One | 2.5–4rem, puede ir ligeramente rotado (-2°) |
| Títulos de sección (h2) y nombres de capítulo | Pirata One | 1.75–2rem |
| Pestañas de viñeta, "CAP. 0X", sellos, cifras grandes | Rye | Letra de cartel de "SE BUSCA"; nunca en párrafos |
| Texto, tablas, formularios, botones | M PLUS Rounded 1c | 1rem base, 700 para botones y encabezados de tabla |
| Onomatopeyas decorativas (ドン!, ザッ!, ガシャン!) | Reggae One | Katakana en tinta con halo de papel; solo decoración, con `aria-hidden="true"` |

Prohibido: Inter, Roboto, Poppins, Arial como fuente principal; Bangers u otras letras de
cómic americano.

---

## 4. Layout

- **Viñetas, no tarjetas.** El contenido se organiza como paneles de manga: CSS Grid con
  tamaños asimétricos (una viñeta grande + varias pequeñas), separados por "canaletas"
  de 12–16px de papel.
- Se permiten cortes diagonales en viñetas decorativas con `clip-path`, nunca en tablas
  ni formularios.
- **Prohibido el patrón genérico:** hero centrado + tres tarjetas iguales debajo.
- Ancho máximo de contenido: 1280px. Márgenes generosos.
- Navegación lateral fija en escritorio, estilo "índice de capítulos" (cada módulo es un
  capítulo numerado: CAP. 01 Usuarios, CAP. 02 Inventario, etc.).
- En móvil, las viñetas se apilan en una columna y la navegación pasa a menú superior.

---

## 5. Bordes, sombras y texturas

```css
:root {
  --borde:        3px solid var(--tinta);
  --borde-grueso: 4px solid var(--tinta);
  --sombra:       6px 6px 0 var(--tinta);   /* sombra dura desplazada, nunca difusa */
  --sombra-hover: 9px 9px 0 var(--tinta);
  --radio:        2px;                       /* casi rectos; nada de bordes muy redondeados */
}
```

- **Prohibido:** `box-shadow` con desenfoque, glassmorphism, `backdrop-filter: blur`,
  bordes redondeados grandes (más de 6px).
- **Screentone (trama de puntos)** para fondos de secciones destacadas:
  ```css
  .trama {
    background-image: radial-gradient(var(--trama) 1.2px, transparent 1.2px);
    background-size: 8px 8px;
  }
  ```
- **Líneas de velocidad** para encabezados de módulo y momentos de acción:
  ```css
  .velocidad {
    background: repeating-conic-gradient(from 0deg at 50% 50%,
      var(--tinta) 0deg 1.5deg, transparent 1.5deg 9deg);
    opacity: 0.08;
  }
  ```
- **Fondo seigaiha (青海波)**: el mar de fondo lleva el patrón japonés de olas en escamas
  (`body::before`, máscara SVG en `--mar-trama`). Nada de tramas de puntos sobre el mar:
  los puntos sobre fondo oscuro recuerdan al cómic de superhéroes.
- **Carta náutica** (cuadrícula de latitud/longitud) de fondo en las cabeceras de módulo,
  con una **rosa de los vientos** original a la derecha (`.carta`, símbolo `#rosa-vientos`).
- **Olas de tinta** (`.olas`) al pie de las viñetas grandes: login y bienvenida.
- **Marco de cartel** (`.marco`): línea fina interior a 10px del borde grueso, en viñetas
  decorativas y cabeceras.
- Las pestañas de viñeta tienen forma de **banderín** (punta recortada con `clip-path`).
- Opcional: Rough.js para bordes de trazo irregular en elementos decorativos
  (insignias, sellos, recuadros de bienvenida). No usarlo en tablas ni campos de formulario.

---

## 6. Componentes

### Botones
- Primario: fondo `--rojo`, texto `--papel-claro`, `--borde`, `--sombra`.
- Secundario: fondo `--papel-claro`, texto `--tinta`, `--borde`, `--sombra`.
- Hover: se desplaza `translate(-3px, -3px)` y la sombra crece a `--sombra-hover`.
- Active: `translate(3px, 3px)` y la sombra baja a `2px 2px 0` (efecto de "presionar").
- Texto en mayúsculas, M PLUS Rounded 1c 800.

### Viñetas (contenedores)
- Fondo `--papel-claro`, `--borde-grueso`, `--sombra`.
- Título de la viñeta en una "pestaña" negra con texto claro en la esquina superior izquierda.

### Tablas (Inventario, Cyborgs, Reinos Clientes, Pedidos, Reportes)
- Prioridad absoluta: legibilidad.
- Encabezado: fondo `--tinta`, texto `--papel-claro`, M PLUS 800 en mayúsculas.
- Filas alternas: `--papel-claro` y `--papel`.
- Bordes de celda 1px `--tinta` con opacidad 0.2; borde exterior `--borde`.
- Hover de fila: fondo con `.trama` suave.
- Números alineados a la derecha, con `font-variant-numeric: tabular-nums`.

### Formularios
- Campos: fondo blanco papel, `--borde`, radio `--radio`, padding 12px.
- Foco: borde `--rojo` y `--sombra` (nunca el anillo azul por defecto del navegador sin estilo).
- Etiquetas encima del campo, nunca solo placeholder.
- Errores en un **globo de diálogo** rojo bajo el campo.

### Globos de diálogo (alertas y mensajes)
- Mensajes del sistema (éxito, error, aviso) se muestran como globos de manga con
  "colita" hecha con `::before`/`::after`.
- Éxito: borde `--verde`. Error: fondo `--rojo`, texto claro, borde grueso irregular
  (globo de grito). Info: borde `--azul-mar`.

### Insignias de estado
- Forma de sello inclinado (-4°), borde doble, Rye.
- Colores: pendiente `--dorado`, en proceso `--azul-mar`, completado `--verde`,
  cancelado `--tinta-suave`.

### Login
- Pantalla más expresiva del sistema: viñeta-cartel grande con líneas de velocidad, olas de
  tinta al pie, el emblema-timón, "ドン!" y el título del reino en Pirata One con el "66" en
  Rye; formulario en una viñeta sobria al lado.

---

## 7. Movimiento (GSAP)

Cargar GSAP por CDN en las páginas que lo usen:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
```

- **Entrada de página:** las viñetas aparecen escalonadas (`stagger: 0.08`) con una
  ligera escala de 0.96 a 1 y `ease: "back.out(1.6)"`. Nada de fades lentos genéricos.
- **Impacto:** al guardar con éxito, el botón o la viñeta hace una sacudida corta
  (3–4 movimientos de ±4px en 0.25s).
- **Títulos:** se pueden animar letra por letra (SplitType) solo en el título principal
  de cada módulo.
- Duraciones cortas: 0.2–0.6s. El sistema debe sentirse rápido.
- **Siempre respetar** `prefers-reduced-motion`:
  ```js
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducir) { /* animaciones */ }
  ```

---

## 8. Iconografía e imágenes

- Íconos de trazo grueso (2–2.5px), estilo tinta. Se pueden usar Lucide o Tabler Icons
  ajustando `stroke-width`, o SVG propios.
- **Prohibido:** emojis como íconos, ilustraciones 3D genéricas, imágenes de stock.
- Ilustraciones solo originales (hechas por el equipo) o composiciones abstractas con
  tramas y líneas de velocidad.

---

## 9. Lista de "AI slop" prohibido

Si alguna pantalla tiene cualquiera de estos elementos, está mal:

- Degradados morado-azul o fondos de "aurora".
- Glassmorphism, blur, sombras difusas.
- Fuente Inter/Roboto/Poppins como principal.
- Hero centrado con tres tarjetas iguales debajo.
- Tarjetas con bordes muy redondeados y sombra suave.
- Emojis como íconos.
- Textos de relleno tipo "Potencia tu productividad", "Solución integral de próxima generación".
- Todos los elementos del mismo tamaño y alineados en cuadrícula perfecta sin jerarquía.

---

## 10. Checklist antes de dar por terminada una página

- [ ] Usa solo las variables de color, fuente y sombra de este documento.
- [ ] Hay una jerarquía clara: una viñeta principal, el resto secundarias.
- [ ] Un solo acento de color dominante.
- [ ] Tablas y formularios legibles, con contraste AA.
- [ ] Animaciones cortas y con soporte para `prefers-reduced-motion`.
- [ ] Ningún elemento de la lista de "AI slop" prohibido.
- [ ] Se ve bien en móvil (ancho 375px).
- [ ] Coincide visualmente con las demás páginas del sistema.
