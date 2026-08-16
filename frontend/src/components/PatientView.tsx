/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { mockPictograms, mockCategories, mockQuickMessages, mockPatient } from '../data/mockData';
import { ChatMessage, ConsentRequest } from '../types';
import { Shield, Sparkles, Send, Volume2, Accessibility, MessageSquare, Hand, Check, AlertCircle, Pencil, Eraser, Trash2, Camera, Video, Zap } from 'lucide-react';

interface PatientViewProps {
  sessionConsents: ConsentRequest[];
  onConsentToggle: (consentId: string, status: 'granted' | 'rejected') => void;
  chatHistory: ChatMessage[];
  onSendMessage: (body: string, type: 'text' | 'pictogram' | 'quick_message', picId?: string) => void;
  calledLocation?: string | null;
  onClearCallLocation?: () => void;
  highContrast?: boolean;
}

export const getPictogramEmoji = (id: string): string => {
  switch (id) {
    // DOLOR
    case 'pic-101': return '🤕'; // Dolor de cabeza (Head with bandage)
    case 'pic-102': return '🫀'; // Dolor de pecho (Heart/Anatomy)
    case 'pic-103': return '🤢'; // Dolor de estómago (Nausea/Stomach discomfort)
    case 'pic-104': return '💥'; // Mucho dolor (Explosion/Intense)
    case 'pic-105': return '🗣️'; // Dolor de garganta (Speaking/Throat area)
    
    // SÍNTOMAS
    case 'pic-201': return '🌡️'; // Tengo fiebre (Thermometer)
    case 'pic-202': return '😵'; // Tengo mareos (Dizzy face)
    case 'pic-203': return '🤮'; // Tengo náuseas / Vómito (Vomiting face)
    case 'pic-204': return '🫁'; // Dificultad al respirar (Lungs)
    case 'pic-205': return '🥶'; // Tengo frío (Cold face)
    
    // NECESIDADES
    case 'pic-301': return '🚽'; // Ir al baño (Toilet)
    case 'pic-302': return '💧'; // Necesito agua (Water droplet)
    case 'pic-303': return '🤟'; // Intérprete LSCh (Love-you sign / Signing hand)
    case 'pic-304': return '📞'; // Contactar familia (Telephone receiver)
    case 'pic-305': return '🪑'; // Sentarse (Chair)
    
    // INFO MÉDICA
    case 'pic-401': return '⚠️'; // Tengo alergia (Warning sign)
    case 'pic-402': return '💊'; // Tomo remedios (Pill/Medicine)
    case 'pic-403': return '🤰'; // Embarazo (Pregnant woman)
    case 'pic-404': return '🩸'; // Diabetes (Blood drop)
    
    // RESPUESTAS
    case 'pic-501': return '✅'; // Sí (Check mark)
    case 'pic-502': return '❌'; // No (Cross mark)
    case 'pic-503': return '🤔'; // No entiendo (Thinking face)
    case 'pic-504': return '📝'; // Escribir (Memo/Writing)
    
    default: return '🏥'; // Fallback
  }
};

