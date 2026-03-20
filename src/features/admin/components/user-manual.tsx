"use client";

import React, { useState } from 'react';
import {
    ChevronDown, ChevronUp, Lightbulb, Keyboard,
    PenTool, MousePointer2, Hand, Ruler, Box,
    Camera, FileText, Copy, Download, Save, FolderOpen,
    DollarSign, Users, Settings, Trash2, Plus,
    Square, RotateCcw, Layout, Eye, EyeOff, ArrowLeft
} from 'lucide-react';

interface AccordionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const Accordion = ({ title, icon, children, defaultOpen = false }: AccordionProps) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-900/10 rounded-xl flex items-center justify-center text-emerald-800">
                        {icon}
                    </div>
                    <span className="text-sm font-black text-slate-800 uppercase tracking-wider">{title}</span>
                </div>
                {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>
            {open && <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">{children}</div>}
        </div>
    );
};

const Tip = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <Lightbulb size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-emerald-800 leading-relaxed">{children}</p>
    </div>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">{title}</h4>
        <div className="text-xs text-slate-600 leading-relaxed space-y-2">{children}</div>
    </div>
);

interface UserManualProps {
    onBack: () => void;
}

const UserManual = ({ onBack }: UserManualProps) => {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Manual de Uso</h2>
                    <p className="text-slate-400 font-medium text-sm">Guia completa del Modulador SIP</p>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                {/* Section 1: Engineering */}
                <Accordion title="Diseno de Planta" icon={<PenTool size={20} />} defaultOpen>
                    <SubSection title="Dimensiones basicas">
                        <p>Ajusta <strong>Largo</strong> y <strong>Ancho</strong> con los botones +/- en la barra superior. Aceptan valores decimales con punto o coma (ej: 7.5 o 7,5).</p>
                        <p><strong>Alt. Muros</strong> = altura de las paredes exteriores. <strong>Cumbrera</strong> = punto mas alto del techo (aplica para techos a 2 aguas o inclinados).</p>
                        <Tip>Mantene presionado +/- para cambio rapido con aceleracion progresiva. Cuanto mas tiempo mantenes, mas rapido cambia.</Tip>
                    </SubSection>

                    <SubSection title="Forma de planta">
                        <div className="flex items-center gap-4 py-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 border-2 border-slate-300 rounded-lg flex items-center justify-center"><Square size={14} /></div>
                                <span className="font-bold">Rectangular</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 border-2 border-slate-300 rounded-lg flex items-center justify-center">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 4v16h16" /></svg>
                                </div>
                                <span className="font-bold">Forma L</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 border-2 border-slate-300 rounded-lg flex items-center justify-center">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 4H4v16h16" /></svg>
                                </div>
                                <span className="font-bold">Forma C</span>
                            </div>
                        </div>
                        <p>Al elegir <strong>L</strong> o <strong>C</strong> aparece un panel flotante arrastrable donde ajustas <strong>Posicion</strong>, <strong>Ancho</strong> y <strong>Fondo</strong> del recorte. Ambas formas se ubican en el lado Este de la planta.</p>
                    </SubSection>

                    <SubSection title="Tabiques interiores">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                                <PenTool size={14} className="text-slate-600" />
                                <span><strong>Modo Lapiz:</strong> click + arrastrar para dibujar</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                                <MousePointer2 size={14} className="text-orange-600" />
                                <span><strong>Modo Seleccionar:</strong> click en tabique para editar</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                                <Hand size={14} className="text-slate-600" />
                                <span><strong>Modo Paneo:</strong> mover el lienzo</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                                <Ruler size={14} className="text-indigo-600" />
                                <span><strong>Modo Medir:</strong> distancias personalizadas</span>
                            </div>
                        </div>
                        <p>Al seleccionar un tabique aparece un panel flotante para editar <strong>largo</strong>, <strong>posicion X/Y</strong>, <strong>rotar</strong> y <strong>duplicar</strong>. Todos los paneles flotantes se pueden arrastrar.</p>
                        <Tip>Usa Delete o Backspace para borrar el elemento seleccionado. Ctrl+Z para deshacer, Ctrl+Y para rehacer.</Tip>
                    </SubSection>

                    <SubSection title="Aberturas (puertas y ventanas)">
                        <p>Usa los botones <strong>+ Puerta</strong> y <strong>+ Ventana</strong> en la barra de herramientas. Las aberturas se agregan en la fachada Norte por defecto.</p>
                        <p>Click en una abertura para editarla: <strong>ancho</strong>, <strong>alto</strong> y <strong>posicion</strong>. Arrastra las aberturas sobre la pared para moverlas.</p>
                        <p>Tambien podes agregar aberturas desde la vista maximizada de cada fachada.</p>
                    </SubSection>

                    <SubSection title="Fachadas">
                        <p>Los botones <strong>N / S / E / O</strong> activan o desactivan cada fachada del calculo y la visualizacion.</p>
                        <p>Click en la miniatura de una fachada (abajo del plano) para <strong>maximizarla</strong> y configurar:</p>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            <li>Tipo de techo: <strong>Recto</strong> (plano), <strong>Inclinado</strong> (una pendiente), <strong>2 Aguas</strong> (doble pendiente)</li>
                            <li>Alturas de aleros y cumbrera por fachada</li>
                            <li>Agregar puertas y ventanas directamente en cada fachada</li>
                        </ul>
                    </SubSection>
                </Accordion>

                {/* Section 2: 3D */}
                <Accordion title="Vista 3D" icon={<Box size={20} />}>
                    <SubSection title="Navegacion">
                        <p><strong>Click + arrastrar</strong> para rotar la vista. <strong>Scroll</strong> para hacer zoom. La camara orbita alrededor de la casa.</p>
                    </SubSection>
                    <SubSection title="Controles">
                        <p>Toggles de <strong>Vigas</strong> y <strong>Cubierta</strong> para mostrar/ocultar elementos estructurales y la cubierta del techo.</p>
                        <p>Selector de <strong>Material</strong> en la esquina inferior: OSB, Chapa Negra, Galvanizada, Cementicia. Cambia la apariencia de las paredes exteriores.</p>
                    </SubSection>
                    <SubSection title="Capturas">
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3">
                            <Camera size={16} className="text-slate-600" />
                            <span>El boton <strong>Captura 3D</strong> guarda una imagen de la vista actual. Estas capturas aparecen en la galeria del PDF exportado.</span>
                        </div>
                        <Tip>Rota la casa a diferentes angulos y captura varias vistas para tener un PDF mas completo.</Tip>
                    </SubSection>
                </Accordion>

                {/* Section 3: Report */}
                <Accordion title="Reporte Tecnico" icon={<FileText size={20} />}>
                    <p className="text-xs text-slate-600 leading-relaxed">Expandi el panel oscuro <strong>&quot;Reporte Tecnico&quot;</strong> en el sidebar derecho de la pantalla de ingenieria. Muestra un resumen detallado de muros, tabiques, techo, piso y totales.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                            <Copy size={16} className="text-cyan-600" />
                            <span className="text-xs font-bold text-cyan-800">Copiar: copia el reporte completo al portapapeles</span>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                            <Download size={16} className="text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-800">Descargar: genera un archivo .txt descargable</span>
                        </div>
                    </div>
                    <Tip>El reporte se actualiza en tiempo real al modificar cualquier dimension, abertura o configuracion del diseno.</Tip>
                </Accordion>

                {/* Section 4: Save/Load */}
                <Accordion title="Guardar / Cargar Disenos" icon={<Save size={20} />}>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                            <Save size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-emerald-800">
                                <strong>Guardar:</strong> guarda el diseno actual con un nombre opcional. Incluye todas las dimensiones, tabiques, aberturas, fachadas y configuraciones.
                            </div>
                        </div>
                        <div className="flex items-start gap-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <FolderOpen size={16} className="text-slate-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-slate-700">
                                <strong>Mis Disenos:</strong> lista de disenos guardados. Podes cargar cualquiera para continuar editandolo o borrarlo.
                            </div>
                        </div>
                    </div>
                    <Tip>Los disenos se guardan en el localStorage del navegador. Si limpias los datos del navegador se pierden. Usa &quot;Exportar&quot; para generar un PDF permanente.</Tip>
                </Accordion>

                {/* Section 5: Budget */}
                <Accordion title="Presupuesto" icon={<DollarSign size={20} />}>
                    <p className="text-xs text-slate-600 leading-relaxed">El presupuesto se <strong>calcula automaticamente</strong> desde la geometria del diseno: cantidad de paneles, metros lineales, tornilleria, maderas, etc.</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
                        <li>Cada item muestra cantidad calculada, precio unitario y total</li>
                        <li>Podes hacer <strong>overrides manuales</strong> de cantidad o precio en cualquier item</li>
                        <li>Ajuste porcentual global: aplica un % de ajuste sobre el total</li>
                        <li>Los precios base se configuran en la pestana Admin</li>
                    </ul>
                </Accordion>

                {/* Section 6: Export */}
                <Accordion title="Exportar PDF" icon={<Layout size={20} />}>
                    <p className="text-xs text-slate-600 leading-relaxed">La pestana <strong>Export</strong> genera un documento profesional listo para entregar al cliente.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-orange-800 flex items-center gap-2"><FileText size={14} /> Generar PDF</p>
                            <p className="text-[10px] text-orange-700 mt-1">Abre la ventana de impresion del navegador. Elegir &quot;Guardar como PDF&quot;.</p>
                        </div>
                        <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-slate-800 flex items-center gap-2"><Download size={14} /> Exportar Imagen</p>
                            <p className="text-[10px] text-slate-600 mt-1">Descarga un archivo JPG con todas las paginas combinadas.</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600">El PDF incluye: portada con datos del cliente, descripcion del sistema SIP, plano de planta, 4 fachadas, memoria de materiales, presupuesto detallado, resumen de inversion con descuentos, y galeria de capturas 3D.</p>
                    <Tip>Antes de exportar, completa los datos del cliente en la pestana de presupuesto y captura varias vistas 3D para un documento mas profesional.</Tip>
                </Accordion>

                {/* Section 7: CRM */}
                <Accordion title="CRM - Gestion de Clientes" icon={<Users size={20} />}>
                    <p className="text-xs text-slate-600 leading-relaxed">La pestana <strong>CRM</strong> permite llevar un registro de leads y clientes con sus datos de contacto y estado del proceso comercial.</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
                        <li>Nombre, email, telefono, ubicacion, CUIT</li>
                        <li>Superficie cotizada y monto del presupuesto</li>
                        <li>Estado: Contacto, Presupuesto, En Seguimiento, Cerrado, Perdido</li>
                    </ul>
                </Accordion>

                {/* Section 8: Admin */}
                <Accordion title="Administracion" icon={<Settings size={20} />}>
                    <p className="text-xs text-slate-600 leading-relaxed">La pestana <strong>Admin</strong> gestiona los precios base de todos los productos y materiales.</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
                        <li>Editar nombre, categoria, unidad y precio de cada producto</li>
                        <li>Agregar nuevos productos al catalogo</li>
                        <li>Eliminar productos que ya no se usan</li>
                        <li>Los cambios se reflejan automaticamente en futuros presupuestos</li>
                    </ul>
                    <p className="text-xs text-slate-600">Tambien muestra la referencia del <strong>Motor de Calculo SIP</strong> con todas las formulas y logicas de cada material.</p>
                </Accordion>
            </div>

            {/* Keyboard Shortcuts Table */}
            <div className="bg-slate-900 rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                        <Keyboard size={20} />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Atajos de Teclado</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { keys: 'Delete / Backspace', desc: 'Borrar elemento seleccionado' },
                        { keys: 'Ctrl + Z', desc: 'Deshacer ultima accion' },
                        { keys: 'Ctrl + Y', desc: 'Rehacer accion deshecha' },
                        { keys: 'Ctrl + C', desc: 'Copiar tabique seleccionado' },
                        { keys: 'Ctrl + X', desc: 'Cortar tabique seleccionado' },
                        { keys: 'Ctrl + V', desc: 'Pegar tabique copiado' },
                        { keys: 'Espacio (mantener)', desc: 'Modo paneo temporal' },
                        { keys: 'Doble click', desc: 'Alternar modo Seleccionar / Dibujar' },
                        { keys: 'Scroll (rueda)', desc: 'Zoom en plano 2D y vista 3D' },
                        { keys: '+/- (mantener)', desc: 'Cambio rapido con aceleracion' },
                    ].map((shortcut, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                            <kbd className="bg-white/10 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-lg border border-white/10">{shortcut.keys}</kbd>
                            <span className="text-xs text-slate-400 font-bold">{shortcut.desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserManual;
