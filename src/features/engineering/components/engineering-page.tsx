"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '@/shared/store/useStore';
import { calculateGeometry } from '@/shared/lib/calculations';
import { HousePreset, HOUSE_PRESETS } from '@/shared/lib/presets';
import type { Project, FacadeSide } from '@/shared/types';
import FloorPlan from './floor-plan';
import FacadeView from './facade-view';
import Viewer3D from './viewer-3d';
import Link from 'next/link';
import {
    FileText, Copy, ChevronLeft, ChevronRight, Maximize2, X, Download,
    Loader2, Square, Plus, Minus, Home, ChevronDown, ChevronUp
} from 'lucide-react';
import html2canvas from 'html2canvas';

/* ──────────────────────────────────────────────
   Collapsible Section wrapper
   ────────────────────────────────────────────── */
interface CollapsibleSectionProps {
    title: string;
    dotColor: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

const CollapsibleSection = ({ title, dotColor, defaultOpen = true, children }: CollapsibleSectionProps) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">{title}</h3>
                </div>
                {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
        </div>
    );
};

/* ──────────────────────────────────────────────
   Number Stepper Input (+/- buttons)
   ────────────────────────────────────────────── */
interface NumberStepperProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step: number;
    unit: string;
}

const NumberStepper = ({ label, value, onChange, min, max, step, unit }: NumberStepperProps) => {
    const [localValue, setLocalValue] = useState<string>(String(value));

    useEffect(() => {
        setLocalValue(String(step < 1 ? value.toFixed(2) : value));
    }, [value, step]);

    const clamp = (v: number) => Math.max(min, Math.min(max, v));

    const commitValue = (raw: string) => {
        let v = parseFloat(raw);
        if (isNaN(v)) v = min;
        v = clamp(v);
        setLocalValue(String(step < 1 ? v.toFixed(2) : v));
        onChange(v);
    };

    const increment = () => {
        const next = clamp(parseFloat(String(value)) + step);
        onChange(parseFloat(next.toFixed(4)));
    };
    const decrement = () => {
        const next = clamp(parseFloat(String(value)) - step);
        onChange(parseFloat(next.toFixed(4)));
    };

    return (
        <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0">{label}</label>
            <div className="flex items-center gap-0 border-2 border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                    onClick={decrement}
                    className="h-10 w-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors border-r border-slate-200"
                >
                    <Minus size={14} className="text-slate-500" />
                </button>
                <div className="flex items-center gap-1 px-2">
                    <input
                        type="number"
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        onBlur={() => commitValue(localValue)}
                        onKeyDown={(e) => e.key === 'Enter' && commitValue(localValue)}
                        className="h-10 w-14 text-center text-base font-bold text-slate-800 outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs font-bold text-slate-400">{unit}</span>
                </div>
                <button
                    onClick={increment}
                    className="h-10 w-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors border-l border-slate-200"
                >
                    <Plus size={14} className="text-slate-500" />
                </button>
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────
   DataRow for the technical report
   ────────────────────────────────────────────── */
interface DataRowProps {
    label: string;
    value: string | number;
    sub?: string;
    inverted?: boolean;
}

const DataRow = ({ label, value, sub, inverted }: DataRowProps) => (
    <div className={`flex justify-between items-baseline border-b py-1.5 font-mono text-[11px] leading-none ${inverted ? 'border-slate-800' : 'border-slate-100'}`}>
        <span className={inverted ? 'text-slate-500' : 'text-slate-400'}>{label}</span>
        <div className="text-right">
            <span className={`font-bold ${inverted ? 'text-slate-200' : 'text-slate-800'}`}>{value}</span>
            {sub && <span className={`ml-1 text-[9px] ${inverted ? 'text-slate-600' : 'text-slate-400'}`}>{sub}</span>}
        </div>
    </div>
);

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
const Engineering = () => {
    const {
        dimensions, setDimensions,
        interiorWalls, updateInteriorWall,
        openings,
        facadeConfigs, updateFacadeConfig,
        showBeams, setShowBeams,
        showRoofPlates, setShowRoofPlates,
        beamOffset, setBeamOffset,
        activeInteriorWallId, setActiveInteriorWallId,
        project, foundationType, setFoundationType, structureType, setStructureType,
        selections, toggleSelectionCategory, setSelectionId, setSelections, setRoofSystem,
        prices, perimeterWalls,
        updateRecess, removeRecess, clearRecesses, addLShape, addCShape,
        togglePerimeterVisibility,
        addWall, removeWall,
    } = useStore();

    /* ── default selections bootstrap ── */
    useEffect(() => {
        const { history, saveHistory } = useStore.getState();
        if (history.length === 0) {
            saveHistory();
        }

        const defaultValues: Record<string, unknown> = {
            exteriorWallId: "OSB-70-E",
            interiorWallId: "OSB-70-DECO",
            roofId: "TECHO-OSB-70",
            floorId: "PISO-OSB-70",
            includeExterior: true,
            includeInterior: true,
            includeRoof: true,
            includeFloor: true,
        };

        const missing: Record<string, unknown> = {};
        let needsSync = false;

        Object.keys(defaultValues).forEach(key => {
            if ((selections as any)[key] === undefined) {
                missing[key] = defaultValues[key];
                needsSync = true;
            }
        });

        if (needsSync) {
            setSelections(missing as any);
        }
    }, [selections, setSelections]);

    /* ── local UI state ── */
    const [maximizedFacade, setMaximizedFacade] = useState<FacadeSide | null>(null);
    const [isFloorPlanExpanded, setIsFloorPlanExpanded] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const [ambientes, setAmbientes] = useState<number>(interiorWalls.length + 1);

    // Keep ambientes in sync when interior walls change externally
    useEffect(() => {
        setAmbientes(interiorWalls.length + 1);
    }, [interiorWalls.length]);

    /* ── geometry calculation ── */
    const geo = useMemo(() => {
        return calculateGeometry(dimensions, interiorWalls, facadeConfigs, openings, { ...project, perimeterWalls, interiorWalls } as Partial<Project> & { foundationType?: string }, selections);
    }, [dimensions, interiorWalls, facadeConfigs, openings, project, selections, perimeterWalls]);

    const area = dimensions.width * dimensions.length;

    /* ── apply a preset ── */
    const applyPreset = useCallback((preset: HousePreset) => {
        setActivePresetId(preset.id);
        setDimensions(preset.dimensions);
        setFoundationType(preset.foundationType);
        setStructureType(preset.structureType);
        setRoofSystem(preset.roofSystem);
        setSelectionId('exteriorWallId', preset.exteriorWallId);
        setSelectionId('interiorWallId', preset.interiorWallId);
        setSelectionId('roofId', preset.roofId);
        setSelectionId('floorId', preset.floorId);
    }, [setDimensions, setFoundationType, setStructureType, setRoofSystem, setSelectionId]);

    /* ── ambientes handler ── */
    const handleAmbientesChange = useCallback((newCount: number) => {
        if (newCount < 1) return;
        const wallsNeeded = newCount - 1;
        const currentWalls = interiorWalls.length;
        setAmbientes(newCount);

        if (wallsNeeded > currentWalls) {
            // add walls
            for (let i = 0; i < wallsNeeded - currentWalls; i++) {
                const xPos = ((currentWalls + i + 1) / (wallsNeeded + 1)) * dimensions.length;
                addWall('interior', {
                    x: xPos,
                    y: 0,
                    x1: xPos,
                    y1: 0,
                    x2: xPos,
                    y2: dimensions.width,
                    length: dimensions.width,
                });
            }
        } else if (wallsNeeded < currentWalls) {
            // remove walls from the end
            const toRemove = interiorWalls.slice(wallsNeeded);
            toRemove.forEach(w => removeWall(w.id));
        }
    }, [interiorWalls, dimensions, addWall, removeWall]);

    /* ── copy to clipboard ── */
    const copyToClipboard = () => {
        let text = `======================================\n`;
        text += `   REPORTE TECNICO - SIP MODULADOR\n`;
        text += `======================================\n\n`;

        text += `1. MUROS EXTERIORES (FACHADAS)\n`;
        text += `   Dimensiones Base: ${dimensions.width}m x ${dimensions.length}m x ${dimensions.height}m (H)\n`;
        Object.entries(geo.sides || {}).filter(([_, stats]: [string, any]) => stats.isVisible).forEach(([side, stats]: [string, any]) => {
            text += `    Fachada ${side}:\n`;
            text += `    - Area: ${stats.area.toFixed(2)} m2\n`;
            text += `    - Paneles: ${stats.panels} unid.\n`;
            text += `    - Perimetro Paneles: ${stats.perimPanels?.toFixed(2)} ml\n`;
            text += `    - Aberturas (ML): ${stats.openingML.toFixed(2)} ml\n`;
        });
        text += `   --------------------------------------\n`;
        text += `   Total Area Muros Ext: ${geo.areaMurosBruta.toFixed(2)} m2\n`;
        text += `   Total Perim. Paneles Muro: ${geo.perimMurosExt?.toFixed(2)} ml\n`;
        text += `   Total Paneles Muro Ext: ${geo.cantMurosExt} unid.\n\n`;

        text += `2. TABIQUES INTERIORES\n`;
        text += `   - Metros Lineales: ${geo.tabiques.toFixed(2)} ml\n`;
        text += `   - Paneles Tabique: ${geo.cantMurosInt} unid.\n`;
        text += `   - Perimetro Paneles Tabique: ${geo.perimMurosInt?.toFixed(2)} ml\n\n`;

        text += `3. PISO Y TECHO\n`;
        text += `   - PISO: ${geo.areaPiso.toFixed(2)} m2 (${geo.cantPiso} paneles | Perim: ${geo.perimPiso?.toFixed(2)} ml)\n`;
        text += `   - TECHO: ${geo.areaTecho.toFixed(2)} m2 (${geo.cantTecho} paneles | Perim: ${geo.perimTecho?.toFixed(2)} ml)\n\n`;

        text += `4. RESUMEN DE GEOMETRIA Y ABERTURAS\n`;
        text += `   - Dimensiones: ${dimensions.width}m x ${dimensions.length}m\n`;
        text += `   - Altura de Muros: ${dimensions.height}m\n`;
        text += `   - Altura de Cumbrera: ${dimensions.ridgeHeight}m\n`;
        text += `   - Area de Planta (Neto): ${geo.areaPiso.toFixed(2)} m2\n`;
        text += `   - Perimetro Exterior Casa: ${geo.perimExt.toFixed(2)} ml\n`;
        text += `   - Cantidad de Aberturas: ${geo.totalAberturasCount} unid.\n`;
        text += `   - Metros Lineales de Aberturas: ${geo.perimAberturas.toFixed(2)} ml\n\n`;

        text += `5. RESUMEN DE PANELES\n`;
        text += `   - Perimetro Lineal Total Paneles: ${geo.perimLinealPaneles.toFixed(2)} ml\n`;
        text += `   - Cantidad Total Paneles: ${geo.totalPaneles} unid.\n\n`;

        text += `======================================`;

        navigator.clipboard.writeText(text);
        alert("Reporte completo copiado al portapapeles!");
    };

    const activePreset = HOUSE_PRESETS.find(p => p.id === activePresetId);

    /* ══════════════════════════════════════════════
       RENDER
       ══════════════════════════════════════════════ */
    return (
        <div className="flex flex-col min-h-screen lg:h-screen bg-slate-50 p-2 md:p-4 gap-3 overflow-x-hidden">

            {/* ── TOP BAR ── */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-2.5 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
                            <Home size={16} className="text-white" />
                        </div>
                        <div>
                            <span className="text-lg font-black text-slate-800">{area} m<sup className="text-xs">2</sup></span>
                            <span className="text-xs text-slate-400 ml-2 font-medium">{geo.totalPaneles} paneles</span>
                        </div>
                    </div>
                    {activePreset && (
                        <div className="hidden sm:flex items-center gap-2 bg-orange-50 text-orange-700 rounded-xl px-3 py-1.5 border border-orange-200">
                            <span className="text-sm">{activePreset.icon}</span>
                            <span className="text-xs font-bold">{activePreset.name}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium hidden md:inline">
                        {dimensions.width}m x {dimensions.length}m x {dimensions.height}m
                    </span>
                </div>
            </div>

            {/* ── FACADE MODAL ── */}
            {maximizedFacade && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-8">
                    <div className="bg-white w-full max-w-6xl h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                    Configuracion de Fachada {maximizedFacade}
                                    <span className="bg-cyan-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">Avanzado</span>
                                </h2>
                                <p className="text-slate-400 text-sm font-medium">Define el tipo de techo y alturas especificas para este lado.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => togglePerimeterVisibility(maximizedFacade!)}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg border-2 ${(project as any).perimeterVisibility?.[maximizedFacade] !== false
                                        ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {(project as any).perimeterVisibility?.[maximizedFacade] !== false ? 'Fachada Activa' : 'Fachada Excluida'}
                                    <div className={`w-2.5 h-2.5 rounded-full ${(project as any).perimeterVisibility?.[maximizedFacade] !== false ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
                                </button>
                                <div className="w-px h-10 bg-slate-200"></div>
                                <button onClick={() => setMaximizedFacade(null)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-slate-400 hover:text-rose-500 group">
                                    <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex min-h-0 bg-white">
                            <div className="flex-1 p-8 bg-slate-50/30">
                                <FacadeView
                                    type={maximizedFacade}
                                    data={{ ...dimensions, openings, facadeConfigs }}
                                    scale={45}
                                    isMaximized={true}
                                />
                            </div>

                            <div className="w-96 border-l border-slate-100 p-8 space-y-8 bg-white overflow-y-auto">
                                {(() => {
                                    const config = (facadeConfigs as any)[maximizedFacade] || { type: 'recto', hBase: 2.44, hMax: 2.44 };
                                    return (
                                        <>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">TIPO DE TECHO</label>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {(['recto', 'inclinado', '2-aguas'] as const).map(type => (
                                                        <button
                                                            key={type}
                                                            onClick={() => updateFacadeConfig(maximizedFacade!, { type })}
                                                            className={`px-4 py-4 rounded-2xl text-sm font-bold border-2 transition-all flex flex-col gap-1 ${config.type === type
                                                                ? 'bg-cyan-50 border-cyan-500 text-cyan-700 shadow-sm'
                                                                : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <span className="capitalize">{type.replace('-', ' ')}</span>
                                                            <span className="text-[10px] font-normal opacity-60">
                                                                {type === 'recto' && "Techo plano o altura constante."}
                                                                {type === 'inclinado' && "Pendiente hacia un lado lateral."}
                                                                {type === '2-aguas' && "Doble pendiente simetrica desde el centro."}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-6 pt-6 border-t border-slate-50">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">COTAS DE ELEVACION</label>

                                                {config.type === 'recto' && (
                                                    <NumberStepper
                                                        label="Altura Muro"
                                                        value={config.hBase}
                                                        onChange={(v) => updateFacadeConfig(maximizedFacade!, { hBase: v, hMax: v })}
                                                        min={2.44} max={5.0} step={0.1} unit="m"
                                                    />
                                                )}

                                                {config.type === 'inclinado' && (
                                                    <>
                                                        <NumberStepper
                                                            label="Altura Izquierda"
                                                            value={config.hBase}
                                                            onChange={(v) => updateFacadeConfig(maximizedFacade!, { hBase: v })}
                                                            min={2.44} max={6.0} step={0.1} unit="m"
                                                        />
                                                        <NumberStepper
                                                            label="Altura Derecha"
                                                            value={config.hMax}
                                                            onChange={(v) => updateFacadeConfig(maximizedFacade!, { hMax: v })}
                                                            min={2.44} max={6.0} step={0.1} unit="m"
                                                        />
                                                    </>
                                                )}

                                                {config.type === '2-aguas' && (
                                                    <>
                                                        <NumberStepper
                                                            label="Altura Aleros"
                                                            value={config.hBase}
                                                            onChange={(v) => updateFacadeConfig(maximizedFacade!, { hBase: v })}
                                                            min={2.44} max={6.0} step={0.1} unit="m"
                                                        />
                                                        <NumberStepper
                                                            label="Altura Cumbrera"
                                                            value={config.hMax}
                                                            onChange={(v) => updateFacadeConfig(maximizedFacade!, { hMax: v })}
                                                            min={2.44} max={7.0} step={0.1} unit="m"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MAIN CONTENT GRID ── */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-3 pb-2">

                {/* ════════════════════════════════════
                   LEFT COLUMN: VISUALS (3/4)
                   ════════════════════════════════════ */}
                <div className={`lg:col-span-3 flex flex-col gap-3 min-h-0 ${isFloorPlanExpanded ? 'fixed inset-0 z-[100] bg-white' : ''}`}>
                    {/* Floor Plan */}
                    <div className={`flex-1 min-h-[400px] lg:min-h-0 bg-white overflow-hidden relative ${isFloorPlanExpanded ? '' : 'rounded-[40px] border border-slate-200 shadow-sm'}`}>
                        <FloorPlan hideUI={!!maximizedFacade} isExpanded={isFloorPlanExpanded} />
                        <button
                            onClick={() => setIsFloorPlanExpanded(!isFloorPlanExpanded)}
                            className={`absolute z-50 p-3 transition-all ${isFloorPlanExpanded ? 'top-10 right-10 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800' : 'top-6 right-6 bg-white/90 backdrop-blur border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-500 hover:border-indigo-500 shadow-xl'}`}
                            title={isFloorPlanExpanded ? "Contraer Plano" : "Expandir Plano"}
                        >
                            <X size={20} className={isFloorPlanExpanded ? "" : "hidden"} />
                            <Maximize2 size={20} className={isFloorPlanExpanded ? "hidden" : ""} />
                        </button>
                    </div>

                    {/* Facade strip */}
                    {!isFloorPlanExpanded && (
                        <div className="lg:h-[260px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 p-1">
                            {(['Norte', 'Sur', 'Este', 'Oeste'] as const).map(side => (
                                <div key={side} className="h-48 lg:h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                    <FacadeView
                                        type={side}
                                        data={{ ...dimensions, openings, facadeConfigs }}
                                        onMaximize={() => setMaximizedFacade(side)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ════════════════════════════════════
                   RIGHT COLUMN: CONTROLS (1/4)
                   ════════════════════════════════════ */}
                <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar lg:max-h-[calc(100vh-120px)] pb-20 lg:pb-0">

                    {/* ── Section A: Modelo Prediseado ── */}
                    <CollapsibleSection title="Modelo Prediseado" dotColor="bg-orange-500" defaultOpen={!!activePresetId}>
                        <div className="grid grid-cols-2 gap-2">
                            {HOUSE_PRESETS.map(preset => {
                                const isActive = activePresetId === preset.id;
                                const presetArea = preset.dimensions.width * preset.dimensions.length;
                                return (
                                    <button
                                        key={preset.id}
                                        onClick={() => applyPreset(preset)}
                                        className={`flex flex-col items-start gap-1 p-3 rounded-2xl border-2 transition-all text-left ${isActive
                                            ? 'bg-orange-50 border-orange-500 shadow-sm'
                                            : 'border-slate-100 hover:border-orange-300 hover:bg-orange-50/30'
                                            }`}
                                    >
                                        <span className="text-lg leading-none">{preset.icon}</span>
                                        <span className={`text-xs font-bold leading-tight ${isActive ? 'text-orange-700' : 'text-slate-700'}`}>
                                            {preset.name}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                            <span>{preset.rooms} amb</span>
                                            <span>-</span>
                                            <span>{preset.dimensions.width}x{preset.dimensions.length}m</span>
                                        </div>
                                        <span className={`text-xs font-black ${isActive ? 'text-orange-600' : 'text-slate-500'}`}>
                                            {presetArea} m2
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </CollapsibleSection>

                    {/* ── Section B: Dimensiones ── */}
                    <CollapsibleSection title="Dimensiones" dotColor="bg-indigo-500" defaultOpen={true}>
                        <div className="space-y-3">
                            <NumberStepper
                                label="Largo"
                                value={dimensions.length}
                                onChange={(v) => setDimensions({ length: v })}
                                min={3} max={20} step={1} unit="m"
                            />
                            <NumberStepper
                                label="Ancho"
                                value={dimensions.width}
                                onChange={(v) => setDimensions({ width: v })}
                                min={3} max={15} step={1} unit="m"
                            />
                            <NumberStepper
                                label="Alt. Muros"
                                value={dimensions.height}
                                onChange={(v) => setDimensions({ height: v })}
                                min={2.44} max={5.0} step={0.10} unit="m"
                            />
                            <NumberStepper
                                label="Alt. Cumbrera"
                                value={dimensions.ridgeHeight}
                                onChange={(v) => setDimensions({ ridgeHeight: v })}
                                min={2.44} max={7.0} step={0.10} unit="m"
                            />

                            {/* Ambientes counter */}
                            <div className="pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ambientes</label>
                                    <div className="flex items-center gap-0 border-2 border-slate-200 rounded-xl overflow-hidden bg-white">
                                        <button
                                            onClick={() => handleAmbientesChange(ambientes - 1)}
                                            className="h-10 w-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors border-r border-slate-200"
                                        >
                                            <Minus size={14} className="text-slate-500" />
                                        </button>
                                        <div className="h-10 w-14 flex items-center justify-center">
                                            <span className="text-base font-black text-slate-800">{ambientes}</span>
                                        </div>
                                        <button
                                            onClick={() => handleAmbientesChange(ambientes + 1)}
                                            className="h-10 w-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors border-l border-slate-200"
                                        >
                                            <Plus size={14} className="text-slate-500" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">Agrega o remueve tabiques interiores automaticamente.</p>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* ── Section C: Forma de Planta ── */}
                    <CollapsibleSection title="Forma de Planta" dotColor="bg-indigo-500" defaultOpen={false}>
                        <div className="space-y-2">
                            <button
                                onClick={() => clearRecesses()}
                                className={`w-full flex items-center gap-4 py-2.5 px-4 rounded-xl border-2 transition-all ${(project as any).recesses?.length === 0
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-slate-100 text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/30'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${(project as any).recesses?.length === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <Square size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="text-sm font-bold block">Rectangulo</span>
                                    <span className="text-[10px] font-medium opacity-60">Planta rectangular simple.</span>
                                </div>
                            </button>
                            <button
                                onClick={() => addLShape()}
                                className={`w-full flex items-center gap-4 py-2.5 px-4 rounded-xl border-2 transition-all ${(project as any).recesses?.length === 1 && (project as any).recesses[0].side === 'Sur'
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-slate-100 text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/30'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${(project as any).recesses?.length === 1 && (project as any).recesses[0].side === 'Sur' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v16h16" /></svg>
                                </div>
                                <div className="text-left">
                                    <span className="text-sm font-bold block">Forma L</span>
                                    <span className="text-[10px] font-medium opacity-60">Planta en L con recorte en esquina.</span>
                                </div>
                            </button>
                            <button
                                onClick={() => addCShape()}
                                className={`w-full flex items-center gap-4 py-2.5 px-4 rounded-xl border-2 transition-all ${(project as any).recesses?.length === 1 && (project as any).recesses[0].side === 'Norte'
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-slate-100 text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/30'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${(project as any).recesses?.length === 1 && (project as any).recesses[0].side === 'Norte' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 4H4v16h16" /></svg>
                                </div>
                                <div className="text-left">
                                    <span className="text-sm font-bold block">Forma C</span>
                                    <span className="text-[10px] font-medium opacity-60">Planta en C con recorte central.</span>
                                </div>
                            </button>
                        </div>
                    </CollapsibleSection>

                    {/* ── Section D: Estructura ── */}
                    <CollapsibleSection title="Estructura" dotColor="bg-emerald-500" defaultOpen={true}>
                        <div className="space-y-4">
                            {/* Foundation */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Cimentacion</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setFoundationType('platea')}
                                        className={`py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-all ${foundationType === 'platea'
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                            : 'border-slate-100 text-slate-400 hover:border-emerald-300'
                                            }`}
                                    >
                                        PLATEA
                                    </button>
                                    <button
                                        onClick={() => setFoundationType('estructura')}
                                        className={`py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-all ${foundationType === 'estructura'
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                            : 'border-slate-100 text-slate-400 hover:border-emerald-300'
                                            }`}
                                    >
                                        ESTRUCTURA
                                    </button>
                                </div>
                            </div>

                            {/* Floor structure (conditional) */}
                            <div className={`space-y-2 transition-all duration-300 ${foundationType === 'platea' ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Estructura de Piso</label>
                                    {foundationType === 'platea' && (
                                        <span className="text-[10px] font-bold text-rose-500 uppercase bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">No aplica</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setStructureType('madera')}
                                        className={`py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-all ${structureType === 'madera'
                                            ? 'bg-cyan-50 border-cyan-500 text-cyan-700'
                                            : 'border-slate-100 text-slate-400 hover:border-cyan-300'
                                            }`}
                                    >
                                        MADERA
                                    </button>
                                    <button
                                        onClick={() => setStructureType('metal')}
                                        className={`py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-all ${structureType === 'metal'
                                            ? 'bg-cyan-50 border-cyan-500 text-cyan-700'
                                            : 'border-slate-100 text-slate-400 hover:border-cyan-300'
                                            }`}
                                    >
                                        METAL
                                    </button>
                                </div>
                            </div>

                            {/* Roof system */}
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Sistema de Techo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setRoofSystem('sip')}
                                        className={`py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-all ${(selections as any).roofSystem === 'sip'
                                            ? 'bg-orange-50 border-orange-500 text-orange-700'
                                            : 'border-slate-100 text-slate-400 hover:border-orange-300'
                                            }`}
                                    >
                                        TECHO SIP
                                    </button>
                                    <button
                                        onClick={() => setRoofSystem('sandwich')}
                                        className={`py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-all ${(selections as any).roofSystem === 'sandwich'
                                            ? 'bg-orange-50 border-orange-500 text-orange-700'
                                            : 'border-slate-100 text-slate-400 hover:border-orange-300'
                                            }`}
                                    >
                                        SANDWICH
                                    </button>
                                </div>

                                {/* Roof material dropdown */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Material Techo</label>
                                    <select
                                        value={(selections as any).roofId}
                                        onChange={(e) => setSelectionId('roofId', e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 h-10 text-sm font-bold text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                                    >
                                        {prices
                                            .filter((p: any) => p.category === "1. SISTEMA DE PANELES" &&
                                                ((selections as any).roofSystem === 'sandwich' ? p.id.includes('SAND-') : (p.id.includes('TECHO-') || p.id === 'COL-70' || p.id === 'CE-70' || p.id === 'SID-70')))
                                            .map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* ── Section E: Fachadas ── */}
                    <CollapsibleSection title="Fachadas" dotColor="bg-emerald-500" defaultOpen={false}>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Marca las fachadas que deseas contabilizar en el presupuesto.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {(['Norte', 'Sur', 'Este', 'Oeste'] as const).map(side => {
                                const isVisible = (project as any).perimeterVisibility?.[side] !== false;
                                return (
                                    <button
                                        key={side}
                                        onClick={() => togglePerimeterVisibility(side)}
                                        className={`flex items-center justify-between py-2.5 px-4 rounded-xl border-2 transition-all ${isVisible
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                            : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        <span className="text-sm font-bold uppercase tracking-tight">{side}</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${isVisible ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isVisible ? 'left-4.5' : 'left-0.5'}`} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </CollapsibleSection>

                    {/* ── Section F: Visor 3D ── */}
                    <CollapsibleSection title="Visor 3D" dotColor="bg-cyan-500" defaultOpen={true}>
                        <div className="h-80 -mx-5 -mb-5 border-t border-slate-100 overflow-hidden rounded-b-3xl">
                            <Viewer3D />
                        </div>
                        <div className="space-y-3 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mostrar Vigas</span>
                                <button onClick={() => setShowBeams(!showBeams)} className={`w-10 h-5 rounded-full relative transition-colors ${showBeams ? 'bg-cyan-500' : 'bg-slate-200'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showBeams ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cubierta</span>
                                <button onClick={() => setShowRoofPlates(!showRoofPlates)} className={`w-10 h-5 rounded-full relative transition-colors ${showRoofPlates ? 'bg-cyan-500' : 'bg-slate-200'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showRoofPlates ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="pt-2 border-t border-slate-100">
                                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-tight mb-1">
                                    <span>Ajuste Altura Cubierta</span>
                                    <span className="text-cyan-600">{(beamOffset * 100).toFixed(0)}cm</span>
                                </div>
                                <input
                                    type="range" min="-0.2" max="0.5" step="0.01" value={beamOffset}
                                    onChange={(e) => setBeamOffset(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* ── Section G: Reporte Tecnico ── */}
                    <CollapsibleSection title="Reporte Tecnico" dotColor="bg-cyan-500" defaultOpen={false}>
                        <div className="bg-slate-900 rounded-2xl p-5 text-slate-300 font-mono text-[11px] -mx-1">
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                <span className="text-cyan-400 font-black text-xs">REPORTE TECNICO</span>
                                <span className="text-white/20 text-xs">SIP 2026</span>
                            </div>
                            <div className="space-y-5">
                                {/* MUROS Y FACHADAS */}
                                <div>
                                    <h4 className="text-cyan-400 text-[10px] uppercase font-black mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]" /> MUROS EXTERIORES
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {Object.entries(geo.sides || {}).filter(([_, stats]: [string, any]) => stats.isVisible).map(([side, stats]: [string, any]) => (
                                            <div key={side} className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[11px] font-black text-white uppercase tracking-tight">Fachada {side}</span>
                                                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">{stats.panels} Panels</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <DataRow label="Superficie" value={stats.area.toFixed(2)} sub="m2" inverted />
                                                    <DataRow label="Perim. Paneles" value={stats.perimPanels?.toFixed(2)} sub="ml" inverted />
                                                    <DataRow label="Aberturas ML" value={stats.openingML.toFixed(2)} sub="ml" inverted />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-white/10 space-y-1">
                                        <DataRow label="Total Area Muros" value={geo.areaMurosBruta.toFixed(2)} sub="m2" inverted />
                                        <DataRow label="Total Perim. Paneles" value={geo.perimMurosExt?.toFixed(2)} sub="ml" inverted />
                                    </div>
                                </div>

                                {/* TABIQUES (INTERIOR) */}
                                <div>
                                    <h4 className="text-amber-400 text-[10px] uppercase font-black mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> TABIQUES INTERIORES
                                    </h4>
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1">
                                        <DataRow label="Metros Lineales" value={geo.tabiques.toFixed(2)} sub="ml" inverted />
                                        <DataRow label="Paneles" value={geo.cantMurosInt} sub="unid" inverted />
                                        <DataRow label="Perim. Paneles" value={geo.perimMurosInt?.toFixed(2)} sub="ml" inverted />
                                    </div>
                                </div>

                                {/* PISO Y TECHO */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <h4 className="text-emerald-400 text-[10px] uppercase font-black mb-3">PISO</h4>
                                        <div className="bg-emerald-400/5 p-4 rounded-2xl border border-emerald-400/10 space-y-1">
                                            <DataRow label="Area" value={geo.areaPiso.toFixed(2)} sub="m2" inverted />
                                            <DataRow label="Perim. Paneles" value={geo.perimPiso?.toFixed(2)} sub="ml" inverted />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-indigo-400 text-[10px] uppercase font-black mb-3">TECHO</h4>
                                        <div className="bg-indigo-400/5 p-4 rounded-2xl border border-indigo-400/10 space-y-1">
                                            <DataRow label="Area" value={geo.areaTecho.toFixed(2)} sub="m2" inverted />
                                            <DataRow label="Perim. Paneles" value={geo.perimTecho?.toFixed(2)} sub="ml" inverted />
                                        </div>
                                    </div>
                                </div>

                                {/* RESUMEN DE GEOMETRIA */}
                                <div className="pt-5 border-t-2 border-white/10 space-y-2">
                                    <h4 className="text-white/40 text-[10px] uppercase font-black mb-3 tracking-widest">GEOMETRIA Y ABERTURAS</h4>
                                    <DataRow label="Dimensiones" value={`${dimensions.width}m x ${dimensions.length}m`} inverted />
                                    <DataRow label="Altura Muros" value={dimensions.height.toFixed(2)} sub="m" inverted />
                                    <DataRow label="Altura Cumbrera" value={dimensions.ridgeHeight.toFixed(2)} sub="m" inverted />
                                    <DataRow label="Area Planta" value={geo.areaPiso.toFixed(2)} sub="m2" inverted />
                                    <DataRow label="Perimetro Exterior" value={geo.perimExt.toFixed(2)} sub="ml" inverted />
                                    <DataRow label="Cantidad Aberturas" value={geo.totalAberturasCount} inverted />
                                    <DataRow label="Perimetro Aberturas" value={geo.perimAberturas.toFixed(2)} sub="ml" inverted />

                                    <div className="mt-5 pt-5 border-t border-white/10 space-y-3">
                                        <DataRow label="Perimetro Lineal Total" value={geo.perimLinealPaneles.toFixed(2)} sub="ml" inverted />
                                        <div className="flex justify-between items-center pt-3 text-cyan-400 font-black text-xs border-t border-white/5">
                                            <span className="tracking-tighter uppercase">TOTAL PANELES</span>
                                            <span className="text-xl">{geo.totalPaneles} UNID.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Copy button */}
                            <button
                                onClick={copyToClipboard}
                                className="w-full mt-5 bg-white/5 hover:bg-white/10 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-white/5 transition-all active:scale-95 text-sm font-bold"
                            >
                                <Copy size={14} /> COPIAR REPORTE
                            </button>
                        </div>
                    </CollapsibleSection>

                </div>
            </div>
        </div>
    );
};

export default Engineering;
