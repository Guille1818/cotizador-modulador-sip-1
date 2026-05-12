# Lógica Constructiva SIP — La Fábrica del Panel

> Documento técnico de referencia para el cálculo de materiales de obra gris.
> Fuente: conocimiento del dominio + planilla Excel de cómputo + planos de obra Ale y Cande (Mayo 2026).
> Referencia de planos: Ale_y_Cande_Final — Despiece 3D, Planos de montaje M01-M06, Plano de vigas C01, Plano de fachadas P01, Plano de planta P02, Plano de uniones U01.

---

## Orden cronológico de construcción

1. Fundación (platea de HA o estructura elevada)
2. Soleras de base
3. Paneles de piso (solo si fundación elevada)
4. Paneles de muro — parte inferior (hasta 2.44m)
5. Solera doble de encadenado (si altura > 2.44m)
6. Paneles de muro — parte superior (si altura > 2.44m)
7. Solera superior de cierre de muro
8. Vigas de techo
9. Paneles de techo
10. Clavaderas y flejes (si techo es panel SIP estándar)

---

## 1. FUNDACIÓN

### Tipos
| Tipo | Descripción |
|------|-------------|
| Platea | Losa de hormigón armado a nivel de suelo |
| Estructura elevada sobre madera | Vigas de madera sobre pilotes |
| Estructura elevada sobre metal | Vigas metálicas sobre pilotes |

### Pilotes (default)
- Tipo por defecto: caño estructural 100x100x2mm
- Separación entre pilotes: 3.00m por defecto
- Alternativos: hormigón armado / madera quebracho

---

## 2. SOLERAS DE BASE

Las soleras de base reciben los paneles de muro y se anclan a la fundación.
Se calculan en metros lineales de muro, descontando únicamente los vanos de aberturas que apoyan sobre el piso (puertas que llegan al suelo).

### Tipos de solera

#### Solera metálica — Perfil PGU galvanizado
- Ancho = espesor del panel (ej: panel SIP 70 → PGU 70mm)

#### Solera de madera — Madera 1x4" + 2x3" (pino macizo)
- Las maderas se unen con pegamento poliuretánico (cola PUR)
- Tornillos fix de 2" cada 30cm
- Se impermeabilizan con membrana líquida poliuretánica
- Membrana autoadhesiva asfáltica en la parte inferior (barrera de humedad)
- Cola PUR también se aplica en la unión entre la solera y el piso (platea o piso SIP)

### Anclajes de solera según fundación

| Fundación | Tipo de solera | Anclaje |
|-----------|---------------|---------|
| Platea | PGU metálico | Varilla roscada zincada 1/2" c/80cm + anclaje químico Fischer VL 300 |
| Platea | PGU metálico | Broca de expansión c/80cm (alternativa) |
| Platea | Madera 1x4+2x3 | Varilla roscada zincada 1/2" c/80cm + anclaje químico Fischer VL 300 |
| Platea | Madera 1x4+2x3 | Broca de expansión c/80cm (alternativa) |
| Estructura elevada metálica | PGU metálico | Tornillo autoperforante TEL HEX 2" |
| Estructura elevada madera | Madera 1x4+2x3 | Tornillo para madera HBS 140mm |

### Cálculo de anclajes de solera sobre platea
- Cantidad de perforaciones = metros lineales de solera / 0.80m
- Cada perforación: 1 varilla roscada + 1 anclaje químico + 1 arandela 1/2" + 1 tuerca 1/2"
- Rendimiento Fischer VL 300: 15 huecos de 12cm de profundidad para varilla de 1/2"
- Cantidad de cartuchos = ceil(perforaciones / 15)

---

## 3. PANELES DE PISO (Solo fundación elevada)

No aplica cuando la fundación es platea.

### Orientación y distribución
- Los paneles se colocan horizontalmente
- Orientación óptima: lado largo del panel (2.44m) perpendicular a las vigas secundarias
- Las vigas secundarias van en dirección al lado más corto de la casa

### Estructura de piso

#### Vigas principales
- Dirección: paralelas al lado largo de la casa
- Apoyan sobre pilotes
- Separación entre vigas principales: 3.00m (default)
- Tipo para luz de 3m: viga 3x8" maciza o caño 100x100x2

#### Vigas secundarias
- Dirección: paralelas al lado corto de la casa
- Apoyan sobre vigas principales
- Separación: 0.65m
- Largo = lado largo de la casa

### Cálculo de paneles de piso

