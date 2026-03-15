'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { useStore } from '@/shared/store/useStore';
import { calculateBudget } from '@/shared/lib/budget';
import type {
  GeometryResult,
  Dimensions,
  FacadeConfig,
  FacadeSide,
  InteriorWall,
  Opening,
  Project,
} from '@/shared/types';

interface CanvasImages {
  snapshots: string[];
  floor: string | null;
}

interface ExportDataButtonProps {
  geo: GeometryResult;
  quantities: Record<string, number>;
  canvasImages: CanvasImages;
  project: Project;
  dimensions: Dimensions;
  facadeConfigs: Record<FacadeSide, FacadeConfig>;
  interiorWalls: InteriorWall[];
  openings: Opening[];
}

/**
 * Component that exports all project data as JSON
 * This includes geometry, calculations, images, budget and project details
 */
const ExportDataButton: React.FC<ExportDataButtonProps> = ({ geo, quantities, canvasImages, project, dimensions, facadeConfigs, interiorWalls, openings }) => {

  const handleExportJSON = async (): Promise<void> => {
    try {
      // Get data from store
      const storeState = useStore.getState();
      const { prices = [], selections, project: storeProject } = storeState;
      const adjustmentPercentage = storeProject.projectInfo?.adjustmentPercentage || 0;

      // Calculate budget using centralized logic
      const { items: budgetItems, total: finalTotal, subtotal } = calculateBudget(quantities, prices, storeProject);
      const adjustmentAmount = finalTotal - subtotal;

      // Prepare complete data package
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          projectName: project.clientName || 'Proyecto SIP',
          version: '1.0',
          description: 'Datos completos del proyecto para generacion de PDF con presupuesto',
        },
        project: {
          clientName: project.clientName || '',
          address: (project as unknown as Record<string, unknown>).address || '',
          recesses: project.recesses || [],
        },
        dimensions: {
          width: dimensions.width,
          length: dimensions.length,
          height: dimensions.height,
          ridgeHeight: dimensions.ridgeHeight,
        },
        facadeConfigs: facadeConfigs,
        interiorWalls: interiorWalls,
        openings: openings,
        geometry: {
          areaPiso: geo.areaPiso || 0,
          perimExt: geo.perimExt || 0,
          areaMuros: geo.areaMuros || 0,
          areaTecho: geo.areaTecho || 0,
          tabiques: geo.tabiques || 0,
          perimAberturas: geo.perimAberturas || 0,
          perimLinealPaneles: geo.perimLinealPaneles || 0,
          cantMurosExt: geo.cantMurosExt || 0,
          cantMurosInt: geo.cantMurosInt || 0,
          cantPiso: geo.cantPiso || 0,
          cantTecho: geo.cantTecho || 0,
          totalPaneles: geo.totalPaneles || 0,
          facadeDetails: (geo as unknown as Record<string, unknown>).facadeDetails || {},
        },
        quantities: quantities,
        budget: {
          items: budgetItems,
          prices: prices,
          selections: selections,
          subtotal: subtotal,
          adjustmentPercentage: adjustmentPercentage,
          adjustmentAmount: adjustmentAmount,
          finalTotal: finalTotal,
          currency: 'ARS',
        },
        images: {
          snapshots3D: canvasImages.snapshots || [],
          floorPlan: canvasImages.floor || null,
        },
      };

      // Convert to JSON string with formatting
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proyecto_${(project.clientName || 'SIP').replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Datos exportados correctamente. Usa este archivo JSON con otra IA para generar el PDF.');
    } catch (error: unknown) {
      console.error('Error exporting JSON:', error);
      const message = error instanceof Error ? error.message : String(error);
      alert('Error al exportar los datos: ' + message);
    }
  };

  return (
    <button
      onClick={handleExportJSON}
      className="flex-1 bg-purple-500 hover:bg-purple-400 transition-all text-white font-black py-4 rounded-3xl flex items-center justify-center gap-3 text-xs shadow-xl active:scale-95"
    >
      <Download size={18} />
      Exportar Datos JSON
    </button>
  );
};

export default ExportDataButton;