export const PatientView: React.FC<PatientViewProps> = ({
  sessionConsents,
  onConsentToggle,
  chatHistory,
  onSendMessage,
  calledLocation,
  onClearCallLocation,
  highContrast = false
}) => {
  const [activeCategory, setActiveCategory] = useState('cat-1');
  const [inputText, setInputText] = useState('');
  const [selectedPicId, setSelectedPicId] = useState<string | null>(null);
  const [showChatQuickMessages, setShowChatQuickMessages] = useState(false);

  // Sub tabs inside "🎨 Dibujos / Señas"
  const [subTab, setSubTab] = useState<'pizarra' | 'señas' | 'pictogramas'>('pizarra');

  // Canvas State for Pizarra de Dibujo
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#0d9488'); // default teal
  const [brushWidth, setBrushWidth] = useState(4);
  const [canvasText, setCanvasText] = useState('');
  const [isEraser, setIsEraser] = useState(false);

  // Sign Language Camera Simulator State
  const [cameraActive, setCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedSign, setDetectedSign] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  const handlePlayAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CL'; // Chilean Spanish
      window.speechSynthesis.speak(utterance);
    }
  };

  // Automatically trigger vocal/auditory cue when active calling location is set/updated
  React.useEffect(() => {
    if (calledLocation) {
      handlePlayAudio(`Atención por favor. Has sido llamada. Por favor dirígete a la ubicación: ${calledLocation}`);
    }
  }, [calledLocation]);

  const [activeTab, setActiveTab] = useState<'pictograms' | 'chat' | 'consents'>('pictograms');
  const [showFicha, setShowFicha] = useState(false);

  // Coordinate helper for Canvas Drawing
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : brushColor;
    ctx.lineWidth = brushWidth;

    const coords = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    const coords = getCoordinates(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSendDrawing = () => {
    const textToSend = canvasText.trim() || 'Dibujo de Pizarra';
    onSendMessage(`🎨 [Dibujo de Pizarra]: "${textToSend}"`, 'text');
    handlePlayAudio(`Mensaje de dibujo o pizarra: ${textToSend}`);
    setCanvasText('');
    handleClearCanvas();
  };

  const simulateAISignDetection = (signText: string) => {
    setIsAnalyzing(true);
    setDetectedSign(null);
    setConfidence(null);
    setTimeout(() => {
      setIsAnalyzing(false);
      setDetectedSign(signText);
      setConfidence(0.92 + Math.random() * 0.07);
      // Speak the detected sign automatically so medical staff can hear!
      handlePlayAudio(`Seña detectada: ${signText}`);
    }, 1200);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), 'text');
    setInputText('');
  };

  const handleSendQuick = (phrase: string) => {
    onSendMessage(phrase, 'quick_message');
    handlePlayAudio(phrase);
    setShowChatQuickMessages(false);
  };

  const handleSendPictogram = (picId: string, phrase: string) => {
    onSendMessage(phrase, 'pictogram', picId);
    handlePlayAudio(phrase);
    setSelectedPicId(picId);
    setTimeout(() => setSelectedPicId(null), 1500);
  };

  return (
    <div className={`min-h-[80vh] ${highContrast ? 'bg-black text-yellow-400' : 'bg-[#EAF6FA] text-brand-text-primary'} p-4`}>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header section optimized for the deaf patient */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">
              👤
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-brand-dark">Hola, Ana María Torres</h2>
              <span className="text-xs text-brand-text-secondary leading-none">Preferencia: Señas LSCh y Texto</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-brand-text-secondary uppercase">CÓDIGO ACTIVO:</span>
            <span className="bg-brand-primary text-white px-3 py-1 rounded-lg text-xs font-black shadow-sm font-mono tracking-wider animate-pulse">
              SV-847291
            </span>
          </div>
        </div>

        {/* Collapsible Registered Patient Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
          <button
            onClick={() => setShowFicha(!showFicha)}
            className="w-full px-4 py-3 bg-brand-light/30 hover:bg-brand-light/70 transition-all flex items-center justify-between font-bold text-xs text-brand-primary"
          >
            <span className="flex items-center gap-1.5">
              📋 {showFicha ? 'Ocultar mis Datos de Registro' : 'Ver mis Datos de Registro (RUT, Previsión, etc.)'}
            </span>
            <span>{showFicha ? '▲' : '▼'}</span>
          </button>
          
          {showFicha && (
            <div className="p-4 border-t border-brand-border bg-white text-xs space-y-3 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-brand-dark">
                <div className="bg-brand-bg p-2.5 rounded-lg border border-brand-border/40">
                  <span className="text-[10px] text-brand-text-secondary uppercase block font-bold mb-0.5">Identificación (RUT)</span>
                  <span className="font-mono font-bold text-xs">{mockPatient.rut}</span>
                </div>
                <div className="bg-brand-bg p-2.5 rounded-lg border border-brand-border/40">
                  <span className="text-[10px] text-brand-text-secondary uppercase block font-bold mb-0.5">Fecha de Nacimiento</span>
                  <span className="font-semibold text-xs">{mockPatient.birthDate} ({mockPatient.age} años)</span>
                </div>
                <div className="bg-brand-bg p-2.5 rounded-lg border border-brand-border/40">
                  <span className="text-[10px] text-brand-text-secondary uppercase block font-bold mb-0.5">Previsión de Salud</span>
                  <span className="font-semibold text-xs">{mockPatient.prevision}</span>
                </div>
                <div className="bg-brand-bg p-2.5 rounded-lg border border-brand-border/40">
                  <span className="text-[10px] text-brand-text-secondary uppercase block font-bold mb-0.5">CESFAM al que Pertenece</span>
                  <span className="font-semibold text-xs">{mockPatient.cesfam}</span>
                </div>
                <div className="bg-brand-bg p-2.5 rounded-lg border border-brand-border/40">
                  <span className="text-[10px] text-brand-text-secondary uppercase block font-bold mb-0.5">Teléfono o Celular</span>
                  <span className="font-mono font-bold text-xs">{mockPatient.phone}</span>
                </div>
                <div className="bg-brand-bg p-2.5 rounded-lg border border-brand-border/40 sm:col-span-2">
                  <span className="text-[10px] text-brand-text-secondary uppercase block font-bold mb-0.5">Dirección Particular</span>
                  <span className="font-semibold text-xs">{mockPatient.address}</span>
                </div>
              </div>
              <p className="text-[10px] text-brand-text-secondary font-medium leading-normal italic text-center">
                🔒 Esta ficha es la copia digitalizada de tu registro clínico y está sincronizada en tiempo real con la ventanilla de admisión y el personal médico.
              </p>
            </div>
          )}
        </div>

        {/* Real-time Paging Call Notification Banner */}
        {calledLocation && (
          <div className="bg-brand-turquoise-light/40 border-4 border-brand-turquoise p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-brand-turquoise text-white flex items-center justify-center text-3xl animate-pulse shrink-0">
                  📢
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-brand-turquoise-dark uppercase tracking-wider flex items-center gap-1.5">
                    🔔 ¡HAS SIDO LLAMADO! / YOU ARE CALLED!
                  </h3>
                  <p className="text-xs text-brand-text-secondary font-semibold">
                    Por favor, dirígete de inmediato a la siguiente ubicación indicada:
                  </p>
                  <div className="p-3 bg-white border border-brand-turquoise/30 rounded-xl inline-block mt-1">
                    <p className="text-xl md:text-2xl font-black text-brand-dark tracking-tight flex items-center gap-2">
                      👉 <span className="text-brand-turquoise">{calledLocation}</span> 👈
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handlePlayAudio(`Atención por favor. Has sido llamada. Por favor dirígete a la ubicación: ${calledLocation}`)}
                  className="px-4 py-3 bg-brand-primary hover:bg-brand-intermediate text-white rounded-xl text-xs font-black shadow flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Volume2 className="w-4 h-4" /> Escuchar Voz (TTS) 🔊
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearCallLocation) onClearCallLocation();
                  }}
                  className="px-4 py-3 bg-brand-success hover:bg-brand-success-dark text-white rounded-xl text-xs font-black shadow flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" /> Entendido, Voy 👍
                </button>
              </div>
            </div>
            
            {/* Visual accessibility explanation */}
            <div className="bg-white p-3 rounded-lg border border-brand-border flex items-center gap-3">
              <span className="text-xl">🫵🏃‍♂️🏥</span>
              <p className="text-[10px] text-brand-text-secondary leading-normal font-bold">
                Aviso de Accesibilidad: Hemos enviado esta alerta de forma síncrona a tu aplicación para que no tengas que estar pendiente de llamados por voz o pantallas lejanas. Presiona <strong>"Entendido, Voy"</strong> para confirmar recepción al personal médico.
              </p>
            </div>
          </div>
        )}

        {/* Real-time Pending Consent Banner for Emergency Contact Share */}
        {(() => {
          const pendingShareConsent = sessionConsents.find(
            (c) => c.consentType === 'share_with_contacts' && c.status === 'pending'
          );

          if (!pendingShareConsent) return null;

          return (
            <div className="bg-brand-yellow-light border-2 border-brand-yellow p-4 rounded-xl shadow-md space-y-3 animate-pulse">
              <div className="flex items-start gap-2.5">
                <span className="text-2xl">🔔</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-brand-yellow-dark uppercase tracking-tight flex items-center gap-1.5">
                    Solicitud de Consentimiento en Curso (Control del Paciente)
                  </h4>
                  <p className="text-xs text-brand-dark leading-relaxed font-bold">
                    {pendingShareConsent.description}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onConsentToggle(pendingShareConsent.id, 'rejected')}
                  className="px-4 py-2 bg-brand-coral hover:bg-brand-coral-dark text-white rounded-lg text-xs font-black shadow-xs transition-all active:scale-95"
                >
                  No Autorizar Envío
                </button>
                <button
                  type="button"
                  onClick={() => onConsentToggle(pendingShareConsent.id, 'granted')}
                  className="px-4 py-2 bg-brand-success hover:bg-brand-success/90 text-white rounded-lg text-xs font-black shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  ✓ Sí, Autorizar y Compartir
                </button>
              </div>
            </div>
          );
        })()}

        {/* Permanent Accessibility Notice about reading comprehension barriers */}
        <div className="bg-white rounded-xl p-4 border border-brand-border text-xs leading-relaxed flex items-start gap-2.5">
          <span className="text-lg">💡</span>
          <div>
            <h4 className="font-extrabold text-brand-dark mb-0.5">Nota de Accesibilidad e Inclusión</h4>
            <p className="text-brand-text-secondary font-medium">
              Recuerda: <strong>no todas las personas sordas leen o escriben el español con fluidez</strong>. Para muchos, la Lengua de Señas y los pictogramas visuales son sus lenguas principales. Si deseas escuchar el texto escrito, presiona el icono del parlante <Volume2 className="w-3.5 h-3.5 inline text-brand-primary" /> para que la app reproduzca lo escrito en voz alta.
            </p>
          </div>
        </div>

        {/* PORTAL NAV FOR THE PATIENT (LARGE TARGETS) */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('pictograms')}
            className={`py-3.5 px-3 rounded-xl text-xs font-black transition-all border flex flex-col items-center gap-1 shadow-sm ${
              activeTab === 'pictograms'
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white text-brand-dark border-brand-border hover:bg-brand-light'
            }`}
          >
            <span className="text-xl">🎨</span> Dibujos / Señas
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3.5 px-3 rounded-xl text-xs font-black transition-all border flex flex-col items-center gap-1 shadow-sm ${
              activeTab === 'chat'
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white text-brand-dark border-brand-border hover:bg-brand-light'
            }`}
          >
            <span className="text-xl">💬</span> Conversación
          </button>
          <button
            onClick={() => setActiveTab('consents')}
            className={`py-3.5 px-3 rounded-xl text-xs font-black transition-all border flex flex-col items-center gap-1 shadow-sm ${
              activeTab === 'consents'
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white text-brand-dark border-brand-border hover:bg-brand-light'
            }`}
          >
            <span className="text-xl">🛡️</span> Mis Permisos
          </button>
        </div>

        {/* TAB CONTENTS */}

        {/* 1. PICTOGRAMS & FAST BUTTONS */}
        {activeTab === 'pictograms' && (
          <div className="space-y-4 animate-fade-in">
            {/* SUB-TAB BAR FOR DIBUJOS, SEÑAS, PICTOGRAMAS */}
            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-brand-border flex flex-col sm:flex-row gap-2 justify-between">
              <button
                type="button"
                onClick={() => setSubTab('pizarra')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  subTab === 'pizarra'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'bg-brand-bg text-brand-text-secondary hover:bg-brand-light'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" /> 🎨 Pizarra de Dibujo
              </button>
              <button
                type="button"
                onClick={() => setSubTab('señas')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  subTab === 'señas'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'bg-brand-bg text-brand-text-secondary hover:bg-brand-light'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> 📹 Traductor de Señas
              </button>
              <button
                type="button"
                onClick={() => setSubTab('pictogramas')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  subTab === 'pictogramas'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'bg-brand-bg text-brand-text-secondary hover:bg-brand-light'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> 🏥 Mensajes y Pictogramas
              </button>
            </div>

            {/* A. PIZARRA DE DIBUJO INTERACTIVA */}
            {subTab === 'pizarra' && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-border space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <h3 className="text-xs font-black text-brand-dark flex items-center gap-1">
                      🎨 Pizarra de Dibujo Clínico
                    </h3>
                    <p className="text-[10px] text-brand-text-secondary">Dibuja o escribe con tu dedo/mouse para comunicarte de forma visual.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCanvas}
                    className="p-2 text-brand-coral hover:bg-brand-coral-light/20 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpiar Lienzo
                  </button>
                </div>

                {/* Canvas Area */}
                <div className="relative border border-dashed border-brand-border rounded-xl bg-slate-50 overflow-hidden flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={240}
                    onMouseDown={handleStartDrawing}
                    onMouseMove={handleDrawing}
                    onMouseUp={handleStopDrawing}
                    onMouseLeave={handleStopDrawing}
                    onTouchStart={handleStartDrawing}
                    onTouchMove={handleDrawing}
                    onTouchEnd={handleStopDrawing}
                    className="cursor-crosshair bg-white shadow-inner max-w-full rounded-lg"
                    style={{ touchAction: 'none' }}
                  />
                </div>

                {/* Brush Settings */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-brand-text-secondary uppercase">Herramientas:</span>
                    <button
                      type="button"
                      onClick={() => setIsEraser(false)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 ${
                        !isEraser
                          ? 'bg-brand-primary text-white'
                          : 'bg-brand-bg text-brand-text-secondary border hover:bg-brand-light'
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Lápiz
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEraser(true)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 ${
                        isEraser
                          ? 'bg-brand-primary text-white'
                          : 'bg-brand-bg text-brand-text-secondary border hover:bg-brand-light'
                      }`}
                    >
                      <Eraser className="w-3.5 h-3.5" /> Borrador
                    </button>
                  </div>

                  {!isEraser && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-brand-text-secondary uppercase mr-1">Colores:</span>
                      {[
                        { color: '#0d9488', name: 'Verde/Teal' },
                        { color: '#f43f5e', name: 'Rojo/Coral' },
                        { color: '#3b82f6', name: 'Azul' },
                        { color: '#1e293b', name: 'Gris Oscuro' }
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => setBrushColor(c.color)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            brushColor === c.color ? 'border-brand-dark scale-110 shadow-sm' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-brand-text-secondary uppercase mr-1">Grosor:</span>
                    {[2, 4, 8].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setBrushWidth(size)}
                        className={`w-6 h-6 rounded-md border text-[10px] font-bold flex items-center justify-center transition-all ${
                          brushWidth === size ? 'bg-brand-dark text-white' : 'bg-white hover:bg-brand-light'
                        }`}
                      >
                        {size}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explicación y botón de TTS */}
                <div className="space-y-2 mt-4 pt-3 border-t">
                  <label className="block text-xs font-black text-brand-dark">
                    🗣️ Traducir dibujo o escribir explicación para hablar en voz alta:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={canvasText}
                      onChange={(e) => setCanvasText(e.target.value)}
                      placeholder="Ej: Me duele mucho la garganta al tragar, o dibuja la zona afectada..."
                      className="flex-1 h-12 px-3 bg-brand-bg rounded-xl border border-brand-border text-xs font-semibold focus:ring-2 focus:ring-brand-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(canvasText || 'Por favor mire lo que dibujé en la pizarra')}
                      className="h-12 px-4 bg-brand-turquoise hover:bg-brand-turquoise-dark text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shrink-0 transition-all active:scale-95"
                      title="Reproducir explicación en voz alta para el personal"
                    >
                      <Volume2 className="w-4 h-4 animate-bounce" /> 🔊 Escuchar Pizarra
                    </button>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSendDrawing}
                      className="px-5 py-2.5 bg-brand-primary hover:bg-brand-intermediate text-white rounded-xl text-xs font-black shadow flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" /> Enviar y Hablar al Médico
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* B. SIMULADOR DE CÁMARA DE SEÑAS */}
            {subTab === 'señas' && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-border space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <h3 className="text-xs font-black text-brand-dark flex items-center gap-1">
                      📹 Traductor Inteligente de Señas (LSCh) por Cámara
                    </h3>
                    <p className="text-[10px] text-brand-text-secondary">Usa la cámara frontal de tu dispositivo para captar y verbalizar señas clínicas.</p>
                  </div>
                </div>

                <div className="relative aspect-video max-w-md mx-auto rounded-xl overflow-hidden bg-brand-dark flex flex-col items-center justify-center text-center p-6 text-white border border-brand-border">
                  {cameraActive ? (
                    <>
                      {/* Grid representation */}
                      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20 pointer-events-none">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div key={i} className="border border-brand-light" />
                        ))}
                      </div>

                      {isAnalyzing ? (
                        <div className="space-y-3 z-10">
                          <div className="w-12 h-12 border-4 border-brand-turquoise border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-xs font-bold tracking-wider font-mono">RECONOCIENDO MOVIMIENTO DE SEÑAL...</p>
                        </div>
                      ) : detectedSign ? (
                        <div className="space-y-4 z-10 max-w-sm">
                          <p className="text-[10px] text-brand-light/60 tracking-widest font-mono">SEÑA DETECTADA (CONFIANZA DEL {(confidence! * 100).toFixed(0)}%)</p>
                          <div className="bg-brand-turquoise text-white font-black py-2.5 px-5 rounded-xl text-sm animate-pulse inline-block">
                            💬 "{detectedSign}"
                          </div>
                          
                          <div className="bg-white/10 p-2 rounded-lg text-[10px] flex items-center justify-center gap-2 max-w-xs mx-auto">
                            <span>🔊 Vocero activado</span>
                          </div>

                          <div className="flex justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(detectedSign)}
                              className="bg-brand-turquoise hover:bg-brand-turquoise-dark text-white font-black px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all active:scale-95"
                            >
                              <Volume2 className="w-4 h-4" /> 🔊 Volver a Escuchar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSendMessage(`📹 [Seña Captada por Cámara]: "${detectedSign}"`, 'text');
                                handlePlayAudio(detectedSign);
                                setDetectedSign(null);
                              }}
                              className="bg-brand-success hover:bg-brand-success-dark text-white font-black px-4 py-2 rounded-lg text-xs transition-all active:scale-95"
                            >
                              ✓ Enviar al Médico
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 z-10">
                          <p className="text-xs font-bold">Asistente óptico encendido. Selecciona una seña para simular gesticulación:</p>
                          <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                            {[
                              'Me siento muy mal, tengo fiebre',
                              'No puedo respirar bien, me ahogo',
                              'Necesito ir al baño urgente',
                              'Me duele el pecho, siento presión',
                              'Necesito mi medicina de urgencia',
                              'Por favor, llame a mi familia'
                            ].map((phraseOption) => (
                              <button
                                key={phraseOption}
                                type="button"
                                onClick={() => simulateAISignDetection(phraseOption)}
                                className="bg-white/10 hover:bg-white/20 text-[10px] font-semibold p-2 rounded-lg text-left transition-all leading-tight border border-white/20 animate-fade-in"
                              >
                                👉 "{phraseOption}"
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3 z-10">
                      <Camera className="w-10 h-10 text-brand-light/40 mx-auto" />
                      <p className="text-[11px] text-brand-light/70 max-w-xs leading-normal font-medium">ACTIVA LA CÁMARA FRONTAL PARA INTERPRETAR TU LENGUA DE SEÑAS EN TIEMPO REAL</p>
                      <button
                        type="button"
                        onClick={() => setCameraActive(true)}
                        className="bg-brand-turquoise hover:bg-brand-turquoise-dark text-white text-xs font-black py-2.5 px-4 rounded-xl shadow"
                      >
                        Iniciar Cámara de Señas
                      </button>
                    </div>
                  )}
                </div>

                {cameraActive && (
                  <div className="flex justify-between items-center text-[10px] text-brand-text-secondary font-semibold font-mono px-1">
                    <span>Modo de Captura: LSCh Local</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraActive(false);
                        setDetectedSign(null);
                      }}
                      className="text-brand-coral hover:underline font-bold"
                    >
                      [Apagar Cámara]
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* C. MENSAJES Y PICTOGRAMAS CON AUDIO */}
            {subTab === 'pictogramas' && (
              <div className="space-y-4">
                {/* FAST RESPONSES - 8 HIGH TARGET BUTTONS ALWAYS VISIBLE */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-border">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-black text-brand-dark flex items-center gap-1">
                      ⚡ Mensajes Rápidos (Tocar para enviar y hablar en voz alta)
                    </h3>
                    <span className="text-[9px] bg-brand-success-light text-brand-turquoise-dark px-2 py-0.5 rounded-full font-bold uppercase">🔊 Con Audio TTS</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {mockQuickMessages.map((qm) => (
                      <div
                        key={qm.id}
                        className="flex items-center gap-1.5 border border-brand-border bg-brand-bg hover:bg-brand-light rounded-xl p-1.5 transition-all hover:scale-[1.01] shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => handleSendQuick(qm.phrase)}
                          className="flex-1 text-left h-10 px-2 text-[11px] font-black text-brand-dark leading-tight flex items-center gap-1.5"
                        >
                          <span>💬</span> {qm.phrase}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio(qm.phrase);
                          }}
                          className="h-9 w-9 bg-brand-turquoise/10 hover:bg-brand-turquoise text-brand-turquoise-dark hover:text-white rounded-lg flex items-center justify-center shrink-0 transition-all"
                          title="Reproducir audio en voz alta"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CATEGORIZED PICTOGRAM LIBRARY */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-border">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-black text-brand-dark">
                      🏥 Biblioteca de Pictogramas Médicos (Tocar para enviar y reproducir)
                    </h3>
                    <span className="text-[9px] bg-brand-success-light text-brand-turquoise-dark px-2 py-0.5 rounded-full font-bold uppercase">🔊 Voz Parlante</span>
                  </div>

                  {/* Categorías */}
                  <div className="flex flex-wrap gap-1.5 mb-4 pb-2 border-b">
                    {mockCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold transition-all ${
                          activeCategory === cat.id
                            ? 'bg-brand-turquoise text-white font-bold'
                            : 'bg-brand-bg text-brand-text-secondary hover:bg-brand-light'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Pictogram Grid (2 Columns, Large Touch Targets) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {mockPictograms
                      .filter((pic) => pic.categoryId === activeCategory)
                      .map((pic) => (
                        <div
                          key={pic.id}
                          className={`p-2.5 rounded-xl border flex flex-col justify-between items-center text-center transition-transform border-brand-border/60 shadow-xs relative ${
                            selectedPicId === pic.id
                              ? 'bg-brand-success-light text-brand-success border-brand-success ring-2 ring-brand-success scale-[1.02]'
                              : 'bg-white hover:bg-brand-light'
                          }`}
                        >
                          {/* Dedicated speaker overlay icon on the top-right corner */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayAudio(pic.speechText || pic.phrase);
                            }}
                            className="absolute top-2 right-2 h-7 w-7 bg-brand-bg hover:bg-brand-turquoise text-brand-text-secondary hover:text-white rounded-md flex items-center justify-center transition-colors shadow-2xs"
                            title="Reproducir audio en voz alta"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendPictogram(pic.id, pic.phrase)}
                            className="w-full flex flex-col items-center pt-2"
                          >
                            <div className={`w-11 h-11 rounded-full border flex items-center justify-center mb-1.5 ${pic.colorClass}`}>
                              <span className="text-xl">{getPictogramEmoji(pic.id)}</span>
                            </div>
                            <span className="text-xs font-black text-brand-dark leading-tight block">{pic.title}</span>
                            <span className="text-[10px] text-brand-text-secondary leading-normal mt-0.5 block italic font-medium">"{pic.phrase}"</span>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. CHAT / CONVERSATION VIEW (LARGE FONTS FOR PATIENT) */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden flex flex-col h-[500px] animate-fade-in">
            {/* Messages box */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-brand-bg/40">
              {chatHistory.map((msg) => {
                const isPatient = msg.senderType === 'patient';
                const isSystem = msg.senderType === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center">
                      <span className="inline-block px-3 py-1 bg-brand-light/70 border rounded-full text-[10px] font-bold text-brand-primary">
                        ⚙️ {msg.body}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex ${isPatient ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl border ${
                        isPatient
                          ? 'bg-brand-light text-brand-dark rounded-tr-none border-brand-primary/10'
                          : 'bg-white text-brand-dark rounded-tl-none border-brand-border shadow-xs'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <p className="text-[10px] font-bold text-brand-primary">
                          {isPatient ? 'Tú (Paciente)' : msg.senderName}
                        </p>
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(msg.body)}
                          className="p-1 hover:bg-brand-bg rounded text-brand-text-secondary hover:text-brand-primary transition-all flex items-center justify-center"
                          title="Reproducir lectura por voz (TTS)"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-bold leading-relaxed">{msg.body}</p>

                      {msg.messageType === 'pictogram' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-brand-success-light text-brand-turquoise-dark px-2.5 py-1 rounded text-xs font-bold">
                          <span className="text-sm">{getPictogramEmoji(msg.pictogramPath || '')}</span> Pictograma Enviado
                        </div>
                      )}

                      <span className="block text-[9px] text-brand-text-secondary mt-1.5 text-right font-medium">
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Composer (Large touch buttons) */}
            <form onSubmit={handleSendText} className="p-3 border-t bg-white flex items-center gap-2 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe tu mensaje aquí si prefieres..."
                className="flex-1 h-12 px-4 bg-brand-bg rounded-xl border border-brand-border text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none"
              />

              {/* Quick Messages Popover Button and List */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowChatQuickMessages(!showChatQuickMessages)}
                  className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0 border ${
                    showChatQuickMessages
                      ? 'bg-brand-turquoise text-white border-brand-turquoise ring-2 ring-brand-turquoise/40'
                      : 'bg-brand-success-light text-brand-turquoise-dark border-brand-turquoise/20 hover:bg-brand-turquoise/25'
                  }`}
                  title="Mensajes Rápidos"
                >
                  <Zap className="w-5 h-5" />
                </button>

                {showChatQuickMessages && (
                  <div className="absolute bottom-14 right-0 w-72 bg-white rounded-xl shadow-xl border border-brand-border p-3 z-30 space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center pb-1.5 border-b border-brand-border">
                      <span className="text-[10px] font-black text-brand-dark uppercase tracking-wide flex items-center gap-1">
                        ⚡ Respuestas Rápidas (Hablar)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowChatQuickMessages(false)}
                        className="text-[10px] font-bold text-brand-coral hover:underline"
                      >
                        Cerrar
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {mockQuickMessages.map((qm) => (
                        <button
                          key={qm.id}
                          type="button"
                          onClick={() => handleSendQuick(qm.phrase)}
                          className="w-full text-left px-3 py-2 bg-brand-bg hover:bg-brand-turquoise/10 text-xs font-bold text-brand-dark rounded-lg border border-brand-border/60 hover:border-brand-turquoise/40 transition-all flex items-center gap-2 active:scale-98"
                        >
                          <span className="text-sm">💬</span>
                          <span className="truncate">{qm.phrase}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="h-12 w-12 bg-brand-primary text-white rounded-xl flex items-center justify-center hover:bg-brand-intermediate transition-all active:scale-95 flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* 3. CONSENT PRIVACY REGULATION FOR PATIENT */}
        {activeTab === 'consents' && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-brand-border space-y-4 animate-fade-in">
            <div className="border-b pb-3 mb-2">
              <h3 className="text-xs font-black text-brand-dark flex items-center gap-1">
                🛡️ Mis Permisos y Consentimiento Granular
              </h3>
              <p className="text-[10px] text-brand-text-secondary mt-1 leading-relaxed">
                Tú tienes el control absoluto. Enciende o apaga el acceso que otorgas al personal médico durante esta sesión de atención SV-847291.
              </p>
            </div>

            <div className="space-y-3">
              {sessionConsents.map((consent) => (
                <div key={consent.id} className="p-3 bg-brand-bg rounded-xl border border-brand-border/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="max-w-[70%]">
                    <span className="text-xs font-black text-brand-dark block">{consent.title}</span>
                    <span className="text-[10px] text-brand-text-secondary block mt-0.5 leading-relaxed">{consent.description}</span>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => onConsentToggle(consent.id, 'granted')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        consent.status === 'granted'
                          ? 'bg-brand-success text-white'
                          : 'bg-white text-brand-text-secondary border border-brand-border hover:bg-brand-light'
                      }`}
                    >
                      ✓ Permitir
                    </button>
                    <button
                      onClick={() => onConsentToggle(consent.id, 'rejected')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        consent.status === 'rejected' || consent.status === 'revoked'
                          ? 'bg-brand-coral text-white'
                          : 'bg-white text-brand-text-secondary border border-brand-border hover:bg-brand-light'
                      }`}
                    >
                      ✗ Bloquear
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t text-[10px] text-brand-text-secondary italic text-center">
              🛡️ Todos tus permisos expiran automáticamente al finalizar tu sesión de atención de salud.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