```
lado_corto = min(largo_casa, ancho_casa)
lado_largo = max(largo_casa, ancho_casa)

# Dirección del lado corto (largo del panel = 2.44m)
total_X = lado_corto / 2.44
paneles_enteros_X = floor(total_X)
factor_corte_X = total_X - paneles_enteros_X
corte_metros_X = factor_corte_X * 2.44
sobrante_X = 2.44 - corte_metros_X

# Dirección del lado largo (ancho del panel = 1.22m)
total_Y = lado_largo / 1.22
paneles_enteros_Y = floor(total_Y)
factor_corte_Y = total_Y - paneles_enteros_Y
corte_metros_Y = factor_corte_Y * 1.22
sobrante_Y = 1.22 - corte_metros_Y

# Reutilización: si sobrante >= 0.40m, el recorte puede reutilizarse

filas = paneles_enteros_X + (1 si factor_corte_X > 0)
columnas = paneles_enteros_Y + (1 si factor_corte_Y > 0)
total_paneles = filas * columnas
```

### Vigas secundarias
```
cantidad = ceil(lado_corto / 0.65) + 1
largo_cada_viga = lado_largo
```

### Tornillería de piso
| Elemento | Tornillo | Separación |
|----------|----------|-----------|
| Panel SIP piso a vigas | HBS 160mm | 0.40m por viga |
| Solera base muros sobre piso SIP | HBS 140mm | 0.40m |
| Vigas secundarias a vigas principales | HBS 200mm | 2 por viga |

---

## 4. PANELES DE MURO

### Orientación — siempre vertical
- Lado corto (1.22m) paralelo al piso
- Lado largo (2.44m) perpendicular al piso

### Datos necesarios por muro
| Dato | Descripción |
|------|-------------|
| Nombre | Mx1, My1, M1, etc. |
| Tipo de panel | OSB E, SMART, Cementicio, etc. |
| Anclaje sobre | Platea / Panel SIP piso / Otro |
| Largo (m) | Longitud del muro |
| Altura mínima (m) | Punto más bajo |
| Altura máxima (m) | Punto más alto |
| Tipo de perfil superior | Recto / Con pendiente / 2 aguas |
| Vanos | Lista de aberturas |
| Es exterior | Para barrera de vapor y cámara de aire |

### Parte inferior (hasta 2.44m)

```
metros_netos = largo_muro - sum(base_vanos_que_apoyan_en_piso)

cantidad_bruta = metros_netos / 1.22
paneles_enteros = floor(cantidad_bruta)
factor_corte = cantidad_bruta - paneles_enteros
corte_metros = factor_corte * 1.22
sobrante = 1.22 - corte_metros
# Si sobrante >= 0.40m → reutilizable

total_paneles_inferior = paneles_enteros + (1 si factor_corte > 0)
```

### Parte superior (cuando altura > 2.44m)

Cuando algún punto del muro supera 2.44m (pendiente de techo 1 o 2 aguas):
1. Se necesita solera doble a los 2.44m
2. Los paneles superiores se calculan por segmento de 1.22m
3. Para techo a 2 aguas: la altura varía en cada segmento

> ADVERTENCIA: La tabla ANEXO OPTIMIZACION MONT. MURO de la planilla Excel NO considera techo a 2 aguas. Para ese caso, calcular alturas de montantes manualmente segmento por segmento.

### Solera doble a los 2.44m
- Pino macizo 2x3 (doble)
- Metros = largo de muros con parte superior
- Tornillos tel fix 10x3¾": 1 cada 0.40m

### Solera superior de cierre de muro
- Pino macizo 2x3
- En la parte más alta, en contacto con las vigas de techo
- Metros = suma de metros lineales de TODOS los muros (SIN descontar vanos)
  - Ningún vano llega hasta el techo

### Montantes (vinculantes entre paneles)
Piezas de madera 2x3 (44mm x 70mm)

```
cantidad_montantes_por_muro = ceil(largo_muro / 1.22) + 1
altura_cada_montante = varía según posición (especialmente con pendiente o 2 aguas)
metros_lineales_montantes = suma de alturas individuales
```

### Tornillo panel a montante
- Tornillo: 6 x 1½"
- Separación: cada 0.20m
- Por montante: `ceil(altura / 0.20) × 2` (ambas caras)
- En zona de solera doble (parte superior): multiplicar x2

---

## 5. VANOS DE ABERTURAS

### Datos por vano
| Campo | Descripción |
|-------|-------------|
| Muro | A qué muro pertenece |
| Base (m) | Ancho |
| Altura (m) | Alto |
| ¿Apoya en piso? | SI = puerta, NO = ventana |

