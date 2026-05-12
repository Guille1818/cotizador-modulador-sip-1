# Factory OS — La Fábrica del Panel

> Sistema integral para La Fábrica del Panel (Córdoba, Argentina).
> Dos productos integrados: Cotizador de materiales SIP + Software de gestión interno.
> El humano dice QUÉ quiere. Tú decides CÓMO construirlo.

---

## Visión del Producto

### Producto 1 — Cotizador SIP (orientado al cliente)
Herramienta para calcular materiales de obra gris (piso, paredes y techo)
para construcción desde cero, ampliación y/o refacción con sistema SIP.
Debe funcionar tanto ingresando datos manualmente como interpretando planos
via agente IA. UX simple, pantallas paso a paso, sin información abrumadora.

### Producto 2 — Software de Gestión Interno (orientado a la operación)
ERP desde cero para controlar: stock, CRM de clientes, sucursales y depósitos,
presupuestos, campañas de marketing y administración general del negocio.
**Debe estar integrado directamente con el Cotizador.**

### Estado actual
- Producto 1 (Cotizador): existe, tiene bugs en cálculos y UX a mejorar
- Producto 2 (Gestión): no existe, arranca desde cero
- Backend: no existe aún — todo client-side con localStorage
- Sucursales: ninguna por ahora — solo casa central en Córdoba

---

## Roadmap por Fases (atacar en orden)

### FASE 1 — Corregir bugs del Cotizador (PRIORIDAD INMEDIATA)
- [ ] Corregir cálculo de cantidad de paneles (muros, techo, piso)
- [ ] Corregir cálculo de vigas (cantidad y tipo)
- [ ] Corregir cálculo de tornillos y fijaciones
- [ ] Corregir otros insumos mal calculados

### FASE 2 — Mejorar UX del Cotizador
- [ ] Rediseñar flujo en pantallas paso a paso (wizard)
- [ ] No mostrar toda la información junta en una sola pantalla
- [ ] Pantallas simples y guiadas para el cliente/vendedor

### FASE 3 — Agente IA para interpretación de planos
- [ ] Subir plano (imagen/PDF) y que IA compute materiales automáticamente

### FASE 4 — Software de Gestión (desde cero)
- [ ] Stock de paneles e insumos
- [ ] CRM de clientes integrado con el cotizador
- [ ] Gestión de presupuestos
- [ ] Campañas de marketing
- [ ] Control administrativo
- [ ] Preparado para múltiples sucursales/depósitos a futuro

---

## Dominio del Negocio

- **Empresa**: La Fábrica del Panel — fabricante de paneles SIP, Córdoba, Argentina
- **Contacto**: +54 9 351 809-3394 | info@lafabricadelpanel.com.ar
- **Moneda**: ARS (Pesos Argentinos) — precios sin IVA
- **Alcance obra gris**: piso + paredes + techo (NO terminaciones)
- **Tipos de obra**: construcción nueva | ampliación | refacción
- **Precio mayorista**: 100 paneles OSB-70-E/mes o equivalente

### Catálogo de Paneles (Lista N°25 — Mayo 2026)

#### MUROS
| Código | Descripción | Medidas | Mayorista | Minorista |
|--------|-------------|---------|-----------|-----------|
| M-OSB-OSB-70 | Muro SIP 70 OSB "E" | 1.22x2.44x0.09 | $104,560 | $113,652 |
| M-OSB-FEN-70 | Muro SIP 70 OSB Fenólico "E" | 1.22x2.44x0.09 | $99,194 | $107,819 |
| M-FEN-FEN-70 | Muro SIP 70 Fenólico "E" | 1.22x2.44x0.09 | $106,903 | $116,199 |
| M-SMART-OSB-70 | Muro SIP 70 Siding "E" "TL" "RA" | 1.22x2.44x0.09 | $133,338 | $144,933 |
| M-MULT-MULT-70 | Muro SIP 70 OSB Decorativo | 1.22x2.44x0.09 | $86,547 | $94,073 |
| M-CEM-CEM-70 | Muro SIP 70 Cementicio "E" "TL" "RA" | 1.20x2.40x0.08 | $128,405 | $139,571 |
| M-OSB-OSB-100 | Muro SIP 100 OSB "E" | 1.22x2.44x0.12 | $108,612 | $118,057 |
| M-CEM-CEM-100 | Muro SIP 100 Cementicio "E" "TL" "RA" | 1.22x2.44x0.12 | $128,405 | $139,571 |

