/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * App.tsx
 *
 * Cambio principal de esta versión: el login ya no es simulado. Antes,
 * handleLoginSuccess recibía un rol elegido a mano desde un botón en
 * Login.tsx y armábamos un usuario falso con new Date() como id. Ahora
 * Login.tsx llama al backend de verdad y nos entrega acá el usuario real
 * (con su rol real, decidido por el backend, no por nosotras).
 *
 * También sacamos la "barra flotante de simulador" que dejaba cambiar de
 * rol con un clic sin volver a iniciar sesión — era un helper para probar
 * la interfaz mientras no había backend, y ahora que el login es real, ese
 * atajo ya no debe existir: cambiar de rol sin autenticarse de nuevo sería
 * justamente el hueco de seguridad que señala nuestro propio documento de
 * requisitos (RF-006).
 *
 * Todo el resto del flujo clínico (sesión médica, signos vitales, triage,
 * chat, consentimientos) sigue igual que antes, funcionando con estado
 * local: esas partes se conectan a la API más adelante, cuando el backend
 * publique esos endpoints.
 */

import React, { useState, useEffect } from 'react';
import { MedicalSession, VitalSigns, TriageRecord, ChatMessage, ConsentRequest } from './types';
import { initialChatHistory, initialConsents } from './data/mockData';
import { PublicHeader } from './components/PublicHeader';
import { PublicFooter } from './components/PublicFooter';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { DashboardContainer } from './components/DashboardContainer';
import { AuthUser, fetchCurrentUser, logout as apiLogout, getStoredToken } from './lib/apiClient';