### Perímetro = 2 × base + 2 × altura

**Puerta (apoya en piso):**
- Descontar base de solera de base
- Descontar base de metros netos del muro para paneles

**Ventana (no apoya en piso):**
- NO descontar de solera ni de paneles

**Todos los vanos:**
- Montantes perimetrales: 2 verticales + dintel + (antepecho si ventana)
- Metros de montante = perímetro del vano

---

## 6. ENCUENTROS DE MUROS

### Altura del encuentro
- Ambos muros igual altura → altura del encuentro = esa altura
- Muros con alturas distintas → altura del encuentro = altura del muro MENOR
  - Caso típico: muro interior (2.44m) encontrando muro exterior más alto

### Tornillos
- SIP|SIP: HBS 120mm — 1 cada 0.30m → `ceil(altura_encuentro / 0.30)`
- SIP|Mampostería: tirafondo 1/4 x 3" + tarugo nylon N10 — 1 cada 0.30m

---

## 6.5. TORNILLERÍA DETALLADA POR SISTEMA

### MUROS

| Tornillo | Uso | Fórmula correcta |
|----------|-----|------------------|
| Fix 6x1½" | Panel a montante (vinculante) | ceil(altura / 0.20) × 2 por montante (ambas caras) |
| Fix 8x3" | Clavaderas a muro | 1 por cruce — cruces cada 0.60m (separación de flejes) |
| HBS 140mm | Encuentros SIP-SIP | ceil(altura_encuentro / 0.30) por encuentro |
| Tirafondo ¼x3" + taco nylon N10 | Encuentros SIP-mampostería | ceil(altura_encuentro / 0.30) por encuentro — 1 taco por tirafondo |
| Tel fix 10x3¾" | Solera doble a 2.44m | 1 cada 0.40m |

### PISO SIP — fundación elevada (madera o metal)

| Elemento | Uso | Fórmula correcta |
|----------|-----|------------------|
| HBS 160mm | Panel piso a vigas | 1 cada 0.40m por viga |
| HBS 140mm | Solera base muros sobre piso SIP | 1 cada 0.40m |
| Tel Hex 4" | Solera sobre estructura metálica | 1 cada 0.80m |
| HBS 140mm | Solera sobre estructura madera | 1 cada 0.80m |
| Herraje ángulo 90° | Unión viga principal × viga secundaria | 2 herrajes por intersección de vigas |
| Fix 1½" | Tornillos por herraje | 4 por herraje → 8 por intersección |

### ENTREPISO SIP

| Tornillo | Uso | Fórmula correcta |
|----------|-----|------------------|
| HBS 160mm | Panel entrepiso a vigas | 1 cada 0.40m por viga |
| HBS 200mm | Vigas entrepiso a muro (apoyo) | 1 por extremo → 2 por viga |

### TECHO

| Tornillo | Uso | Fórmula correcta |
|----------|-----|------------------|
| HEX 14x5" | Panel sandwich a vigas de techo | 1 cada 0.40m por viga |
| HBS 160mm | Panel techo SIP a vigas de techo | 1 cada 0.40m por viga |
| Fix 8x3" | Clavaderas a techo | 1 por cruce — cruces cada 0.60m (separación de flejes) |

### FUNDACIÓN — platea

| Elemento | Uso | Fórmula correcta |
|----------|-----|------------------|
| Varilla roscada ½" x 1m | Anclaje solera en platea | 1 varilla cada 4 perforaciones (se corta en 4 pedazos de 25cm) |
| Arandela ½" zincada | Por perforación | 1 por perforación |
| Tuerca ½" zincada | Por perforación | 1 por perforación |
| Anclaje químico Fischer VL300 | Por perforación | 1 cartucho cada 15 perforaciones |

---

## 7. VIGAS DE TECHO

### Tipos disponibles

#### Vigas macizas de pino (por unidad)
| Sección | Largos |
|---------|--------|
| 3"x6" | 3.05m / 3.66m / 4.88m / 5.50m |
| 3"x8" | 3.05m / 3.66m / 4.88m / 5.50m |

#### Vigas multilaminadas de eucalipto (por metro lineal)
| Sección | Presentación |
|---------|-------------|
| 3"x6" | Por metro lineal |
| 3"x8" | Por metro lineal |

