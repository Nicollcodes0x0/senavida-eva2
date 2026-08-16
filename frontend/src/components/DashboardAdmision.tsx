/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getPictogramEmoji } from './PatientView';
import { Patient, MedicalSession, ChatMessage } from '../types';
import { mockPatient, mockSession, initialChatHistory } from '../data/mockData';
import { KeyRound, Users, Plus, Clipboard, UserCheck, ShieldAlert, ArrowRight, MessageSquare, Send } from 'lucide-react';

interface DashboardAdmisionProps {
  session: MedicalSession | null;
  onStartSession: (patient: Patient) => void;
  onAdvanceStage: (stage: string) => void;
  chatHistory: ChatMessage[];
  onSendMessage: (body: string, type: 'text' | 'pictogram' | 'quick_message') => void;
  calledLocation?: string | null;
  onCallLocation?: (loc: string | null) => void;
  highContrast?: boolean;
}

export const DashboardAdmision: React.FC<DashboardAdmisionProps> = ({
  session,
  onStartSession,
  onAdvanceStage,
  chatHistory,
  onSendMessage,
  calledLocation,
  onCallLocation,
  highContrast = false
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [patientData, setPatientData] = useState<Patient | null>(null);

  // Form Fields for admission details
  const [commPreference, setCommPreference] = useState('LSCh (Lengua de Señas Chilena) y texto escrito');
  const [allergiesInput, setAllergiesInput] = useState('Penicilina, Lactosa');
  const [callDest, setCallDest] = useState('Sala de Categorización (Box A)');
  const [reasonOfVisit, setReasonOfVisit] = useState('Dolor de cabeza agudo y náuseas intensas');

  const [chatInput, setChatInput] = useState('');

  const handleValidateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.toUpperCase() === 'SV-847291') {
      setPatientData(mockPatient);
      setIsValidated(true);
      setError('');
    } else {
      setError('Código inválido. Escribe "SV-847291" para simular el caso de demostración.');
    }
  };

  const handleStartAttention = () => {
    if (!patientData) return;
    const finalPatient: Patient = {
      ...patientData,
      communicationPreference: commPreference,
      allergies: allergiesInput.split(',').map((a) => a.trim())
    };
    onStartSession(finalPatient);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim(), 'text');
    setChatInput('');
  };

  return (
    <div className="space-y-6">
      {!session ? (
        // STATE A: CODE VALIDATION & REGISTRATION
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Validate Code */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-brand-border space-y-4">
            <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5 border-b pb-3">
              <KeyRound className="w-4 h-4 text-brand-primary" /> Validar Código de Atención (CTA)
            </h3>
            <p className="text-xs text-brand-text-secondary leading-normal">
              Solicita el código temporal impreso o recibido en el móvil por el paciente e ingrésalo a continuación.
            </p>

            <form onSubmit={handleValidateCode} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block mb-1 text-brand-dark">Código CTA (Urgencias)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ej. SV-847291"
                    className="flex-1 h-11 px-3 bg-brand-bg rounded-lg border border-brand-border text-center font-bold text-sm tracking-widest focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-intermediate transition-all text-xs"
                  >
                    Validar
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCode('SV-847291')}
                  className="text-[10px] text-brand-primary underline mt-1.5 font-bold"
                >
                  💡 Autorellenar código demo "SV-847291"
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-brand-coral-light/20 border border-brand-coral/20 text-brand-coral-dark text-[11px] leading-tight">
                  {error}
                </div>
              )}
            </form>

            {isValidated && patientData && (
              <div className="p-4 bg-brand-success-light/30 border border-brand-success/20 rounded-xl space-y-2 animate-fade-in text-xs leading-normal">
                <span className="font-bold text-brand-success flex items-center gap-1">
                  ✓ Paciente Validado de Forma Segura
                </span>
                <p className="font-semibold text-brand-dark">
                  Nombre: <span className="font-normal text-brand-text-primary">{patientData.name}</span>
                </p>
                <p className="font-semibold text-brand-dark">
                  RUT: <span className="font-mono font-bold text-brand-text-primary">{patientData.rut}</span>
                </p>
                <p className="font-semibold text-brand-dark">
                  Edad: <span className="font-normal text-brand-text-primary">{patientData.age} años ({patientData.birthDate})</span>
                </p>
                <p className="font-semibold text-brand-dark">
                  Previsión: <span className="font-normal text-brand-text-primary">{patientData.prevision}</span>
                </p>
                <p className="font-semibold text-brand-dark">
                  Teléfono: <span className="font-normal text-brand-text-primary">{patientData.phone || '+56 9 7462 8193'}</span>
                </p>
                <p className="font-semibold text-brand-dark">
                  Preferencia Declarada: <span className="font-normal text-brand-text-primary">{patientData.communicationPreference}</span>
                </p>
              </div>
            )}
          </div>

          {/* Form Details */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-brand-border space-y-4">
            <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5 border-b pb-3">
              <Clipboard className="w-4 h-4 text-brand-primary" /> Ficha de Registro Pre-ingresada (Lectura)
            </h3>

            {isValidated ? (
              <div className="space-y-4 text-xs font-semibold animate-fade-in">
                {/* Alert/Badge explaining source of data */}
                <div className="p-3 bg-brand-light border border-brand-primary/20 rounded-lg text-[11px] leading-relaxed text-brand-primary font-medium">
                  💡 <strong>Información Importante:</strong> Esta ficha fue completada y autorizada por la paciente <strong>Ana María Torres</strong> al momento de registrarse en su aplicación móvil. No es editable por el personal de salud para resguardar la exactitud de sus preferencias y su autonomía clínica.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Communication Preference */}
                  <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
                    <span className="text-[10px] uppercase text-brand-text-secondary block font-bold">Preferencia de Comunicación</span>
                    <span className="text-brand-dark block text-xs font-semibold">{commPreference}</span>
                  </div>

                  {/* RUN / ID */}
                  <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
                    <span className="text-[10px] uppercase text-brand-text-secondary block font-bold">Identificación (RUN)</span>
                    <span className="text-brand-dark block text-xs font-semibold font-mono">{patientData?.rut || '19.482.903-K'}</span>
                  </div>

                  {/* Fecha de Nacimiento */}
                  <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
                    <span className="text-[10px] uppercase text-brand-text-secondary block font-bold">Fecha de Nacimiento</span>
                    <span className="text-brand-dark block text-xs font-semibold">{patientData?.birthDate || '15/11/1997'}</span>
                  </div>

                  {/* Previsión */}
                  <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
                    <span className="text-[10px] uppercase text-brand-text-secondary block font-bold">Previsión de Salud</span>
                    <span className="text-brand-dark block text-xs font-semibold">{patientData?.prevision || 'FONASA B'}</span>
                  </div>

                  {/* CESFAM */}
                  <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
                    <span className="text-[10px] uppercase text-brand-text-secondary block font-bold">CESFAM de Inscripción</span>
                    <span className="text-brand-dark block text-xs font-semibold">{patientData?.cesfam || 'CESFAM Villarrica Centro'}</span>
                  </div>

                  {/* Teléfono */}
                  <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
                    <span className="text-[10px] uppercase text-brand-text-secondary block font-bold">Teléfono o Celular</span>
                    <span className="text-brand-dark block text-xs font-semibold font-mono">{patientData?.phone || '+56 9 7462 8193'}</span>
                  </div>

                  {/* Dirección */}
                  <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
                    <span className="text-[10px] uppercase text-brand-text-secondary block font-bold">Dirección Particular</span>
                    <span className="text-brand-dark block text-xs font-semibold truncate" title={patientData?.address || 'Av. Pedro de Valdivia 1420, Depto 402, Temuco'}>
                      {patientData?.address || 'Av. Pedro de Valdivia 1420, Depto 402, Temuco'}
                    </span>
                  </div>
                </div>

                {/* Allergies */}
                <div className="p-3 bg-brand-coral-light/25 border border-brand-coral/20 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase text-brand-coral-dark block font-bold">Alergias Críticas Registradas</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {allergiesInput.split(',').map((alg, index) => (
                      <span key={index} className="bg-brand-coral text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                        ⚠️ {alg.trim()}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-brand-coral-dark block mt-1 font-medium">
                    * Estos riesgos se proyectarán en los indicadores clínicos de todas las salas de atención.
                  </span>
                </div>

                {/* Reason of Visit */}
                <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1.5">
                  <span className="text-[10px] uppercase text-brand-text-secondary block font-bold">Motivo de Consulta Inicial (Declarado)</span>
                  <p className="text-brand-dark font-medium leading-relaxed bg-white p-2.5 rounded border border-brand-border/60 italic text-xs">
                    "{reasonOfVisit}"
                  </p>
                </div>

                {/* Emergency Contact */}
                <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
                  <span className="text-[10px] uppercase text-brand-text-secondary block font-bold">Contacto de Emergencia Designado</span>
                  <p className="text-brand-dark text-xs font-bold">
                    Carlos Torres Solís <span className="font-medium text-brand-text-secondary text-[11px]">(Padre)</span>
                  </p>
                  <p className="text-brand-text-secondary text-[11px] font-medium">Fono: +56 9 8473 9201</p>
                </div>

                <button
                  onClick={handleStartAttention}
                  className="w-full py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-intermediate transition-all flex items-center justify-center gap-1.5 text-sm shadow-sm"
                >
                  <UserCheck className="w-4 h-4" /> Iniciar Atención Inclusiva en Urgencias
                </button>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-brand-text-secondary bg-brand-bg/40 rounded-xl border border-dashed border-brand-border">
                <Users className="w-8 h-8 text-brand-border mb-2" />
                <p className="text-xs max-w-xs font-semibold">
                  Ingresa y valida un código CTA válido a la izquierda para cargar los datos pre-registrados de la paciente.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // STATE B: ACTIVE SESSION CONTROLS & CHAT AT ADMISSION
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Patient summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-brand-border space-y-3">
              <span className="text-[10px] bg-brand-success-light text-brand-success font-extrabold px-2.5 py-1 rounded border border-brand-success/15 inline-block uppercase">
                Atención Iniciada
              </span>
              <h3 className="text-base font-extrabold text-brand-dark">{session.patientName}</h3>
              <p className="text-xs text-brand-text-secondary leading-normal font-semibold">
                Edad: <span className="font-medium text-brand-text-primary">{session.patientAge} años</span>
              </p>
              <p className="text-xs text-brand-text-secondary leading-normal font-semibold">
                Comunicación: <span className="font-medium text-brand-text-primary">{session.communicationPreference}</span>
              </p>
              <p className="text-xs text-brand-text-secondary leading-normal font-semibold">
                Alergias: <span className="bg-brand-coral-light/25 text-brand-coral-dark px-1.5 py-0.5 rounded text-[10px] font-extrabold">PENICILINA, LACTOSA</span>
              </p>

              {/* Ficha de admisión rápida en el lateral de atención activa */}
              <div className="border-t pt-2.5 mt-2.5 space-y-1.5 text-xs">
                <span className="text-[10px] text-brand-text-secondary uppercase block font-bold">Datos de Admisión</span>
                <p className="text-brand-text-secondary font-semibold">
                  RUT: <span className="font-mono text-brand-dark font-bold">{mockPatient.rut}</span>
                </p>
                <p className="text-brand-text-secondary font-semibold">
                  Fecha de Nacimiento: <span className="text-brand-dark font-medium">{mockPatient.birthDate}</span>
                </p>
                <p className="text-brand-text-secondary font-semibold">
                  Previsión: <span className="text-brand-dark font-medium">{mockPatient.prevision}</span>
                </p>
                <p className="text-brand-text-secondary font-semibold">
                  CESFAM: <span className="text-brand-dark font-medium">{mockPatient.cesfam}</span>
                </p>
                <p className="text-brand-text-secondary font-semibold">
                  Celular: <span className="text-brand-dark font-medium font-mono">{mockPatient.phone}</span>
                </p>
                <p className="text-brand-text-secondary font-semibold">
                  Dirección: <span className="text-brand-dark font-medium block bg-brand-bg p-1.5 rounded border border-brand-border/40 text-[11px] mt-0.5 leading-tight">{mockPatient.address}</span>
                </p>
              </div>

              <div className="border-t pt-3 mt-4">
                <span className="text-[10px] text-brand-text-secondary uppercase block font-bold mb-2">Siguiente Paso</span>
                <button
                  onClick={() => onAdvanceStage('Categorización')}
                  className="w-full py-2.5 bg-brand-turquoise hover:bg-brand-turquoise-dark text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                >
                  Derivar a Categorización <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Convocatoria (Llamado de Paciente) */}
              <div className="border-t pt-3.5 mt-4 space-y-2">
                <span className="text-[10px] text-brand-text-secondary uppercase block font-black flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-primary" /> Convocatoria de Paciente
                </span>
                <p className="text-[10px] text-brand-text-secondary leading-normal font-semibold">
                  Envía una alerta inmediata a la app del paciente indicando a dónde debe dirigirse:
                </p>
                <div className="space-y-1.5">
                  <select
                    value={callDest}
                    onChange={(e) => setCallDest(e.target.value)}
                    className="w-full p-2 bg-brand-bg border border-brand-border rounded-lg text-xs font-bold text-brand-dark outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="Sala de Categorización (Box A)">Sala de Categorización (Box A)</option>
                    <option value="Sala de Espera General (Piso 1)">Sala de Espera General (Piso 1)</option>
                    <option value="Box de Consulta Médica N° 3">Box de Consulta Médica N° 3</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (onCallLocation) {
                        onCallLocation(callDest);
                        onSendMessage(`📢 LLAMADO A PACIENTE: Por favor diríjase a: ${callDest}`, 'text');
                      }
                    }}
                    className={`w-full py-2 bg-brand-primary hover:bg-brand-intermediate text-white font-black rounded-lg text-[10px] flex items-center justify-center gap-1.5 shadow-xs uppercase transition-all active:scale-95 ${
                      calledLocation === callDest ? 'bg-brand-success' : ''
                    }`}
                  >
                    {calledLocation === callDest ? '✓ Llamado Activo' : '📢 Notificar Dirección'}
                  </button>
                  {calledLocation && (
                    <div className="p-2 bg-brand-yellow-light/50 border border-brand-yellow/30 text-brand-yellow-dark rounded-lg font-bold text-[9px] flex items-center justify-between">
                      <span className="truncate">Llamado activo: <strong>{calledLocation}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onCallLocation) onCallLocation(null);
                        }}
                        className="text-brand-coral hover:underline font-black uppercase text-[8px] pl-1 ml-auto"
                      >
                        [Quitar]
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Chat box */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-brand-border overflow-hidden flex flex-col h-[450px]">
            <div className="p-3 bg-brand-dark text-white text-xs font-bold flex justify-between items-center">
              <span>💬 Panel de Conversación Inclusiva</span>
              <span className="text-[10px] text-brand-turquoise font-mono font-bold">SV-847291</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-brand-bg/40">
              {chatHistory.map((msg) => {
                const isPatient = msg.senderType === 'patient';
                const isSystem = msg.senderType === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center">
                      <span className="inline-block px-2.5 py-1 bg-brand-light/70 border rounded-full text-[9px] font-bold text-brand-primary">
                        {msg.body}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex ${isPatient ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-xl border ${
                        isPatient
                          ? 'bg-white text-brand-dark rounded-tl-none border-brand-border shadow-xs'
                          : 'bg-brand-light text-brand-dark rounded-tr-none border-brand-primary/10'
                      }`}
                    >
                      <span className="text-[9px] font-bold text-brand-primary block mb-0.5">
                        {isPatient ? msg.senderName : 'Tú (Admisión)'}
                      </span>
                      <p className="text-xs font-medium leading-relaxed">{msg.body}</p>
                      {msg.messageType === 'pictogram' && (
                        <div className="mt-1.5 inline-flex items-center gap-1 bg-brand-success-light text-brand-turquoise-dark px-2 py-0.5 rounded text-[10px] font-bold">
                          <span className="text-xs">{getPictogramEmoji(msg.pictogramPath || '')}</span> Pictograma
                        </div>
                      )}
                      <span className="block text-[8px] text-brand-text-secondary mt-1 text-right font-medium">
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendChat} className="p-2 border-t bg-white flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe un mensaje de texto para el paciente..."
                className="flex-1 h-10 px-3 bg-brand-bg rounded-lg border border-brand-border text-xs font-semibold focus:ring-2 focus:ring-brand-primary outline-none"
              />
              <button
                type="submit"
                className="h-10 w-10 bg-brand-primary text-white rounded-lg flex items-center justify-center hover:bg-brand-intermediate transition-all flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
