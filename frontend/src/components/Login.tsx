/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Login.tsx
 *
 * Este componente ya no simula el inicio de sesión: llama de verdad al
 * backend a través de apiClient.login(). Antes teníamos un selector de
 * "roles rápidos" (Admisión, TENS, Médico, etc.) que autocompletaba el
 * formulario y dejaba entrar sin validar nada — eso era un helper temporal
 * de pruebas, y lo sacamos siguiendo nuestro propio plan de retiro de
 * elementos de demostración: ahora el único camino para entrar es escribir
 * el correo y la contraseña reales, y el rol lo decide el backend según la
 * cuenta, no un botón de la pantalla.
 *
 * Agregamos los selectores de Establecimiento y Unidad como OPCIONALES,
 * ahora que ya tenemos el catálogo real conectado (organizations,
 * health-centers, units). Son opcionales porque el propio AuthController.php
 * también los trata como opcionales ("sometimes" en su validación) — si la
 * persona no los elige, el login funciona igual solo con correo y
 * contraseña. Si sí los elige, el backend valida además que el usuario
 * realmente pertenezca a ese centro y esa unidad, y devuelve 403 si no
 * coincide.
 */

import React, { useState, useEffect } from 'react';
import { AppLogo } from './AppLogo';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, ArrowLeft } from 'lucide-react';
import {
  login,
  ApiError,
  AuthUser,
  listHealthCenters,
  listUnits,
  HealthCenter,
  Unit,
} from '../lib/apiClient';

interface LoginProps {
  onLoginSuccess: (user: AuthUser) => void;
  onBackClick: () => void;
  highContrast?: boolean;
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onBackClick,
  highContrast = false
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selectores opcionales de Establecimiento y Unidad. Empiezan vacíos
  // ('') a propósito: un valor vacío significa "no elegido", y así no lo
  // mandamos en el login (ver handleSubmit).
  const [healthCenterId, setHealthCenterId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Cargamos los centros de salud apenas se abre la pantalla de login.
  // Si esto falla (por ejemplo, el backend está caído), no bloqueamos el
  // login en sí — solo dejamos los selectores vacíos, ya que son opcionales.
  useEffect(() => {
    listHealthCenters()
      .then(setHealthCenters)
      .catch(() => setHealthCenters([]));
  }, []);

  // Cuando cambia el centro elegido, cargamos sus unidades y limpiamos la
  // unidad que estuviera seleccionada antes (ya no aplicaría al centro nuevo).
  useEffect(() => {
    setUnitId('');
    if (!healthCenterId) {
      setUnits([]);
      return;
    }
    listUnits(healthCenterId)
      .then(setUnits)
      .catch(() => setUnits([]));
  }, [healthCenterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, ingresa tu correo institucional y contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Acá está la conexión real: si el backend confirma las credenciales,
      // login() ya deja el token guardado y nos devuelve el usuario real
      // (con su rol real, no elegido por nosotras en un botón). Mandamos
      // healthCenterId/unitId solo si la persona los eligió — si quedaron
      // vacíos, login() simplemente no los incluye en la petición.
      const user = await login(
        email,
        password,
        healthCenterId || undefined,
        unitId || undefined
      );
      onLoginSuccess(user);
    } catch (err) {
      if (err instanceof ApiError) {
        // Los errores de validación (422) traen el detalle por campo; para
        // el login basta con mostrar el mensaje principal, que ya viene en
        // español y pensado para la persona usuaria.
        setError(err.message);
      } else {
        setError('No pudimos conectar con el servidor. Intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="login-view-wrapper"
      className={`min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 ${
        highContrast ? 'bg-black text-yellow-400' : 'bg-brand-bg text-brand-text-primary'
      }`}
    >
      <button
        onClick={onBackClick}
        className={`mb-8 self-center sm:self-start sm:ml-8 flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-lg border transition-colors ${
          highContrast
            ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400/25'
            : 'border-brand-border text-brand-text-secondary hover:text-brand-primary bg-white'
        }`}
      >
        <ArrowLeft className="w-4 h-4" /> Volver al Inicio
      </button>

      <div
        id="login-card"
        className={`w-full max-w-lg rounded-2xl p-6 sm:p-8 border shadow-xl ${
          highContrast ? 'bg-black border-yellow-400' : 'bg-white border-brand-border'
        }`}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <AppLogo variant="vertical" theme={highContrast ? 'dark' : 'light'} size="lg" />
          <h2 className="text-xl font-bold mt-4">Acceso Institucional Protegido</h2>
          <p className="text-xs text-brand-text-secondary mt-1">
            Plataforma complementaria de comunicación inclusiva en salud.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {error && (
            <div className="p-3 rounded-lg border border-brand-coral/20 bg-brand-coral-light/25 text-brand-coral-dark flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Correo institucional */}
          <div>
            <label className="block mb-1 text-brand-dark">Correo Electrónico Institucional</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-brand-text-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full h-11 pl-10 pr-4 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
                placeholder="Ej. n.orellana@hospitalvillarrica.cl"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-brand-dark">Contraseña</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-brand-text-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full h-11 pl-10 pr-10 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-brand-text-secondary hover:text-brand-primary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Establecimiento y Unidad — opcionales. Si el backend no
              devuelve ningún centro (por ejemplo, si el catálogo está
              vacío), simplemente no aparece nada para elegir y el login
              sigue funcionando igual solo con correo y contraseña. */}
          {healthCenters.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-brand-dark">
                  Establecimiento <span className="text-brand-text-secondary font-normal">(opcional)</span>
                </label>
                <select
                  value={healthCenterId}
                  onChange={(e) => setHealthCenterId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-11 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
                >
                  <option value="">Sin especificar</option>
                  {healthCenters.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-brand-dark">
                  Unidad <span className="text-brand-text-secondary font-normal">(opcional)</span>
                </label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  disabled={isSubmitting || !healthCenterId}
                  className="w-full h-11 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none disabled:opacity-60"
                >
                  <option value="">
                    {!healthCenterId ? 'Elige un establecimiento primero' : 'Sin especificar'}
                  </option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-brand-primary hover:bg-brand-intermediate text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verificando…' : '🔑 Ingresar al Sistema Seguro'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t text-center text-[10px] text-brand-text-secondary leading-relaxed">
          Acceso estrictamente confidencial reglamentado bajo normas de secreto médico y Ley N° 19.628 de Protección de la Vida Privada.
        </div>
      </div>
    </div>
  );
};