### Predimensionado orientativo
| Luz libre | Sección recomendada |
|-----------|-------------------|
| hasta 3.0m | 3x6" maciza |
| 3.0m a 4.0m | 3x8" maciza |
| más de 4.0m | 3x8" multilaminada o cálculo profesional |

### Distribución
- Dirección: perpendicular a la caída del agua (hacia el lado más corto del techo)
- Separación: 1.22m (cada viga tapa la unión entre paneles)
- Cantidad = ceil(ancho_faldon / 1.22) + 1
- Largo de cada viga = largo del faldón

---

## 8. PANELES DE TECHO

### Sistema A — Paneles Sandwich La Fábrica del Panel (EPS)
- Núcleo EPS + OSB interior + Chapa galvanizada acanalada exterior
- Ancho útil: 1.00m (panel mide 1.10m, solapa 10cm)
- Largos: 4.00m y 5.00m
- Colocación: paralelos a las vigas de techo
- Tornillería: Hexagonal 14x5" — 1 cada 0.40m por viga

### Sistema B — Paneles LTN (Núcleo PIR)
Proveedor: Grupo LTN. Precios en USD al TC BNA. NO incluyen IVA.

| Producto | Ancho útil | Largo máx | Núcleo | Notas |
|----------|-----------|-----------|--------|-------|
| FOILROOF Sinusoidal | 0.99m | 14m | PIR | Chapa ext + Foil int |
| FOILROOF Trapezoidal | 1.00m | 14m | PIR | Chapa ext + Foil int |
| MAXIROOF Trapezoidal | 1.00m | 14m | PIR | Chapa ext + Tableteado int |
| TEJATECH | 0.95m | 10.20m | PIR | Teja Francesa ext + Foil int |
| CLASSWALL (muro) | 1.00m | 6m | PIR | Micronervado ext + Tableteado int |

Terminaciones disponibles: GALVA (galvanizada) / CINCA (cincalum) / PB (blanco) / PCOL (color)
Espesores disponibles: 10mm / 30mm / 50mm / 80mm (según producto)

### Cálculo de paneles de techo (por faldón)

```
largo_faldon = dimensión en dirección de la caída del agua
ancho_faldon = dimensión perpendicular (donde van las vigas)

# Paneles en dirección del largo
paneles_en_largo_4m = ceil(largo_faldon / 4.00)
paneles_en_largo_5m = ceil(largo_faldon / 5.00)
# Elegir el largo que minimice desperdicio

# Paneles en dirección del ancho (ancho útil 1.00m)
paneles_en_ancho = ceil(ancho_faldon / 1.00)

total_paneles = paneles_en_largo × paneles_en_ancho
```

---

## 9. CÁMARA DE AIRE — FLEJES Y CLAVADERAS

Aplica a muros exteriores con terminación que requiere cámara de aire y a techos con panel SIP estándar.

### Flejes (escurridores)
Función: escurrir agua de la cámara de aire. Separan las clavaderas del panel.
Elemento: listón 2 x ½"

```
# Muros exteriores:
lineas_flejes = ceil(alto_muro / 0.60)
metros_flejes = lineas_flejes × largo_muro

# Faldones de techo (panel SIP estándar):
lineas_flejes = ceil(ancho_faldon / 0.60)
metros_flejes = lineas_flejes × largo_faldon
```

### Clavaderas
Función: soporte para revestimiento exterior.
Elemento: pino macizo 2x2 sin cepillar

```
# Muros: separación ~1m, equidistantes
lineas_clavaderas = round(alto_muro / 1.00)
metros_clavaderas = lineas_clavaderas × largo_muro

# Techo:
lineas_clavaderas = round(largo_faldon / 1.00)
metros_clavaderas = lineas_clavaderas × ancho_faldon
```

Clavaderas adicionales obligatorias:
- Perímetro de todos los vanos exteriores (para zinguerías)
- Vértices de muros exteriores: horizontal y vertical en cada esquina

---

## 10. BARRERA DE AGUA Y VIENTO (Isolant)

- Aplica en muros exteriores
- Cálculo: vacio por lleno — NO se descuenta por vanos
- m² = largo_muro × alto_muro (sin descontar aberturas)
- Presentación: rollos de 30m²
- Cantidad de rollos = ceil(m2_total / 30)

---

## 11. AISLANTES Y SELLADORES

