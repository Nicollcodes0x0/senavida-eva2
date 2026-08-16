/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole, MedicalSession, VitalSigns, TriageRecord, ChatMessage, ClinicalNote, ConsentRequest } from '../types';
import { AppLogo } from './AppLogo';
import { DashboardAdmin } from './DashboardAdmin';
import { DashboardAdmision } from './DashboardAdmision';
import { DashboardCategorizacion } from './DashboardCategorizacion';
import { DashboardMedico } from './DashboardMedico';
import { PatientView } from './PatientView';
import {
  Users,
  Layers,
  Heart,
  ShieldCheck,
  Smile,
  LogOut,
  Hospital,
  ChevronRight,
  ShieldAlert,
  Clock,
  Menu,
  X
} from 'lucide-react';

interface DashboardContainerProps {
  userRole: UserRole;
  userCenter: string;
  userUnit: string;
  onLogout: () => void;
  onRoleChange?: (role: UserRole) => void;
  // Shared state references
  session: MedicalSession | null;
  onStartSession: (patient: any) => void;
  onAdvanceStage: (stage: string) => void;
  onCloseSession: (reason: string, summary: string) => void;
  vitals: VitalSigns | null;
  onRecordVitals: (v: VitalSigns) => void;
  triage: TriageRecord | null;
  onRecordTriage: (t: TriageRecord) => void;
  consents: ConsentRequest[];
  onConsentToggle: (consentId: string, status: 'granted' | 'rejected') => void;
  onAddConsentRequest?: (type: string, title: string, description: string) => void;
  chatHistory: ChatMessage[];
  onSendMessage: (body: string, type: 'text' | 'pictogram' | 'quick_message', picId?: string) => void;
  calledLocation: string | null;
  onCallLocation: (loc: string | null) => void;
  highContrast?: boolean;
}

