/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * UserRegistrationForm.tsx
 *
 *
 * Solo lo puede usar un usuario con rol admin_institucional o super_admin
 * (el propio backend lo valida igual, así que aunque alguien intente
 * saltarse esta pantalla, el servidor lo rechaza de todas formas).
 *
 * Los selectores de Organización → Centro de Salud → Unidad son en
 * cascada: al elegir una organización, recién ahí se cargan sus centros;
 * al elegir un centro, recién ahí se cargan sus unidades. Así evitamos
 * mostrar combinaciones que no tienen sentido (una unidad de un centro
 * que no es el elegido).
 */

import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import {
  registerUser,
  listOrganizations,
  listHealthCenters,
  listUnits,
  ApiError,
  UserRole,
  Organization,
  HealthCenter,
  Unit,
} from '../lib/apiClient';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admision', label: 'Admisión / Ventanilla' },
  { value: 'categorizacion', label: 'Categorización (TENS)' },
  { value: 'medico', label: 'Médico' },
  { value: 'admin_institucional', label: 'Administrador Institucional' },
  { value: 'super_admin', label: 'Super Administrador' },
];

interface UserRegistrationFormProps {
  highContrast?: boolean;
}

export const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({
  highContrast = false,
}) => {
  // Datos del formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole] = useState<UserRole>('admision');
  const [organizationId, setOrganizationId] = useState('');
  const [healthCenterId, setHealthCenterId] = useState('');
  const [unitId, setUnitId] = useState('');

  // Catálogos cargados desde la API
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Estados de carga y de resultado
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Al montar el componente, cargamos la lista de organizaciones. Los
  // centros y unidades se cargan después, en cascada, cuando la persona
  // vaya eligiendo.
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const orgs = await listOrganizations();
        setOrganizations(orgs);
      } catch (err) {
        setError('No pudimos cargar las organizaciones. Intenta recargar la página.');
      } finally {
        setIsLoadingCatalogs(false);
      }
    };
    loadOrganizations();
  }, []);

  // Cuando cambia la organización elegida, recargamos los centros de
  // salud y limpiamos lo que estuviera elegido más abajo en la cascada
  // (centro y unidad), porque ya no aplican a la organización nueva.
  useEffect(() => {
    setHealthCenterId('');
    setUnitId('');
    setUnits([]);

    if (!organizationId) {
      setHealthCenters([]);
      return;
    }

    const loadHealthCenters = async () => {
      try {
        const allCenters = await listHealthCenters();
        // El backend no filtra por organización en el propio endpoint,
        // así que filtramos acá, del lado del frontend.
        setHealthCenters(allCenters.filter((c) => c.organizationId === organizationId));
      } catch (err) {
        setError('No pudimos cargar los centros de salud.');
      }
    };
    loadHealthCenters();
  }, [organizationId]);

  // Cuando cambia el centro de salud elegido, recargamos sus unidades.
  useEffect(() => {
    setUnitId('');

    if (!healthCenterId) {
      setUnits([]);
      return;
    }

    const loadUnits = async () => {
      try {
        const centerUnits = await listUnits(healthCenterId);
        setUnits(centerUnits);
      } catch (err) {
        setError('No pudimos cargar las unidades.');
      }
    };
    loadUnits();
  }, [healthCenterId]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPasswordConfirmation('');
    setRole('admision');
    setOrganizationId('');
    setHealthCenterId('');
    setUnitId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSuccessMessage('');

    if (!organizationId || !healthCenterId || !unitId) {
      setError('Selecciona organización, centro de salud y unidad.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await registerUser({
        name,
        email,
        password,
        passwordConfirmation,
        role,
        organizationId,
        healthCenterId,
        unitId,
      });

      setSuccessMessage(`Cuenta creada con éxito para ${newUser.name} (${newUser.email}).`);
      resetForm();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        }
      } else {
        setError('No pudimos conectar con el servidor. Intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pequeño helper para mostrar el error específico de un campo, si el
  // backend lo devolvió en su respuesta de validación (422).
  const fieldError = (field: string) => fieldErrors[field]?.[0];

  return (
    <div
      className={`bg-white p-5 rounded-xl border space-y-4 ${highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'border-brand-border'
        }`}
    >
      <div className="border-b pb-3">
        <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-brand-primary" /> Registrar Nuevo Funcionario
        </h3>
        <p className="text-[11px] text-brand-text-secondary mt-0.5">
          Crea una cuenta institucional real. La contraseña queda cifrada en el servidor antes de guardarse.
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

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
        <div>
          <label className="block mb-1 text-brand-dark">Nombre completo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
            placeholder="Ej. Rodrigo Muñoz"
          />
          {fieldError('name') && (
            <span className="text-[10px] text-brand-coral-dark mt-0.5 block">{fieldError('name')}</span>
          )}
        </div>

        <div>
          <label className="block mb-1 text-brand-dark">Correo institucional</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
            placeholder="Ej. r.munoz@hospitalvillarrica.cl"
          />
          {fieldError('email') && (
            <span className="text-[10px] text-brand-coral-dark mt-0.5 block">{fieldError('email')}</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-brand-dark">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={isSubmitting}
              className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
              placeholder="Mínimo 8 caracteres"
            />
            {fieldError('password') && (
              <span className="text-[10px] text-brand-coral-dark mt-0.5 block">{fieldError('password')}</span>
            )}
          </div>

          <div>
            <label className="block mb-1 text-brand-dark">Confirmar contraseña</label>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              minLength={8}
              disabled={isSubmitting}
              className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
              placeholder="Repite la contraseña"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-brand-dark">Rol del funcionario</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={isSubmitting}
            className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-brand-dark">Organización</label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              required
              disabled={isSubmitting || isLoadingCatalogs}
              className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
            >
              <option value="">
                {isLoadingCatalogs ? 'Cargando…' : 'Selecciona…'}
              </option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-brand-dark">Centro de salud</label>
            <select
              value={healthCenterId}
              onChange={(e) => setHealthCenterId(e.target.value)}
              required
              disabled={isSubmitting || !organizationId}
              className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
            >
              <option value="">
                {!organizationId ? 'Elige una organización primero' : 'Selecciona…'}
              </option>
              {healthCenters.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-brand-dark">Unidad</label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              required
              disabled={isSubmitting || !healthCenterId}
              className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
            >
              <option value="">
                {!healthCenterId ? 'Elige un centro primero' : 'Selecciona…'}
              </option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-brand-primary hover:bg-brand-intermediate text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creando cuenta…' : 'Registrar Funcionario'}
        </button>
      </form>
    </div>
  );
};