| Insumo | Uso | Rendimiento / Presentación |
|--------|-----|--------------------------|
| Espuma de poliuretano 750ml | TODAS las juntas panel-vinculante | 25ml/ml (piso), 15ml/ml (techo) |
| Cola PUR 500g | Unión maderas solera + solera a piso | Por junta |
| Membrana líquida 20kg | Impermeabilización solera madera | Según fabricante |
| Membrana asfáltica autoadhesiva | Barrera humedad bajo solera madera | 1ml por ml de solera |
| Anclaje químico Fischer VL 300 | Varilla 1/2" en platea | 15 huecos de 12cm por cartucho |
| Isolant | Barrera de agua y viento en muros ext. | Rollo 30m², vacio por lleno |

---

## 12. TERMINACIONES EXTERIORES DE MUROS

| Tipo | Material | Unidad |
|------|----------|--------|
| Chapa acanalada (varios colores) | Chapa C25 o similar | m² |
| Siding horizontal | Tabla fibrocemento 3.66m x 0.20m | unidad (0.64 m²) |
| Placa cementicia | 1.20m x 2.40m x 6mm | unidad (2.88 m²) |
| Panel cementicio SIP | M-CEM-CEM-70 | unidad |

---

## 13. ERRORES CONOCIDOS EN LA PLANILLA EXCEL

| Hoja | Elemento | Error |
|------|----------|-------|
| COMPUTO MUROS | Columna tornillería | Fórmula incorrecta |
| COMPUTO PISOS | Fila 1 (Platea) | No calcula paneles ni insumos |
| COMPUTO TECHOS | Total paneles estándar | Siempre 0 cuando es sandwich |
| ANEXO MONT. MURO | Alturas montantes | No considera techo a 2 aguas |
| General | Paneles superiores de muro | No descuenta vanos en parte superior |

---

## 14. RESUMEN DE PARÁMETROS CLAVE

| Parámetro | Valor | Notas |
|-----------|-------|-------|
| Ancho panel estándar | 1.22m | |
| Alto panel estándar | 2.44m | |
| Separación tornillos panel-vinculante (6x1½") | 0.20m | Ambas caras |
| Separación tornillos HBS 160mm (panel a vigas) | 0.40m | |
| Separación tornillos HBS 140mm (solera base sobre piso SIP) | 0.40m | |
| Separación anclajes solera en platea | 0.80m | |
| Separación tornillos encuentros HBS 120mm | 0.30m | |
| Separación vigas secundarias de piso | 0.65m | |
| Separación vigas de techo | 1.22m | |
| Separación tornillos techo sandwich a vigas | 0.40m | |
| Separación líneas de flejes | 0.60m | |
| Separación líneas de clavaderas | ~1.00m | Equidistantes |
| Ancho útil panel sandwich La Fábrica del Panel | 1.00m | Panel mide 1.10m |
| Ancho útil FOILROOF LTN sinusoidal | 0.99m | |
| Ancho útil FOILROOF/MAXIROOF LTN trapezoidal | 1.00m | |
| Ancho útil TEJATECH LTN | 0.95m | |
| Barrera agua y viento | Sin descuento vanos | Rollo 30m² |
| Espuma PU | TODAS las juntas | 25ml/ml piso, 15ml/ml techo |
| Fischer VL 300 | 15 huecos 12cm por cartucho | Varilla 1/2" |
| HBS 200mm | 2 por viga | Vigas secundarias a estructura |
| Separación pilotes default | 3.00m | Con viga 3x8" maciza |

---

## 15. REFERENCIA DE PLANOS — Ale y Cande

| Plano | Código | Descripción |
|-------|--------|-------------|
| Despiece 3D | 3D-01 | Vista explosionada completa |
| Modelo 3D | 3D-02, 3D-03 | Vistas exteriores |
| Vista interior 3D | 3D-04 | Distribución de muros interiores |
| Plano de Vigas C1 y C2 | C-01 | Paneles y vigas de techo, ángulo 36.59°, vigas cada 1.22m |
| Plano de Montaje Muros SIP70 | M-01 a M-06 | Detalle de cada muro |
| Plano de Uniones | U-01 | Conexiones entre muros |
| Plano de Fachadas | P-01 | 4 fachadas, altura muros 2.49m, cumbrera 5.00m |
| Plano de Planta | P-02 | Planta de muros, 11.70m x 6.83m |

Datos de la obra de referencia:
- Dimensiones: 11.70m x 6.83m
- Altura muro: 2.49m / Cumbrera: 5.00m
- Techo: 2 aguas, ángulo 36.59°
- Separación vigas de techo: 1.22m
- Panel de techo: sandwich

---

*Documento generado en Mayo 2026 — La Fábrica del Panel, Córdoba, Argentina.*
