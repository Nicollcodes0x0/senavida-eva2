/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getPictogramEmoji } from './PatientView';
import { MedicalSession, VitalSigns, TriageRecord, ChatMessage } from '../types';
import { mockPatient } from '../data/mockData';
import { Heart, Activity, Thermometer, ShieldAlert, CheckCircle2, ArrowRight, Layers, Send, Volume2, Users } from 'lucide-react';

interface DashboardCategorizacionProps {
  session: MedicalSession | null;
  onAdvanceStage: (stage: string) => void;
  onRecordVitals: (vitals: VitalSigns) => void;
  onRecordTriage: (triage: TriageRecord) => void;
  chatHistory: ChatMessage[];
  onSendMessage: (body: string, type: 'text' | 'pictogram' | 'quick_message') => void;
  calledLocation?: string | null;
  onCallLocation?: (loc: string | null) => void;
  highContrast?: boolean;
}

export const DashboardCategorizacion: React.FC<DashboardCategorizacionProps> = ({
  session,
  onAdvanceStage,
  onRecordVitals,
  onRecordTriage,
  chatHistory,
  onSendMessage,
  calledLocation,
  onCallLocation,
  highContrast = false
}) => {
  // Vital signs inputs
  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [temperature, setTemperature] = useState(36.5);
  const [oxygen, setOxygen] = useState(98);
  const [heartRate, setHeartRate] = useState(72);
  const [respRate, setRespRate] = useState(16);
  const [painLevel, setPainLevel] = useState(4);
  const [vitalsNotes, setVitalsNotes] = useState('');

  // Triage state
  const [selectedTriage, setSelectedTriage] = useState<'C1' | 'C2' | 'C3' | 'C4' | 'C5'>('C3');
  const [triageNotes, setTriageNotes] = useState('Paciente con dolor de cabeza persistente e hipertermia leve.');
  const [vitalsSaved, setVitalsSaved] = useState(false);
  const [triageSaved, setTriageSaved] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [callDest, setCallDest] = useState('Sala de Categorización (Box A)');

  const triageLevels = [
    { code: 'C1' as const, name: 'Reanimación (Rojo)', hex: '#D95555', desc: 'Riesgo vital inminente. Paro cardiorespiratorio o shock severo.' },
    { code: 'C2' as const, name: 'Emergencia (Naranja)', hex: '#E8B949', desc: 'Riesgo de secuela grave o inestabilidad hemodinámica latente.' },
    { code: 'C3' as const, name: 'Urgencia Mediana (Amarillo)', hex: '#9B6F08', desc: 'Condición aguda, requiere valoración diagnóstica rápida.' },
    { code: 'C4' as const, name: 'Consulta General (Verde)', hex: '#3CA67C', desc: 'Paciente estable sin riesgo fisiológico evidente.' },
    { code: 'C5' as const, name: 'No Urgente (Azul)', hex: '#176B87', desc: 'Patología de larga data o afección no aguda.' }
  ];

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    // Ranges check from backend guide
    if (temperature < 30 || temperature > 45) {
      alert('Error de validación clínica: La temperatura debe oscilar entre 30 y 45°C.');
      return;
    }
    if (oxygen < 0 || oxygen > 100) {
      alert('Error de validación clínica: La saturación de oxígeno debe estar en el rango 0-100%.');
      return;
    }
    if (heartRate < 20 || heartRate > 250) {
      alert('Error de validación clínica: Frecuencia cardíaca fuera de rangos de supervivencia (20-250 lpm).');
      return;
    }

    const vitalsObj: VitalSigns = {
      id: 'vit-' + Date.now(),
      sessionId: session.id,
      recordedBy: 'Enfermera Universitaria',
      systolicPressure: systolic,
      diastolicPressure: diastolic,
      temperature,
      oxygenSaturation: oxygen,
      heartRate,
      respiratoryRate: respRate,
      painLevel,
      measuredAt: new Date().toISOString(),
      notes: vitalsNotes
    };

    onRecordVitals(vitalsObj);
    setVitalsSaved(true);
  };

  const handleSaveTriage = () => {
    if (!session) return;
    const levelInfo = triageLevels.find((t) => t.code === selectedTriage)!;

    const triageObj: TriageRecord = {
      id: 'tr-' + Date.now(),
      sessionId: session.id,
      recordedBy: 'Enfermero de Turno',
      triageLevel: selectedTriage,
      triageLevelName: levelInfo.name,
      colorHex: levelInfo.hex,
      symptoms: ['Cefalea', 'Mareos', 'Náuseas'],
      observations: triageNotes,
      completedAt: new Date().toISOString()
    };

    onRecordTriage(triageObj);
    setTriageSaved(true);

    // Automatic chat message to the patient with next steps
    onSendMessage(
      `Fase de Categorización Completada con éxito. Nivel asignado: ${levelInfo.name}. Su registro ha sido guardado de forma permanente en su historial. Por favor, tome asiento y espere en la Sala de Espera General. Se le notificará por medio de esta aplicación cuando el médico esté listo para atenderle en su Box de Consulta.`,
      'text'
    );
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim(), 'text');
    setChatInput('');
  };

  return (
    <div className="space-y-6">
      {session ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Patient Details Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-brand-border space-y-3">
              <span className="text-[10px] bg-brand-yellow-light text-brand-yellow-dark font-extrabold px-2.5 py-1 rounded border border-brand-yellow/10 inline-block uppercase">
                Fase de Categorización
              </span>
              <h3 className="text-base font-extrabold text-brand-dark">{session.patientName}</h3>
              <p className="text-xs text-brand-text-secondary leading-normal font-semibold">
                Edad: <span className="font-normal text-brand-text-primary">{session.patientAge} años</span>
              </p>
              <p className="text-xs text-brand-text-secondary leading-normal font-semibold">
                Preferencia: <span className="font-normal text-brand-text-primary">{session.communicationPreference}</span>
              </p>
              <p className="text-xs text-brand-text-secondary leading-normal font-semibold">
                Alergias: <span className="bg-brand-coral-light/30 text-brand-coral-dark px-1.5 py-0.5 rounded text-[10px] font-extrabold">PENICILINA</span>
              </p>

              {/* Ficha rápida en el lateral de categorización activa */}
              <div className="border-t pt-2.5 mt-2.5 space-y-1.5 text-xs">
                <span className="text-[10px] text-brand-text-secondary uppercase block font-bold">Datos del Paciente</span>
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

              <div className="border-t pt-3 mt-4 space-y-2">
                <span className="text-[10px] text-brand-text-secondary uppercase block font-bold">Transferencia Clínica</span>
                <button
                  onClick={() => {
                    if (!vitalsSaved || !triageSaved) {
                      alert('Recomendación: Asegúrate de guardar los signos vitales y categorizar el riesgo antes de derivar al médico.');
                    }
                    onAdvanceStage('Consulta Médica');
                  }}
                  className="w-full py-2.5 bg-brand-primary hover:bg-brand-intermediate text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  Derivar a Consulta Médica <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Convocatoria (Llamado de Paciente) */}
              <div className="border-t pt-3.5 space-y-2">
                <span className="text-[10px] text-brand-text-secondary uppercase block font-black flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-turquoise" /> Convocatoria de Paciente
                </span>
                <p className="text-[10px] text-brand-text-secondary leading-normal font-semibold">
                  Selecciona la ubicación y presiona para alertar visualmente al paciente en su aplicación:
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
                    <option value="Box de Emergencias">Box de Emergencias</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (onCallLocation) {
                        onCallLocation(callDest);
                        // Send system notification in the chat too
                        onSendMessage(`📢 LLAMADO A PACIENTE: Por favor diríjase a: ${callDest}`, 'text');
                      }
                    }}
                    className={`w-full py-2.5 font-extrabold rounded-lg text-[10px] flex items-center justify-center gap-1.5 shadow-xs uppercase transition-all active:scale-95 ${
                      calledLocation === callDest
                        ? 'bg-brand-success text-white'
                        : 'bg-brand-turquoise hover:bg-brand-turquoise-dark text-white'
                    }`}
                  >
                    {calledLocation === callDest ? '✓ Llamado Activo' : '📢 Notificar Llamado'}
                  </button>
                  {calledLocation && (
                    <div className="p-2 bg-brand-yellow-light/50 border border-brand-yellow/30 text-brand-yellow-dark rounded-lg font-bold text-[9px] flex items-center justify-between">
                      <span className="truncate">Llamado activo a: <strong>{calledLocation}</strong></span>
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

            {/* Chat Box Mini */}
            <div className="bg-white rounded-xl border border-brand-border overflow-hidden flex flex-col h-[460px]">
              <div className="p-2.5 bg-brand-dark text-white text-[11px] font-bold flex justify-between items-center">
                <span>💬 Diálogo Clínico de Urgencia</span>
                <span className="text-brand-turquoise font-mono font-bold">SV-847291</span>
              </div>
              <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-brand-bg/20 text-[11px]">
                {chatHistory.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderType === 'patient' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`p-2 rounded-lg ${msg.senderType === 'patient' ? 'bg-white border' : 'bg-brand-light'}`}>
                      <p className="font-bold text-brand-primary text-[9px] mb-0.5">{msg.senderName}</p>
                      <p className="font-medium text-brand-dark">{msg.body}</p>
                      {msg.messageType === 'pictogram' && (
                        <div className="mt-1 inline-flex items-center gap-1 bg-brand-success-light text-brand-turquoise-dark px-1.5 py-0.5 rounded text-[9px] font-bold">
                          <span className="text-xs">{getPictogramEmoji(msg.pictogramPath || '')}</span> Pictograma
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="p-2 border-t bg-white flex gap-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribir mensaje..."
                  className="flex-1 h-8 px-2 bg-brand-bg rounded border text-[11px] font-semibold outline-none focus:ring-1 focus:ring-brand-primary"
                />
                <button type="submit" className="h-8 px-2.5 bg-brand-primary text-white rounded text-[10px] font-bold">Envia</button>
              </form>
            </div>
          </div>

          {/* Vital Signs Forms & Triage Levels selection */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Vital Signs */}
            <div className="bg-white p-5 rounded-xl border border-brand-border space-y-4">
              <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5 border-b pb-3">
                <Thermometer className="w-4 h-4 text-brand-primary" /> Captura de Signos Vitales
              </h3>

              <form onSubmit={handleSaveVitals} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block mb-1 text-brand-text-secondary">PA Sistólica (mmHg)</label>
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-brand-text-secondary">PA Diastólica (mmHg)</label>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-brand-text-secondary">Temperatura (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-brand-text-secondary">Saturación O₂ (%)</label>
                    <input
                      type="number"
                      value={oxygen}
                      onChange={(e) => setOxygen(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-brand-text-secondary">Frecuencia Cardíaca (lpm)</label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-brand-text-secondary">Frecuencia Respiratoria (rpm)</label>
                    <input
                      type="number"
                      value={respRate}
                      onChange={(e) => setRespRate(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-brand-text-secondary">Escala del Dolor (0 al 10)</label>
                    <select
                      value={painLevel}
                      onChange={(e) => setPainLevel(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold focus:ring-2 focus:ring-brand-primary outline-none"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                        <option key={v} value={v}>
                          {v} {v === 0 ? '- Sin Dolor' : v === 10 ? '- Peor Dolor Posible' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-brand-text-secondary">Observaciones de Signos Vitales</label>
                  <input
                    type="text"
                    value={vitalsNotes}
                    onChange={(e) => setVitalsNotes(e.target.value)}
                    placeholder="Ej. Paciente cooperadora, manifiesta dolor que se incrementa al respirar..."
                    className="w-full h-10 px-3 bg-brand-bg rounded-lg border border-brand-border text-xs font-semibold focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-brand-text-secondary font-medium leading-none">
                    * Todos los parámetros se guardan con firma digital del operador.
                  </span>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand-primary text-white font-bold rounded-lg text-xs hover:bg-brand-intermediate transition-all shadow-sm"
                  >
                    Guardar Signos Vitales
                  </button>
                </div>
              </form>

              {vitalsSaved && (
                <div className="p-3 bg-brand-success-light/30 border border-brand-success/20 rounded-lg text-xs text-brand-success flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Signos vitales capturados y firmados con éxito en la línea de tiempo.
                </div>
              )}
            </div>

            {/* 2. Triage Priority */}
            <div className="bg-white p-5 rounded-xl border border-brand-border space-y-4">
              <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5 border-b pb-3">
                <Layers className="w-4 h-4 text-brand-primary" /> Categorización de Urgencia (DAU)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                {triageLevels.map((lvl) => (
                  <button
                    key={lvl.code}
                    onClick={() => setSelectedTriage(lvl.code)}
                    className={`p-3.5 rounded-xl border text-center transition-all ${
                      selectedTriage === lvl.code
                        ? 'bg-brand-light text-brand-primary border-brand-primary ring-2 ring-brand-primary/20'
                        : 'bg-white border-brand-border hover:bg-brand-bg'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full mx-auto mb-2 block border shadow-inner"
                      style={{ backgroundColor: lvl.hex }}
                    />
                    <span className="text-sm font-extrabold block leading-none">{lvl.code}</span>
                    <span className="text-[9px] text-brand-text-secondary block mt-1 leading-normal font-semibold">
                      {lvl.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Triage Info Description Box */}
              <div className="p-4 bg-brand-bg rounded-xl border border-brand-border text-xs leading-relaxed font-semibold">
                <span className="text-brand-dark block text-xs font-bold mb-1">
                  Nivel Asignado: {triageLevels.find((t) => t.code === selectedTriage)!.name}
                </span>
                <p className="text-brand-text-secondary font-medium">
                  {triageLevels.find((t) => t.code === selectedTriage)!.desc}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block mb-1 text-xs text-brand-text-secondary font-bold">Fundamento de Categorización</label>
                  <textarea
                    value={triageNotes}
                    onChange={(e) => setTriageNotes(e.target.value)}
                    rows={2}
                    className="w-full p-3 bg-brand-bg rounded-lg border border-brand-border text-xs font-semibold focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveTriage}
                    className="px-5 py-2.5 bg-brand-primary text-white font-bold rounded-lg text-xs hover:bg-brand-intermediate transition-all shadow-sm"
                  >
                    Confirmar Categorización
                  </button>
                </div>
              </div>

              {triageSaved && (
                <div className="p-3 bg-brand-success-light/30 border border-brand-success/20 rounded-lg text-xs text-brand-success flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Nivel de categorización guardado con éxito. El caso está listo para el médico de cabecera.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-center text-brand-text-secondary bg-brand-bg/40 rounded-xl border border-dashed border-brand-border">
          <ShieldAlert className="w-10 h-10 text-brand-border mb-3" />
          <p className="text-sm max-w-sm font-semibold">
            Actualmente no hay ninguna atención clínica activa en el sistema. Solicita el inicio en Admisión o inicia sesión como Admisión para simular el caso de demostración.
          </p>
        </div>
      )}
    </div>
  );
};