export default function App() {
  // Navigation States
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [activeSection, setActiveSection] = useState('inicio');

  // Accessibility States
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    dyslexicFont: false,
    highContrast: false,
    fontSizeMultiplier: 1.0,
  });

  // Usuario real, tal como lo devuelve el backend (id, name, email, role,
  // isActive). Ya no lo armamos nosotras a mano.
  const [user, setUser] = useState<AuthUser | null>(null);

  // Mientras se verifica si ya existe una sesión guardada (token en
  // localStorage) al cargar la página, mostramos esto para no parpadear
  // a la landing antes de saber si hay que ir directo al dashboard.
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Shared Clinical Session States for Sandbox Mode
  const [session, setSession] = useState<MedicalSession | null>(null);
  const [vitals, setVitals] = useState<VitalSigns | null>(null);
  const [triage, setTriage] = useState<TriageRecord | null>(null);
  const [consents, setConsents] = useState<ConsentRequest[]>(initialConsents);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(initialChatHistory);
  const [calledLocation, setCalledLocation] = useState<string | null>(null);

  // Al montar la app, si ya hay un token guardado de una sesión anterior,
  // intentamos recuperar el usuario real desde /auth/me en vez de mandar
  // a la persona de vuelta al login cada vez que recarga la página.
  useEffect(() => {
    const restoreSession = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        setCurrentView('dashboard');
      } catch {
        // El token guardado ya no es válido (expiró o se revocó en el
        // servidor): lo ignoramos y dejamos a la persona en la landing.
      } finally {
        setIsCheckingSession(false);
      }
    };

    restoreSession();
  }, []);

  // Sync font attributes to document body
  useEffect(() => {
    if (accessibilitySettings.dyslexicFont) {
      document.body.classList.add('accessible-font');
    } else {
      document.body.classList.remove('accessible-font');
    }
  }, [accessibilitySettings.dyslexicFont]);

  // Handle smooth scroll on landing page sections
  const handleNavClick = (sectionId: string) => {
    setCurrentView('landing');
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Esta función ahora la llama Login.tsx después de que el backend ya
  // confirmó las credenciales. Ya no armamos nosotras el objeto usuario:
  // llega completo y real desde la API.
  const handleLoginSuccess = (authenticatedUser: AuthUser) => {
    setUser(authenticatedUser);
    setCurrentView('dashboard');
  };

  const handleStartSession = (patientData: any) => {
    const newSession: MedicalSession = {
      id: 'sess-' + Date.now(),
      patientId: patientData.id,
      patientName: patientData.name,
      patientAge: patientData.age,
      communicationPreference: patientData.communicationPreference,
      organizationId: 'org-chile-salud',
      healthCenterId: 'hc-villarrica',
      unitId: 'unit-urgencias',
      status: 'active',
      startedAt: new Date().toISOString(),
      currentStage: 'Admisión',
      createdBy: user?.id || 'sys',
    };
    setSession(newSession);
    setChatHistory(initialChatHistory);
    setVitals(null);
    setTriage(null);
    setConsents(initialConsents);
    setCalledLocation(null);
  };

  const handleAdvanceStage = (stage: string) => {
    if (session) {
      setSession(prev => prev ? { ...prev, currentStage: stage} : null);

      const sysMsg: ChatMessage = {
        id: 'sys-trans-' + Date.now(),
        sessionId: session.id,
        senderType: 'system',
        senderName: 'SEÑAVIDA',
        messageType: 'system',
        body: `Paciente derivada a sala de ${stage}.`,
        origin: 'system',
        status: 'read',
        sentAt: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, sysMsg]);
    }
  };

  const handleCloseSession = (reason: string, summary: string)=> {
    if (session) {
      setSession(prev => prev ? { ...prev, status: 'closed', currentStage: 'Cerrado', summary, closureReason: reason } : null);

      const sysMsg: ChatMessage = {
        id: 'sys-close-' + Date.now(),
        sessionId: session.id,
        senderType: 'system',
        senderName: 'SEÑAVIDA',
        messageType: 'system',
        body: `Sesión cerrada de forma permanente por: ${reason}. Código de acceso expirado.`,
        origin: 'system',
        status: 'read',
        sentAt: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, sysMsg]);
      alert('La sesión se ha cerrado y bloqueado con éxito. Se generaron las firmas de auditoría.');
    }
  };

  const handleConsentToggle = (consentId: string, status: 'granted' | 'rejected') => {
    setConsents(prev => prev.map(c => c.id === consentId ? { ...c, status } : c));
  };

  const handleAddConsentRequest = (type: string, title: string, description: string) => {
    const newConsent: ConsentRequest = {
      id: 'con-' + Date.now(),
      sessionId: session?.id || 'sess-1001',
      consentType: type as any,
      title,
      description,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    setConsents(prev => [...prev, newConsent]);
  };

  const handleSendMessage = (body: string, type: 'text' | 'pictogram' | 'quick_message', picId?: string) => {
    if (!session || !user) return;

    let senderName = 'Personal Médico';
    let senderType: 'patient' | 'staff' = 'staff';
    let origin: 'patient' | 'admission' | 'triage' | 'doctor' = 'admission';

    if (user.role === 'paciente') {
      senderName = user.name;
      senderType = 'patient';
      origin = 'patient';
    } else {
      senderType = 'staff';
      senderName = user.name;
      if (user.role === 'admision') origin = 'admission';
      else if (user.role === 'categorizacion') origin = 'triage';
      else if (user.role === 'medico') origin = 'doctor';
    }

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sessionId: session.id,
      senderType,
      senderName,
      messageType: type,
      body,
      origin,
      status: 'sent',
      sentAt: new Date().toISOString(),
      pictogramPath: picId,
      confirmedByPatientAt: senderType === 'patient' ? new Date().toISOString() : undefined
    };

    setChatHistory(prev => [...prev, newMsg]);
  };

  // El logout ahora también avisa al backend para que revoque el token
  // (que quede inválido de verdad en el servidor, no solo "olvidado" en
  // el navegador). apiLogout() ya se encarga de limpiar el token guardado
  // aunque la petición al servidor falle.
  const handleLogout = async () => {
    await apiLogout();
    setUser(null);
    setCurrentView('landing');
  };

  // Mientras verificamos si hay una sesión previa válida, no mostramos
  // nada todavía para evitar el parpadeo de landing → dashboard.
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-brand-text-secondary text-sm font-semibold">
        Verificando sesión…
      </div>
    );
  }

  return (
    <div
      id="app-container"
      className="min-h-screen flex flex-col"
      style={{ fontSize: `${accessibilitySettings.fontSizeMultiplier}rem` }}
    >
      {/* HEADER: Show public header on Landing and Login views */}
      {currentView !== 'dashboard' && (
        <PublicHeader
          onLoginClick={() => setCurrentView('login')}
          activeSection={activeSection}
          onNavClick={handleNavClick}
          accessibilitySettings={accessibilitySettings}
          setAccessibilitySettings={setAccessibilitySettings}
        />
      )}

      {/* RENDER VIEWPORTS */}
      <div className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onLearnMoreClick={() => handleNavClick('como-funciona')}
            onLoginClick={() => setCurrentView('login')}
            highContrast={accessibilitySettings.highContrast}
          />
        )}

        {currentView === 'login' && (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onBackClick={() => setCurrentView('landing')}
            highContrast={accessibilitySettings.highContrast}
          />
        )}

        {currentView === 'dashboard' && user && (
          <DashboardContainer
            userRole={user.role}
            userCenter={'Hospital Regional de Villarrica'}
            userUnit={'Servicio de Urgencias'}
            onLogout={handleLogout}
            session={session}
            onStartSession={handleStartSession}
            onAdvanceStage={handleAdvanceStage}
            onCloseSession={handleCloseSession}
            vitals={vitals}
            onRecordVitals={setVitals}
            triage={triage}
            onRecordTriage={setTriage}
            consents={consents}
            onConsentToggle={handleConsentToggle}
            onAddConsentRequest={handleAddConsentRequest}
            chatHistory={chatHistory}
            onSendMessage={handleSendMessage}
            calledLocation={calledLocation}
            onCallLocation={setCalledLocation}
            highContrast={accessibilitySettings.highContrast}
          />
        )}
      </div>

      {/* FOOTER: Show public footer only when outside internal clinician dashboards */}
      {currentView !== 'dashboard' && (
        <PublicFooter
          onNavClick={handleNavClick}
          onLoginClick={() => setCurrentView('login')}
          highContrast={accessibilitySettings.highContrast}
        />
      )}
    </div>
  );
}
