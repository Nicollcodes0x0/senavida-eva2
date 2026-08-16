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
 * También sacamos la selección manual de Establecimiento/Unidad de este
 * formulario. El login del backend las acepta como opcionales, pero como
 * todavía no tenemos el catálogo de centros/unidades conectado (eso viene
 * en la siguiente fase de integración), por ahora el login solo pide correo
 * y contraseña. Cuando conectemos organizations/health-centers/units,
 * volvemos a agregar esos selectores acá si el flujo lo requiere.
 */

import React, { useState } from 'react';
import { AppLogo } from './AppLogo';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, ArrowLeft } from 'lucide-react';
import { login, ApiError, AuthUser } from '../lib/apiClient';

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
      // (con su rol real, no elegido por nosotras en un botón).
      const user = await login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      console.error('Error real capturado en el login:', err);
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
      className={`min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 ${highContrast ? 'bg-black text-yellow-400' : 'bg-brand-bg text-brand-text-primary'
        }`}
    >
      <button
        onClick={onBackClick}
        className={`mb-8 self-center sm:self-start sm:ml-8 flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-lg border transition-colors ${highContrast
            ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400/25'
            : 'border-brand-border text-brand-text-secondary hover:text-brand-primary bg-white'
          }`}
      >
        <ArrowLeft className="w-4 h-4" /> Volver al Inicio
      </button>

      <div
        id="login-card"
        className={`w-full max-w-lg rounded-2xl p-6 sm:p-8 border shadow-xl ${highContrast ? 'bg-black border-yellow-400' : 'bg-white border-brand-border'
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
