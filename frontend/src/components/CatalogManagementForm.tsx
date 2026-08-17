/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CatalogManagementForm.tsx
 *
 * Antes de esto, la única forma de crear una organización, un centro de
 * salud o una unidad era corriendo el seeder del backend por consola. Este
 * componente conecta los tres formularios reales (POST /organizations,
 * POST /health-centers, POST /units) para poder crearlos desde la
 * interfaz, sin tocar código cada vez que se necesite uno nuevo.
 *
 * El backend ya valida los permisos por su cuenta (solo super_admin puede
 * crear organizaciones y centros; super_admin o admin_institucional pueden
 * crear unidades). Si alguien sin el rol correcto intenta usar este
 * formulario, el servidor lo va a rechazar con 403 igual, así que no
 * duplicamos esa lógica acá — solo mostramos el mensaje de error que
 * llegue.
 */

import React, { useState, useEffect } from 'react';
import { Building2, Hospital, LayoutGrid, CheckCircle2 } from 'lucide-react';
import {
  createOrganization,
  createHealthCenter,
  createUnit,
  listOrganizations,
  listHealthCenters,
  ApiError,
  Organization,
  HealthCenter,
} from '../lib/apiClient';

interface CatalogManagementFormProps {
  highContrast?: boolean;
}

export const CatalogManagementForm: React.FC<CatalogManagementFormProps> = ({
  highContrast = false,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);

  // Campos de cada uno de los 3 mini-formularios
  const [newOrgName, setNewOrgName] = useState('');
  const [newCenterName, setNewCenterName] = useState('');
  const [newCenterOrgId, setNewCenterOrgId] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitCenterId, setNewUnitCenterId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState<'org' | 'center' | 'unit' | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Recargamos los catálogos completos después de cada creación, para que
  // los selectores del resto del formulario (y de otras pantallas, como el
  // registro de funcionarios) reflejen el dato nuevo sin tener que
  // recargar la página.
  const reloadCatalogs = async () => {
    try {
      const [orgs, centers] = await Promise.all([listOrganizations(), listHealthCenters()]);
      setOrganizations(orgs);
      setHealthCenters(centers);
    } catch (err) {
      setError('No pudimos cargar los catálogos existentes.');
    }
  };

  useEffect(() => {
    reloadCatalogs();
  }, []);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting('org');
    try {
      const org = await createOrganization(newOrgName);
      setSuccessMessage(`Organización "${org.name}" creada con éxito.`);
      setNewOrgName('');
      await reloadCatalogs();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos crear la organización.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleCreateHealthCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!newCenterOrgId) {
      setError('Selecciona a qué organización pertenece el centro.');
      return;
    }
    setIsSubmitting('center');
    try {
      const center = await createHealthCenter(newCenterName, newCenterOrgId);
      setSuccessMessage(`Centro de salud "${center.name}" creado con éxito.`);
      setNewCenterName('');
      setNewCenterOrgId('');
      await reloadCatalogs();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos crear el centro de salud.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!newUnitCenterId) {
      setError('Selecciona a qué centro de salud pertenece la unidad.');
      return;
    }
    setIsSubmitting('unit');
    try {
      const unit = await createUnit(newUnitName, newUnitCenterId);
      setSuccessMessage(`Unidad "${unit.name}" creada con éxito.`);
      setNewUnitName('');
      setNewUnitCenterId('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos crear la unidad.');
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <div
      className={`bg-white p-5 rounded-xl border space-y-5 ${
        highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'border-brand-border'
      }`}
    >
      <div className="border-b pb-3">
        <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-brand-primary" /> Gestión de Catálogos Institucionales
        </h3>
        <p className="text-[11px] text-brand-text-secondary mt-0.5">
          Crea organizaciones, centros de salud y unidades reales. Estos datos alimentan los selectores del registro de funcionarios.
        </p>
      </div>

      {successMessage && (
        <div className="p-3 rounded-lg border border-brand-success/30 bg-brand-success-light/30 text-brand-turquoise-dark flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg border border-brand-coral/20 bg-brand-coral-light/25 text-brand-coral-dark text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Formulario 1: Organización */}
        <form onSubmit={handleCreateOrganization} className="p-3 bg-brand-bg rounded-lg border space-y-2.5 text-xs font-semibold">
          <label className="flex items-center gap-1.5 text-brand-dark">
            <Building2 className="w-3.5 h-3.5" /> Nueva Organización
          </label>
          <input
            type="text"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            required
            disabled={isSubmitting === 'org'}
            placeholder="Ej. Servicio de Salud Araucanía Sur"
            className="w-full h-9 px-2.5 bg-white rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSubmitting === 'org'}
            className="w-full h-9 bg-brand-primary hover:bg-brand-intermediate text-white font-bold rounded-lg text-[11px] disabled:opacity-60"
          >
            {isSubmitting === 'org' ? 'Creando…' : 'Crear Organización'}
          </button>
        </form>

        {/* Formulario 2: Centro de Salud */}
        <form onSubmit={handleCreateHealthCenter} className="p-3 bg-brand-bg rounded-lg border space-y-2.5 text-xs font-semibold">
          <label className="flex items-center gap-1.5 text-brand-dark">
            <Hospital className="w-3.5 h-3.5" /> Nuevo Centro de Salud
          </label>
          <select
            value={newCenterOrgId}
            onChange={(e) => setNewCenterOrgId(e.target.value)}
            required
            disabled={isSubmitting === 'center'}
            className="w-full h-9 px-2.5 bg-white rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
          >
            <option value="">Organización a la que pertenece…</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newCenterName}
            onChange={(e) => setNewCenterName(e.target.value)}
            required
            disabled={isSubmitting === 'center'}
            placeholder="Ej. Hospital Regional de Villarrica"
            className="w-full h-9 px-2.5 bg-white rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSubmitting === 'center'}
            className="w-full h-9 bg-brand-primary hover:bg-brand-intermediate text-white font-bold rounded-lg text-[11px] disabled:opacity-60"
          >
            {isSubmitting === 'center' ? 'Creando…' : 'Crear Centro'}
          </button>
        </form>

        {/* Formulario 3: Unidad */}
        <form onSubmit={handleCreateUnit} className="p-3 bg-brand-bg rounded-lg border space-y-2.5 text-xs font-semibold">
          <label className="flex items-center gap-1.5 text-brand-dark">
            <LayoutGrid className="w-3.5 h-3.5" /> Nueva Unidad
          </label>
          <select
            value={newUnitCenterId}
            onChange={(e) => setNewUnitCenterId(e.target.value)}
            required
            disabled={isSubmitting === 'unit'}
            className="w-full h-9 px-2.5 bg-white rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
          >
            <option value="">Centro al que pertenece…</option>
            {healthCenters.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            required
            disabled={isSubmitting === 'unit'}
            placeholder="Ej. Servicio de Urgencia Adulto"
            className="w-full h-9 px-2.5 bg-white rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSubmitting === 'unit'}
            className="w-full h-9 bg-brand-primary hover:bg-brand-intermediate text-white font-bold rounded-lg text-[11px] disabled:opacity-60"
          >
            {isSubmitting === 'unit' ? 'Creando…' : 'Crear Unidad'}
          </button>
        </form>
      </div>
    </div>
  );
};
