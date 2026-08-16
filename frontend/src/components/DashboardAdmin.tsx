/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { mockPictograms } from '../data/mockData';
import { Pictogram } from '../types';
import { ShieldCheck, Users, Eye, History, Database, Settings, ToggleLeft, ToggleRight, Plus, Search, HelpCircle } from 'lucide-react';

interface DashboardAdminProps {
  user: { name: string; email: string; healthCenter?: string; unit?: string };
  highContrast?: boolean;
}

export const DashboardAdmin: React.FC<DashboardAdminProps> = ({ user, highContrast = false }) => {
  const [pictograms, setPictograms] = useState<Pictogram[]>(mockPictograms);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState('20'); // 20 minutes default

  const togglePictogram = (id: string) => {
    setPictograms((prev) =>
      prev.map((pic) => (pic.id === id ? { ...pic, isActive: !pic.isActive } : pic))
    );
  };

  const auditLogs = [
    { id: '1', action: 'validate_cta', resource: 'Ana María Torres', user: 'María José (Admisión)', time: 'Hace 23 minutos', ip: '192.168.12.44', severity: 'info' },
    { id: '2', action: 'sign_clinical_note', resource: 'Ana María Torres', user: 'Dr. Andrés Soto', time: 'Hace 1 hora', ip: '192.168.10.150', severity: 'warning' },
    { id: '3', action: 'revoke_consent_camera', resource: 'Ana María Torres', user: 'Ana María Torres (Paciente)', time: 'Hace 2 horas', ip: '186.20.144.11', severity: 'critical' },
    { id: '4', action: 'create_user', resource: 'TENS Rodrigo Muñoz', user: 'Administrador TI', time: 'Hace 4 horas', ip: '10.0.1.12', severity: 'info' }
  ];

  const filteredPics = pictograms.filter((pic) =>
    pic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pic.phrase.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-brand-light text-brand-primary flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-text-secondary uppercase font-bold block">Funcionarios Activos</span>
            <span className="text-xl font-black text-brand-dark">42 Usuarios</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-brand-success-light text-brand-turquoise-dark flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-text-secondary uppercase font-bold block">Consumo de la API</span>
            <span className="text-xl font-black text-brand-dark">3.4K Peticiones</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-brand-coral-light/20 text-brand-coral-dark flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-text-secondary uppercase font-bold block">Tasa de Auditoría</span>
            <span className="text-xl font-black text-brand-dark">100% Repudiable</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left column (Pictogram manager), Right Column (Logs + Settings) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pictogram manager */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-brand-border space-y-4">
          <div className="border-b pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5">
                🎨 Administrador de Pictogramas Médicos
              </h3>
              <p className="text-[11px] text-brand-text-secondary mt-0.5">
                Habilita o deshabilita los símbolos que visualizan los pacientes sordos en auto-atención.
              </p>
            </div>
            <button
              onClick={() => alert('Demostración: Formulario para añadir pictograma.')}
              className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold flex items-center gap-1 hover:bg-brand-intermediate"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-brand-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por síntoma o palabra clave..."
              className="w-full h-10 pl-9 pr-4 bg-brand-bg rounded-lg border border-brand-border text-xs font-semibold focus:ring-2 focus:ring-brand-primary outline-none"
            />
          </div>

          {/* Table List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead>
                <tr className="border-b text-brand-text-secondary">
                  <th className="pb-2">Símbolo</th>
                  <th className="pb-2">Título / Frase</th>
                  <th className="pb-2">Voz Sintetizada</th>
                  <th className="pb-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredPics.map((pic) => (
                  <tr key={pic.id} className="border-b last:border-0 hover:bg-brand-bg/40">
                    <td className="py-2.5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-brand-light text-brand-primary font-bold text-base">
                        🏥
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="font-bold text-brand-dark block">{pic.title}</span>
                      <span className="text-[10px] text-brand-text-secondary italic">"{pic.phrase}"</span>
                    </td>
                    <td className="py-2.5 text-brand-text-secondary text-[10px]">
                      {pic.speechText}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => togglePictogram(pic.id)}
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          pic.isActive ? 'text-brand-success' : 'text-brand-text-secondary'
                        }`}
                      >
                        {pic.isActive ? (
                          <>
                            <ToggleRight className="w-5 h-5 stroke-[2.5]" /> Habilitado
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5" /> Deshabilitado
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs + Expiration Settings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Expiration Settings */}
          <div className="bg-white p-5 rounded-xl border border-brand-border space-y-4">
            <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5 border-b pb-3">
              <Settings className="w-4 h-4 text-brand-primary" /> Configuración de Seguridad TI
            </h3>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block mb-1 text-brand-dark">Expiración por inactividad de sesión</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-20 h-10 px-3 bg-brand-bg rounded-lg border border-brand-border text-center font-bold focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                  <span className="text-brand-text-secondary">Minutos</span>
                </div>
                <span className="text-[10px] text-brand-text-secondary block mt-1 leading-normal">
                  La atención inclusiva se cerrará automáticamente si no se detecta actividad en el chat en este lapso.
                </span>
              </div>

              <div>
                <label className="block mb-1 text-brand-dark">Intentos máximos de CTA fallidos</label>
                <select className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none">
                  <option>3 intentos (Recomendado)</option>
                  <option>5 intentos</option>
                  <option>Sin bloqueo</option>
                </select>
              </div>

              <button
                onClick={() => alert('Parámetros de red guardados en la base de datos de simulación.')}
                className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-lg text-xs hover:bg-brand-intermediate transition-all shadow-sm"
              >
                Guardar Configuración
              </button>
            </div>
          </div>

          {/* Audit Logs list */}
          <div className="bg-white p-5 rounded-xl border border-brand-border space-y-4">
            <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5 border-b pb-3">
              <History className="w-4 h-4 text-brand-primary" /> Registro de Acceso y Auditoría
            </h3>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-brand-bg rounded-lg border text-[11px] leading-tight space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brand-dark uppercase font-mono">{log.action}</span>
                    <span className="text-brand-text-secondary font-medium">{log.time}</span>
                  </div>
                  <p className="text-brand-text-secondary font-medium">
                    Autor: <strong className="text-brand-dark">{log.user}</strong> sobre paciente <strong className="text-brand-dark">{log.resource}</strong>
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-brand-text-secondary">
                    <span>IP: {log.ip}</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                      log.severity === 'info' ? 'bg-brand-light text-brand-primary' : log.severity === 'warning' ? 'bg-brand-yellow-light text-brand-yellow-dark' : 'bg-brand-coral-light/20 text-brand-coral-dark'
                    }`}>
                      {log.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => alert('Demostración: Exportando logs a formato PDF/Excel con firmas no repudiables.')}
              className="w-full py-2.5 bg-brand-bg text-brand-text-secondary border font-bold rounded-lg text-xs hover:bg-brand-light hover:text-brand-primary transition-all flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" /> Exportar Logs Firmados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