#### TECHOS
| Código | Descripción | Medidas | Mayorista | Minorista |
|--------|-------------|---------|-----------|-----------|
| T-OSB-OSB-70 | Techo SIP 70 OSB | 1.22x2.44x0.09 | $102,848 | $111,792 |
| T-OSB-FEN-70 | Techo SIP 70 OSB Fenólico | 1.22x2.44x0.09 | $99,194 | $107,819 |
| T-SMART-OSB-70 | Techo SIP 70 Siding | 1.22x2.44x0.09 | $131,626 | $143,072 |
| T-DECO-OSB-70 | Techo SIP 70 OSB Decorativo | 1.22x2.44x0.09 | $84,770 | $92,141 |
| T-COL-OSB-70 | Techo SIP 70 Colonial | 1.22x2.44x0.09 | $108,388 | $117,813 |
| T-CEM-CEM-70 | Techo SIP 70 Cementicio | 1.20x2.40x0.08 | $128,405 | $139,571 |
| SAND-OSB-80-4 | Techo Sandwich Chapa Acanalada 4m | 1.10x4.00x0.08 | $182,665 | $198,549 |
| SAND-OSB-80-5 | Techo Sandwich Chapa Acanalada 5m | 1.10x5.00x0.08 | $216,673 | $235,514 |
| SAND-SID-80-4 | Techo Sandwich Siding 4m | 1.10x4.00x0.08 | $260,598 | $283,259 |
| SAND-SID-80-5 | Techo Sandwich Siding 5m | 1.10x5.00x0.08 | $289,281 | $314,436 |

#### PISOS Y ENTREPISOS
| Código | Descripción | Medidas | Mayorista | Minorista |
|--------|-------------|---------|-----------|-----------|
| P-OSB-OSB-70 | Piso SIP 70 OSB | 1.22x2.44x0.07 | $102,848 | $111,792 |
| P-OSB-OSB-70-R | Piso SIP 70 OSB "R" (reforzado) | 1.22x2.44x0.07 | $113,818 | $123,715 |
| P-CEM-CEM-70-R | Piso SIP 70 Cementicio "E" "TL" "RA" | 1.22x2.44x0.07 | $206,985 | $224,984 |

### Glosario de Atributos
- **E**: Estructural (soporta cargas)
- **TL**: Terminación lista (no necesita revestimiento)
- **RA**: Resistente al agua (puede quedar expuesto)
- **R**: Reforzado (mayor espesor de placa)

### Conceptos Constructivos
| Concepto | Significado |
|----------|-------------|
| Obra gris | Piso + paredes + techo sin terminaciones |
| Panel SIP | 1.22m x 2.44m estándar (salvo excepciones) |
| Viga de encadenado | Viga perimetral superior e inferior |
| Spline | Conector de madera entre paneles |
| Tornillo autorroscante | Fijación panel-panel y panel-estructura |
| Platea | Tipo de fundación (losa de hormigón) |
| Muro perimetral | Pared exterior |
| Tabique | División interna no portante |
| Abertura | Puerta o ventana |

---

## Stack Técnico (Golden Path)

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js + App Router | 15.x |
| UI | React | 19.x |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 3.4 |
| Estado | Zustand (con persist) | 5.x |
| 3D | Three.js (@react-three/fiber + drei) | r182 |
| PDF | jsPDF + html2canvas | - |
| Iconos | lucide-react | - |
| CSS Utils | clsx, tailwind-merge | - |

**NO hay backend todavía** — todo client-side con localStorage.
**Items futuros**: Supabase, auth, Zod, API routes.

---

## Arquitectura Feature-First