export const DashboardContainer: React.FC<DashboardContainerProps> = ({
  userRole,
  userCenter,
  userUnit,
  onLogout,
  onRoleChange,
  session,
  onStartSession,
  onAdvanceStage,
  onCloseSession,
  vitals,
  onRecordVitals,
  triage,
  onRecordTriage,
  consents,
  onConsentToggle,
  onAddConsentRequest,
  chatHistory,
  onSendMessage,
  calledLocation,
  onCallLocation,
  highContrast = false
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sidebar navigation lists
  const sidebarItems = [
    { role: 'admision' as UserRole, label: 'Admisión', icon: Users },
    { role: 'categorizacion' as UserRole, label: 'Categorización', icon: Layers },
    { role: 'medico' as UserRole, label: 'Consulta Médica', icon: Heart },
    { role: 'admin_institucional' as UserRole, label: 'Administración', icon: ShieldCheck },
    { role: 'paciente' as UserRole, label: 'Portal Paciente', icon: Smile }
  ];

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin_institucional': return 'Administrador TI';
      case 'admision': return 'Admisión / Ventanilla';
      case 'categorizacion': return 'Categorización (TENS)';
      case 'medico': return 'Médico Urgenciólogo';
      case 'paciente': return 'Ana María (Paciente Sordo)';
      default: return 'Funcionario';
    }
  };

  return (
    <div className={`min-h-screen flex ${highContrast ? 'bg-black text-yellow-400' : 'bg-brand-bg text-brand-text-primary'}`}>
      
      {/* 1. LEFT SIDEBAR (Desktop: Fixed 256px) */}
      <aside
        id="institutional-sidebar"
        className={`hidden md:flex flex-col transition-all duration-300 flex-shrink-0 border-r ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-slate-900 text-white border-slate-800'}`}
      >
        {/* Logo and toggle section */}
        <div className={`h-20 flex items-center border-b border-slate-800 ${
          sidebarOpen ? 'px-4 justify-start' : 'justify-center px-0'
        }`}>
          {sidebarOpen ? (
            <AppLogo variant="horizontal" theme="dark" size="sm" />
          ) : (
            <AppLogo variant="icon-only" theme="dark" size="sm" />
          )}
        </div>

        {/* User simple badge */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">
            {userRole === 'paciente' ? '👤' : '🏥'}
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <span className="block text-xs font-extrabold truncate text-slate-100">
                {userRole === 'paciente' ? 'Ana María' : 'Personal Clínico'}
              </span>
              <span className="block text-[10px] text-brand-turquoise font-semibold truncate uppercase">
                {getRoleLabel(userRole)}
              </span>
            </div>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-3 space-y-1.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isSelected = userRole === item.role;
            return (
              <button
                key={item.role}
                onClick={() => onRoleChange?.(item.role)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold text-left transition-all ${
                  isSelected
                    ? highContrast
                      ? 'bg-yellow-400 text-black font-black'
                      : 'bg-brand-primary text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={`Cambiar a rol: ${item.label}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
                {isSelected && sidebarOpen && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-brand-turquoise" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {sidebarOpen && (
            <div className="text-[10px] text-slate-400 leading-normal mb-2">
              ✓ Red asistencial segura con encriptación SHA-256
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-bold bg-brand-coral hover:bg-brand-coral-dark text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN LAYOUT SHELL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Institutional header */}
        <header
          id="institutional-header"
          className={`h-20 border-b flex items-center justify-between px-4 sm:px-6 z-10 ${
            highContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-white border-brand-border shadow-sm'
          }`}
        >
          {/* Breadcrumbs and locations */}
          <div className="flex items-center gap-3">
            {/* Mobile sandwich button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-brand-border rounded-lg bg-brand-bg hover:bg-brand-light text-brand-text-secondary md:hidden"
              title="Menú de Navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop sandwich button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-2 border border-brand-border rounded-lg bg-brand-bg hover:bg-brand-light text-brand-text-secondary transition-all"
              title="Contraer/Expandir Menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-brand-text-secondary">
              <Hospital className="w-4 h-4 text-brand-primary" />
              <span>{userCenter}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-brand-dark font-extrabold">{userUnit}</span>
            </div>
          </div>

          {/* Configuration and info badge */}
          <div className="flex items-center gap-3">
            <div className="bg-brand-light text-brand-primary border border-brand-primary/10 rounded-lg px-3 py-1 text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-turquoise" />
              <span>Atención Activa</span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-brand-coral hover:bg-brand-coral-light/20 rounded-lg md:hidden"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 3. CORE ROUTER WORKSPACE (max 1600px padding) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          
          {/* Permanent Informational Disclaimer Box about SEÑAVIDA's complementary nature */}
          <div className={`p-4 rounded-xl mb-6 text-xs leading-relaxed flex flex-col sm:flex-row items-start sm:items-center gap-3.5 border shadow-sm ${
            highContrast 
              ? 'bg-black border-yellow-400 text-yellow-400' 
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg text-lg font-bold flex items-center justify-center">📢</div>
            <div>
              <h4 className="font-extrabold text-slate-900 mb-0.5">Software de Comunicación Inclusiva Complementario (No Reemplaza EHR)</h4>
              <p className="text-slate-600 font-medium">
                SEÑAVIDA es una herramienta de asistencia y mediación lingüística diseñada para asegurar la autonomía clínica y comunicación del paciente sordo. Registra datos específicos para la bitácora móvil de accesibilidad del paciente, pero <strong>no reemplaza, sustituye ni altera el software de registro clínico electrónico obligatorio (ficha clínica local)</strong> de la institución de salud.
              </p>
            </div>
          </div>

          {/* Active Session Status alert */}
          {session ? (
            <div className="p-3.5 bg-brand-light/40 border border-brand-primary/10 rounded-xl text-xs font-semibold text-brand-primary flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-brand-turquoise" />
                <span>
                  Atención en curso para <strong>{session.patientName} (28 años)</strong>. Preferencia: Señas y Texto. Código CTA: <strong>{/* TODO: MedicalSession no incluye el código CTA; cuando el backend lo entregue, reemplazar este valor fijo */ 'SV-847291'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-brand-text-secondary">
                <span>Estado: {session.currentStage}</span>
                <span className="w-2 h-2 rounded-full bg-brand-success animate-ping" />
              </div>
            </div>
          ) : (
            userRole !== 'admin_institucional' && (
              <div className="p-4 bg-brand-yellow-light border border-brand-yellow/20 rounded-xl text-xs font-semibold text-brand-yellow-dark flex items-center gap-2 mb-6">
                <ShieldAlert className="w-4 h-4 animate-bounce" />
                <span>
                  Aviso: No hay una sesión de atención inclusiva en curso. Para simular el flujo, entra como <strong>Admisión</strong>, valida el código CTA de demostración <strong>"SV-847291"</strong> y pulsa registrar.
                </span>
              </div>
            )
          )}

          {/* ACTIVE ROLE DESKTOPS SWITCHER */}
          <div id="active-clinical-desktop">
            {userRole === 'admin_institucional' && (
              <DashboardAdmin user={{ name: 'Admin', email: 'admin@senavida.cl' }} highContrast={highContrast} />
            )}

            {userRole === 'admision' && (
              <DashboardAdmision
                session={session}
                onStartSession={onStartSession}
                onAdvanceStage={onAdvanceStage}
                chatHistory={chatHistory}
                onSendMessage={onSendMessage}
                calledLocation={calledLocation}
                onCallLocation={onCallLocation}
                highContrast={highContrast}
              />
            )}

            {userRole === 'categorizacion' && (
              <DashboardCategorizacion
                session={session}
                onAdvanceStage={onAdvanceStage}
                onRecordVitals={onRecordVitals}
                onRecordTriage={onRecordTriage}
                chatHistory={chatHistory}
                onSendMessage={onSendMessage}
                calledLocation={calledLocation}
                onCallLocation={onCallLocation}
                highContrast={highContrast}
              />
            )}

            {userRole === 'medico' && (
              <DashboardMedico
                session={session}
                vitals={vitals}
                triage={triage}
                consents={consents}
                chatHistory={chatHistory}
                onSendMessage={onSendMessage}
                onSignNote={(note) => {
                  console.log('Nota firmada', note);
                }}
                onCloseSession={onCloseSession}
                onAddConsentRequest={onAddConsentRequest}
                calledLocation={calledLocation}
                onCallLocation={onCallLocation}
                highContrast={highContrast}
              />
            )}

            {userRole === 'paciente' && (
              <PatientView
                sessionConsents={consents}
                onConsentToggle={onConsentToggle}
                chatHistory={chatHistory}
                onSendMessage={onSendMessage}
                calledLocation={calledLocation}
                onClearCallLocation={() => onCallLocation(null)}
                highContrast={highContrast}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-64 max-w-xs bg-slate-900 text-white p-4 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <AppLogo variant="horizontal" theme="dark" size="sm" />
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 space-y-2">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-2">Despacho de Roles</span>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isSelected = userRole === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => {
                      onRoleChange?.(item.role);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-bold text-left transition-all ${
                      isSelected
                        ? 'bg-brand-primary text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onLogout}
              className="w-full h-10 bg-brand-coral text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
