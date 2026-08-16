/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getPictogramEmoji } from './PatientView';
import { MedicalSession, VitalSigns, TriageRecord, ChatMessage, ClinicalNote, TimelineEvent, ConsentRequest } from '../types';
import { mockPatient } from '../data/mockData';
import {
  Heart,
  Activity,
  History,
  Shield,
  FileText,
  Video,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Accessibility,
  ArrowRight,
  Send,
  Camera,
  X,
  Volume2,
  Users
} from 'lucide-react';

interface DashboardMedicoProps {
  session: MedicalSession | null;
  vitals: VitalSigns | null;
  triage: TriageRecord | null;
  consents: ConsentRequest[];
  chatHistory: ChatMessage[];
  onSendMessage: (body: string, type: 'text' | 'pictogram' | 'quick_message') => void;
  onSignNote: (note: ClinicalNote) => void;
  onCloseSession: (reason: string, summary: string) => void;
  onAddConsentRequest?: (type: string, title: string, description: string) => void;
  calledLocation?: string | null;
  onCallLocation?: (loc: string | null) => void;
  highContrast?: boolean;
}

export const DashboardMedico: React.FC<DashboardMedicoProps> = ({
  session,
  vitals,
  triage,
  consents,
  chatHistory,
  onSendMessage,
  onSignNote,
  onCloseSession,
  onAddConsentRequest,
  calledLocation,
  onCallLocation,
  highContrast = false
}) => {
  // Clinical Note inputs
  const [noteType, setNoteType] = useState<'impression' | 'diagnosis' | 'treatment' | 'medication' | 'indication'>('impression');
  const [noteContent, setNoteContent] = useState('');
  const [notesHistory, setNotesHistory] = useState<ClinicalNote[]>([]);
  const [callDest, setCallDest] = useState('Box de Consulta Médica N° 3');
  const [isSigned, setIsSigned] = useState(false);

  // Interpreter Request State
  const [interpreterStatus, setInterpreterStatus] = useState<'idle' | 'requested' | 'assigned'>('idle');
  const [videoActive, setVideoActive] = useState(false);

  // Speech Synthesis Play function
  const handlePlayAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CL'; // Chilean Spanish
      window.speechSynthesis.speak(utterance);
    }
  };

  // Pre-registered Emergency Contacts from Patient Registration
  const preRegisteredContacts = [
    { id: 'c1', name: 'Carlos Torres Solís', relationship: 'Padre', phone: '+56 9 8473 9201' },
    { id: 'c2', name: 'Marta Torres Aguirre', relationship: 'Hermana', phone: '+56 9 9381 2048' }
  ];
  const [selectedContactId, setSelectedContactId] = useState<string>('c1');

  // Closure Session States
  const [closureReason, setClosureReason] = useState('Atención Completada con Éxito');
  const [closureSummary, setClosureSummary] = useState('Paciente dada de alta con tratamiento sintomático para migraña tensional.');
  const [showClosureModal, setShowClosureModal] = useState(false);

  const [chatInput, setChatInput] = useState('');

  const handleSignClinicalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !noteContent.trim()) return;

    const newNote: ClinicalNote = {
      id: 'note-' + Date.now(),
      sessionId: session.id,
      authorId: 'doc-001',
      authorName: 'Dr. Andrés Soto',
      authorRole: 'Médico Urgenciólogo',
      noteType,
      content: noteContent,
      status: 'signed',
      signedAt: new Date().toISOString(),
      version: 1,
      createdAt: new Date().toISOString()
    };

    onSignNote(newNote);
    setNotesHistory((prev) => [...prev, newNote]);
    setNoteContent('');
    setIsSigned(true);
    setTimeout(() => setIsSigned(false), 3000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim(), 'text');
    setChatInput('');
  };

  const timelineEvents: TimelineEvent[] = [
    { id: 'ev-1', sessionId: '1', eventType: 'session_started', actorName: 'María José', description: 'Atención iniciada con el código de ventanilla.', occurredAt: '11:00', iconName: 'Users' },
    { id: 'ev-2', sessionId: '1', eventType: 'consent_granted', actorName: 'Paciente', description: 'Otorgó consentimiento para datos clínicos.', occurredAt: '11:01', iconName: 'Shield' },
    { id: 'ev-3', sessionId: '1', eventType: 'triage_recorded', actorName: 'Enfermería', description: 'Signos vitales tomados y triage asignado como C3.', occurredAt: '11:15', iconName: 'Layers' }
  ];

  return (
    <div className="space-y-6">
      {session ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Patient clinical summary + Timeline */}
          <div className="lg:col-span-4 space-y-6 animate-fade-in">
            {/* Clinical Summary card */}
            <div className="bg-white p-5 rounded-xl border border-brand-border space-y-3">
              <span className="text-[10px] bg-brand-primary text-white font-extrabold px-2.5 py-1 rounded border inline-block uppercase">
                Consulta Médica Activa
              </span>
              <h3 className="text-base font-extrabold text-brand-dark">{session.patientName}</h3>
              <p className="text-xs text-brand-text-secondary leading-normal font-semibold">
                Edad: <span className="font-medium text-brand-text-primary">{session.patientAge} años</span>
              </p>
              <p className="text-xs text-brand-text-secondary leading-normal font-semibold">
                Alergias Clínicas: <span className="bg-brand-coral-light/25 text-brand-coral-dark px-1.5 py-0.5 rounded text-[10px] font-extrabold">PENICILINA</span>
              </p>

              {/* Ficha rápida en el lateral de consulta médica */}
              <div className="border-t pt-2.5 mt-2.5 space-y-1.5 text-xs">
                <span className="text-[10px] text-brand-text-secondary uppercase block font-bold">Ficha de Admisión</span>
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

              {triage && (
                <div className="p-3 bg-brand-bg rounded-lg border border-brand-border/60 text-xs space-y-1">
                  <span className="font-extrabold text-brand-dark block">Categorización:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full block border"
                      style={{ backgroundColor: triage.colorHex }}
                    />
                    <strong className="text-brand-dark">{triage.triageLevel} - {triage.triageLevelName}</strong>
                  </div>
                  <p className="text-[10px] text-brand-text-secondary font-medium leading-normal italic mt-1">
                    "{triage.observations}"
                  </p>
                </div>
              )}

              {vitals && (
                <div className="grid grid-cols-2 gap-2 bg-brand-light/30 p-3 rounded-lg border border-brand-primary/10 text-[11px] leading-tight font-semibold">
                  <div>
                    <span className="text-brand-text-secondary font-medium block">Presión Art:</span>
                    <span className="text-brand-dark">{vitals.systolicPressure}/{vitals.diastolicPressure} mmHg</span>
                  </div>
                  <div>
                    <span className="text-brand-text-secondary font-medium block">Saturación O₂:</span>
                    <span className="text-brand-dark">{vitals.oxygenSaturation}%</span>
                  </div>
                  <div>
                    <span className="text-brand-text-secondary font-medium block">Temperatura:</span>
                    <span className="text-brand-dark">{vitals.temperature}°C</span>
                  </div>
                  <div>
                    <span className="text-brand-text-secondary font-medium block">Nivel Dolor:</span>
                    <span className="text-brand-coral-dark font-black">{vitals.painLevel}/10</span>
                  </div>
                </div>
              )}

              {/* Emergency Contact Share Section (with dynamic Patient Consent) */}
              <div className="border-t pt-3.5 mt-4 space-y-3 text-xs">
                <span className="font-extrabold text-brand-dark flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-turquoise" /> Envío de Comprobante a Contactos
                </span>
                <p className="text-[10px] text-brand-text-secondary leading-normal font-semibold">
                  Selecciona uno de los contactos de emergencia pre-registrados por el paciente en la app para solicitar la autorización de envío de comprobante:
                </p>

                <div className="space-y-1.5">
                  {preRegisteredContacts.map((contact) => (
                    <label
                      key={contact.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        selectedContactId === contact.id
                          ? 'bg-brand-light border-brand-primary'
                          : 'bg-brand-bg border-brand-border hover:bg-brand-light'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedContact"
                        value={contact.id}
                        checked={selectedContactId === contact.id}
                        onChange={() => setSelectedContactId(contact.id)}
                        className="text-brand-primary focus:ring-brand-primary"
                      />
                      <div className="font-medium text-[11px] leading-tight text-brand-dark">
                        <span className="font-bold">{contact.name}</span>{' '}
                        <span className="text-brand-text-secondary">({contact.relationship})</span>
                        <div className="text-[9px] text-brand-text-secondary font-semibold font-mono leading-none mt-0.5">
                          {contact.phone}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Consent Request flow trigger and status */}
                {(() => {
                  const selectedContact = preRegisteredContacts.find((c) => c.id === selectedContactId);
                  const activeConsent = consents.find(
                    (c) =>
                      c.consentType === 'share_with_contacts' &&
                      selectedContact &&
                      c.title.includes(selectedContact.name)
                  );

                  if (!activeConsent) {
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (onAddConsentRequest && selectedContact) {
                            onAddConsentRequest(
                              'share_with_contacts',
                              `Compartir Comprobante con ${selectedContact.name}`,
                              `¿Autorizas que el Dr. Andrés Soto comparta un comprobante de atención clínica con tu contacto de emergencia ${selectedContact.name} (${selectedContact.relationship}) al número ${selectedContact.phone}?`
                            );
                          }
                        }}
                        className="w-full py-2 bg-brand-primary hover:bg-brand-intermediate text-white font-black rounded-lg text-[10px] flex items-center justify-center gap-1 shadow-xs uppercase tracking-tight"
                      >
                        📬 Solicitar Consentimiento a Paciente
                      </button>
                    );
                  }

                  if (activeConsent.status === 'pending') {
                    return (
                      <div className="p-2.5 bg-brand-yellow-light/40 border border-brand-yellow/30 text-brand-yellow-dark rounded-lg font-bold text-[10px] space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="animate-spin text-xs">⏳</span>
                          <span>ESPERANDO CONSENTIMIENTO...</span>
                        </div>
                        <p className="font-medium text-[9px] text-brand-text-secondary leading-tight">
                          Se envió una solicitud de consentimiento a la pantalla de Ana María. Debe autorizar o denegar el envío de su comprobante de atención.
                        </p>
                      </div>
                    );
                  }

                  if (activeConsent.status === 'granted') {
                    return (
                      <div className="p-2.5 bg-brand-success-light border border-brand-success/20 text-brand-success rounded-lg font-bold text-[10px] space-y-1 animate-fade-in">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span>✅ ENVIADO Y CONSENTIDO</span>
                        </div>
                        <p className="font-medium text-[9px] text-brand-text-secondary leading-tight">
                          El comprobante con triage y estado fue enviado exitosamente a <strong>{selectedContact?.name}</strong>. Consentimiento otorgado por Ana María Torres.
                        </p>
                      </div>
                    );
                  }

                  // rejected or revoked
                  return (
                    <div className="p-2.5 bg-brand-coral-light/25 border border-brand-coral/20 text-brand-coral-dark rounded-lg font-bold text-[10px] space-y-1">
                      <div className="flex items-center gap-1">
                        <span>❌ ENVÍO RECHAZADO POR PACIENTE</span>
                      </div>
                      <p className="font-medium text-[9px] text-brand-coral-dark/80 leading-tight">
                        La paciente denegó el consentimiento. El comprobante no fue enviado para resguardar su derecho a la privacidad.
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Convocatoria (Llamado de Paciente) */}
              <div className="border-t pt-3.5 mt-4 space-y-2">
                <span className="text-[10px] text-brand-text-secondary uppercase block font-black flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-turquoise" /> Convocatoria a Box
                </span>
                <p className="text-[10px] text-brand-text-secondary leading-normal font-semibold">
                  Presiona para notificar al paciente a dónde debe dirigirse para su consulta:
                </p>
                <div className="space-y-1.5">
                  <select
                    value={callDest}
                    onChange={(e) => setCallDest(e.target.value)}
                    className="w-full p-2 bg-brand-bg border border-brand-border rounded-lg text-xs font-bold text-brand-dark outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="Box de Consulta Médica N° 3">Box de Consulta Médica N° 3</option>
                    <option value="Box de Emergencias N° 1">Box de Emergencias N° 1</option>
                    <option value="Sala de Procedimientos (Piso 2)">Sala de Procedimientos (Piso 2)</option>
                    <option value="Sala de Espera General">Sala de Espera General</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (onCallLocation) {
                        onCallLocation(callDest);
                        onSendMessage(`📢 LLAMADO A CONSULTA: Por favor diríjase de inmediato a: ${callDest}`, 'text');
                      }
                    }}
                    className={`w-full py-2 bg-brand-turquoise hover:bg-brand-turquoise-dark text-white font-black rounded-lg text-[10px] flex items-center justify-center gap-1.5 shadow-xs uppercase transition-all active:scale-95 ${
                      calledLocation === callDest ? 'bg-brand-success' : ''
                    }`}
                  >
                    {calledLocation === callDest ? '✓ Paciente Convocado' : '📢 Notificar Llamado'}
                  </button>
                  {calledLocation && (
                    <div className="p-2 bg-brand-yellow-light/50 border border-brand-yellow/30 text-brand-yellow-dark rounded-lg font-bold text-[9px] flex items-center justify-between">
                      <span className="truncate">Convocatoria activa: <strong>{calledLocation}</strong></span>
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

              <div className="border-t pt-3 mt-4">
                <button
                  onClick={() => setShowClosureModal(true)}
                  className="w-full py-2.5 bg-brand-coral hover:bg-brand-coral-dark text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  🔒 Cerrar Sesión Médica
                </button>
              </div>
            </div>

            {/* Consents Status */}
            <div className="bg-white p-5 rounded-xl border border-brand-border space-y-3">
              <h4 className="text-xs font-black text-brand-dark flex items-center gap-1.5 border-b pb-2">
                <Shield className="w-4 h-4 text-brand-primary" /> Consentimientos Otorgados
              </h4>
              <div className="space-y-2 text-xs leading-normal">
                {consents.map((c) => (
                  <div key={c.id} className="flex justify-between items-center bg-brand-bg p-2 rounded border">
                    <span className="font-semibold text-brand-dark">{c.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      c.status === 'granted' ? 'bg-brand-success-light text-brand-success' : 'bg-brand-coral-light/20 text-brand-coral-dark'
                    }`}>
                      {c.status === 'granted' ? 'Autorizado' : 'Rechazado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white p-5 rounded-xl border border-brand-border space-y-3">
              <h4 className="text-xs font-black text-brand-dark flex items-center gap-1.5 border-b pb-2">
                <History className="w-4 h-4 text-brand-primary" /> Línea de Tiempo de Atención
              </h4>
              <div className="space-y-3 text-xs leading-tight font-medium">
                {timelineEvents.map((ev) => (
                  <div key={ev.id} className="flex gap-2 border-l-2 border-brand-border pl-3.5 relative">
                    <div className="absolute -left-[6px] top-0.5 w-2.5 h-2.5 rounded-full bg-brand-turquoise" />
                    <div>
                      <span className="font-bold text-brand-dark block">{ev.occurredAt} - {ev.description}</span>
                      <span className="text-[10px] text-brand-text-secondary">Responsable: {ev.actorName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Clinical Note, Real-time Chat, Interpreter Controls */}
          <div className="lg:col-span-8 space-y-6">
            {/* Interpreter call block */}
            <div className="bg-white p-5 rounded-xl border border-brand-border space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5">
                    <Accessibility className="w-4 h-4 text-brand-primary" /> Intérprete Remoto de Lengua de Señas
                  </h3>
                  <p className="text-[11px] text-brand-text-secondary mt-0.5">
                    Solicita un intérprete matriculado de LSCh a través de videollamada para mediar la consulta médica.
                  </p>
                </div>

                {interpreterStatus === 'idle' && (
                  <button
                    onClick={() => {
                      setInterpreterStatus('requested');
                      setTimeout(() => setInterpreterStatus('assigned'), 3000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-intermediate transition-all"
                  >
                    Solicitar Intérprete
                  </button>
                )}
                {interpreterStatus === 'requested' && (
                  <span className="px-3 py-1.5 rounded-lg bg-brand-yellow-light text-brand-yellow-dark text-xs font-extrabold animate-pulse">
                    Buscando Intérprete...
                  </span>
                )}
                {interpreterStatus === 'assigned' && !videoActive && (
                  <button
                    onClick={() => setVideoActive(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-brand-success text-white text-xs font-bold hover:bg-brand-success/90 transition-all flex items-center gap-1 animate-bounce"
                  >
                    <Video className="w-4 h-4" /> Conectar Videollamada
                  </button>
                )}
              </div>

              {/* Simulated video frame */}
              {videoActive && (
                <div className="relative aspect-video rounded-xl bg-brand-dark overflow-hidden border border-brand-border flex items-center justify-center text-center p-6 text-white">
                  {/* Grid overlay */}
                  <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10 pointer-events-none">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="border border-brand-light" />
                    ))}
                  </div>

                  <div className="space-y-3 z-10">
                    <div className="w-10 h-10 bg-brand-success rounded-full flex items-center justify-center font-bold mx-auto animate-pulse">
                      👤
                    </div>
                    <p className="text-sm font-bold">CONECTADO: Juan Pérez (Intérprete Certificado LSCh)</p>
                    <p className="text-xs text-brand-light/70 max-w-sm mx-auto">
                      "Mediación en curso. Traduciendo en tiempo real para el Dr. Soto."
                    </p>
                    <button
                      onClick={() => setVideoActive(false)}
                      className="px-3 py-1 bg-brand-coral hover:bg-brand-coral-dark text-white rounded font-bold text-xs"
                    >
                      Desconectar
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-[10px] font-mono">
                    Provider: WebRTC Room SV-847291-INT
                  </div>
                </div>
              )}
            </div>

            {/* Real-time Chat clinically focused */}
            <div className="bg-white rounded-xl border border-brand-border overflow-hidden flex flex-col h-[380px]">
              <div className="p-3 bg-brand-dark text-white text-xs font-bold flex justify-between items-center">
                <span>💬 Diálogo con Paciente (Foco Clínico)</span>
                <span className="text-[10px] text-brand-turquoise font-mono font-bold">SV-847291</span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-brand-bg/40">
                {chatHistory.map((msg) => {
                  const isPatient = msg.senderType === 'patient';
                  const isSystem = msg.senderType === 'system';

                  if (isSystem) return null;

                  return (
                    <div key={msg.id} className={`flex ${isPatient ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-xl border ${
                          isPatient
                            ? 'bg-white text-brand-dark rounded-tl-none border-brand-border shadow-xs'
                            : 'bg-brand-light text-brand-dark rounded-tr-none border-brand-primary/10'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-0.5">
                          <span className="text-[9px] font-bold text-brand-primary block">
                            {isPatient ? msg.senderName : 'Tú (Médico)'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(msg.body)}
                            className="p-0.5 hover:bg-brand-bg rounded text-brand-text-secondary hover:text-brand-primary transition-all flex items-center justify-center"
                            title="Reproducir lectura por voz (TTS)"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
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
                  placeholder="Escribe indicaciones o explicaciones comprensibles..."
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

            {/* Clinical Notes Creator */}
            <div className="bg-white p-5 rounded-xl border border-brand-border space-y-4">
              <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5 border-b pb-3">
                <FileText className="w-4 h-4 text-brand-primary" /> Registro de Nota Clínica Firmada
              </h3>

              <form onSubmit={handleSignClinicalNote} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-brand-text-secondary">Tipo de Registro Clínico</label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as any)}
                      className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none"
                    >
                      <option value="impression">Impresión Diagnóstica Inicial</option>
                      <option value="diagnosis">Diagnóstico Diferencial</option>
                      <option value="treatment">Esquema Terapéutico</option>
                      <option value="medication">Medicamentos Administrados</option>
                      <option value="indication">Indicaciones de Alta Médica</option>
                    </select>
                  </div>
                  <div className="flex items-end text-[10px] text-brand-text-secondary leading-relaxed font-medium pb-1">
                    * El contenido registrado se encripta y consolida en el historial auditable de la red asistencial.
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-brand-text-secondary font-bold">Contenido de la Nota Médica</label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={4}
                    required
                    placeholder="Describe los hallazgos clínicos relevantes aquí..."
                    className="w-full p-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-brand-text-secondary font-medium italic">
                    Firmado como: Dr. Andrés Soto (Médico Urgenciólogo)
                  </span>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand-primary text-white font-bold rounded-lg text-xs hover:bg-brand-intermediate transition-all shadow-sm"
                  >
                    📝 Firmar Nota Médica
                  </button>
                </div>
              </form>

              {isSigned && (
                <div className="p-3 bg-brand-success-light/30 border border-brand-success/20 rounded-lg text-xs text-brand-success flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Nota clínica firmada con éxito. Guardada con hash SHA-256 en base de datos.
                </div>
              )}

              {/* Signed notes history block */}
              {notesHistory.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] uppercase text-brand-text-secondary font-bold block">Historial de Registros Firmados</span>
                  {notesHistory.map((n) => (
                    <div key={n.id} className="p-3 bg-brand-bg rounded-lg border text-xs leading-normal">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-extrabold text-brand-dark uppercase text-[10px]">
                          {n.noteType === 'impression' ? 'Impresión' : n.noteType === 'diagnosis' ? 'Diagnóstico' : 'Indicaciones'}
                        </span>
                        <span className="text-[10px] text-brand-text-secondary font-mono">{new Date(n.createdAt).toLocaleTimeString()} - ✓ Firmado</span>
                      </div>
                      <p className="text-brand-text-primary font-medium">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-center text-brand-text-secondary bg-brand-bg/40 rounded-xl border border-dashed border-brand-border">
          <AlertCircle className="w-10 h-10 text-brand-border mb-3" />
          <p className="text-sm max-w-sm font-semibold">
            Actualmente no hay ninguna atención clínica activa en el sistema. Solicita el inicio en Admisión o inicia sesión como Admisión para simular el caso de demostración.
          </p>
        </div>
      )}

      {/* 🔒 CLOSURE MEDICAL SESSION MODAL */}
      {showClosureModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full border border-brand-border shadow-2xl space-y-4 animate-scale-in text-xs font-semibold">
            <div className="flex justify-between items-start border-b pb-3">
              <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5">
                🔒 Cerrar Sesión de Atención SV-847291
              </h3>
              <button onClick={() => setShowClosureModal(false)} className="text-brand-text-secondary hover:text-brand-dark">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-brand-text-secondary leading-relaxed font-medium">
              Al cerrar la sesión, el chat quedará bloqueado de forma permanente, el código de acceso temporal expirará y se emitirá el resumen al paciente sordo.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-brand-dark">Motivo del Cierre</label>
                <select
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none"
                >
                  <option>Atención Completada con Éxito</option>
                  <option>Derivado a Centro de Alta Complejidad</option>
                  <option>Abandono voluntario del paciente</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-brand-dark">Resumen de Egreso Clinico</label>
                <textarea
                  value={closureSummary}
                  onChange={(e) => setClosureSummary(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowClosureModal(false)}
                className="flex-1 py-2.5 bg-brand-bg border text-brand-text-secondary font-bold rounded-lg hover:bg-brand-light"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onCloseSession(closureReason, closureSummary);
                  setShowClosureModal(false);
                }}
                className="flex-1 py-2.5 bg-brand-coral hover:bg-brand-coral-dark text-white font-bold rounded-lg shadow-sm"
              >
                Confirmar Cierre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
