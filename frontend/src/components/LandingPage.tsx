/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Heart,
  Accessibility,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Users,
  Eye,
  Camera,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  Volume2,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { mockPictograms, mockCategories } from '../data/mockData';
import { getPictogramEmoji } from './PatientView';
import señavidaHero from '../assets/senavida-hero.png';

interface LandingPageProps {
  onLearnMoreClick: () => void;
  onLoginClick: () => void;
  highContrast?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLearnMoreClick,
  onLoginClick,
  highContrast = false
}) => {
  // Interactive Pictogram Demo State
  const [selectedCategory, setSelectedCategory] = useState('cat-1');
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);

  // Carousel and search states for the landing pictogram section
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScrollLeft = scrollWidth - clientWidth;
      if (maxScrollLeft > 0) {
        setScrollProgress(scrollLeft / maxScrollLeft);
      } else {
        setScrollProgress(0);
      }
    }
  };

  const handleCarouselScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      // Scroll by 75% of view on desktop, or 100% on mobile
      const scrollAmount = clientWidth > 640 ? clientWidth * 0.75 : clientWidth;
      const targetScroll = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Sign Language AI camera Demo State
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedSign, setDetectedSign] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // FAQ collapsible state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Play audio simulation
  const handlePlaySpeech = (id: string, text: string) => {
    setIsPlayingId(id);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CL';
      utterance.onend = () => setIsPlayingId(null);
      utterance.onerror = () => setIsPlayingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingId(null), 1500);
    }
  };

  // Sign Language Simulation Trigger
  const simulateAISignDetection = () => {
    if (!cameraActive) return;
    setIsAnalyzing(true);
    setDetectedSign(null);
    setConfidence(null);

    const signs = [
      { label: 'Dolor de cabeza', conf: 0.94 },
      { label: 'Necesito agua', conf: 0.88 },
      { label: 'Me duele aquí (pecho)', conf: 0.91 },
      { label: 'Necesito intérprete', conf: 0.97 },
      { label: 'Soy alérgico', conf: 0.85 }
    ];

    setTimeout(() => {
      const selected = signs[Math.floor(Math.random() * signs.length)];
      setDetectedSign(selected.label);
      setConfidence(selected.conf);
      setIsAnalyzing(false);
    }, 1500);
  };

  const faqs = [
    {
      q: '¿Cómo garantiza SEÑAVIDA la privacidad de mi historial de salud?',
      a: 'SEÑAVIDA no es una ficha clínica permanente. Cumple estrictamente con la Ley N° 20.584 de Derechos y Deberes del Paciente en Chile, operando sobre consentimiento granular y sin guardar imágenes, audios o secuencias de vídeo. Las transcripciones y chats expiran inmediatamente al finalizar el servicio asistencial.'
    },
    {
      q: '¿Qué es el CTA o Código Temporal de Atención?',
      a: 'Es un código corto (ej: SV-847291) e intransferible generado al ingreso del paciente. Evita el uso predecible de datos como el RUT para autorizar accesos, asegurando que sólo el funcionario facultado y en presencia física del paciente pueda iniciar la mediación.'
    },
    {
      q: '¿Es necesario instalar una aplicación en el celular?',
      a: 'No. SEÑAVIDA es una solución web responsive multiplataforma compatible con cualquier smartphone, tablet o computadora conectada a internet, utilizando tecnologías web accesibles de última generación.'
    },
    {
      q: '¿Cómo funciona la cámara con Inteligencia Artificial?',
      a: 'Utiliza modelos ligeros basados en MediaPipe y TensorFlow.js corriendo localmente en la máquina del usuario o mediando con servidores seguros. Detecta la postura corporal y manos, traduciendo señas médicas clave a texto escrito, siempre solicitando la confirmación voluntaria del paciente antes de transmitir la frase.'
    }
  ];

  return (
    <div id="landing-page-root" className={`relative overflow-hidden ${highContrast ? 'bg-black text-yellow-400' : 'bg-brand-bg text-brand-text-primary'}`}>
      {/* BACKGROUND DECORATIONS */}
      {!highContrast && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-48 w-96 h-96 rounded-full bg-[#7ecbeb]/20 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute top-2/3 right-10 w-[500px] h-[500px] rounded-full bg-[#91ddd4]/20 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        </div>
      )}

      {/* 1. HERO SECTION — imagen a ancho completo de pantalla (full-bleed) */}
      <section id="inicio" className="relative z-10">
        <div className="relative w-full overflow-hidden">
          <img
            src={señavidaHero}
            alt="SEÑAVIDA — Conectamos mundos, comunicamos vidas"
            className="w-full h-auto block"
          />

          {/* Degradado oscuro solo en la parte de abajo, para que los
              botones se lean bien sin importar el color de la foto */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

          {/* Botones flotando sobre la imagen */}
          <div className="absolute inset-x-0 bottom-6 flex flex-col sm:flex-row justify-center gap-4 px-4">
            <button
              onClick={onLearnMoreClick}
              className={`px-8 py-4 rounded-xl text-base font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg ${highContrast
                ? 'bg-yellow-400 text-black font-black hover:bg-yellow-300'
                : 'bg-brand-primary text-white hover:bg-brand-intermediate hover:shadow-brand-primary/20'
                }`}
            >
              Conocer cómo funciona <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onLoginClick}
              className={`px-8 py-4 rounded-xl text-base font-bold transition-colors border-2 flex items-center justify-center gap-2 backdrop-blur-sm ${highContrast
                ? 'border-yellow-400 text-yellow-400 bg-black/40 hover:bg-yellow-400/10'
                : 'border-white text-white bg-white/10 hover:bg-white/20'
                }`}
            >
              🔐 Acceso Personal de Salud
            </button>
          </div>
        </div>
      </section>

      {/* 2. EL PROBLEMA & 3. LA SOLUCIÓN */}
      <section id="que-es" className={`py-20 border-y ${highContrast ? 'border-yellow-400 bg-black' : 'bg-white border-brand-border/40'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-brand-turquoise mb-2">Fundamentación Asistencial</h2>
            <p className={`text-3xl font-black ${highContrast ? 'text-yellow-400' : 'text-brand-dark'}`}>
              Rompiendo barreras en la urgencia médica
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* El Problema */}
            <div className={`p-8 rounded-2xl border ${highContrast ? 'border-yellow-400 bg-black' : 'bg-brand-coral-light/20 border-brand-coral/20'}`}>
              <div className="w-12 h-12 rounded-xl bg-brand-coral/10 text-brand-coral flex items-center justify-center mb-6">
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-bold text-brand-coral-dark mb-4">El Problema de Comunicación</h3>
              <p className="text-sm text-brand-text-primary leading-relaxed space-y-3">
                Para una persona sorda, asistir a un servicio de urgencias puede ser una experiencia de alta vulnerabilidad. La falta de intérpretes presenciales inmediatos, la dificultad para realizar lectura labial ante el uso de mascarillas sanitarias o el estrés del momento suelen ocasionar malentendidos, pérdida de autonomía en la firma de consentimientos o desinformación en tratamientos críticos.
              </p>
              <ul className="mt-4 space-y-2.5 text-xs font-semibold text-brand-text-secondary">
                <li className="flex items-center gap-2 text-brand-coral-dark">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-coral" /> Dependencia forzosa de intermediarios familiares.
                </li>
                <li className="flex items-center gap-2 text-brand-coral-dark">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-coral" /> Incertidumbre en la comprensión de dosis farmacológicas.
                </li>
                <li className="flex items-center gap-2 text-brand-coral-dark">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-coral" /> Riesgo clínico por no poder declarar alergias a tiempo.
                </li>
              </ul>
            </div>

            {/* La Solución */}
            <div className={`p-8 rounded-2xl border ${highContrast ? 'border-yellow-400 bg-black' : 'bg-brand-success-light/20 border-brand-success/20'}`}>
              <div className="w-12 h-12 rounded-xl bg-brand-turquoise/10 text-brand-turquoise-dark flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-bold text-brand-turquoise-dark mb-4">La Solución SEÑAVIDA</h3>
              <p className="text-sm text-brand-text-primary leading-relaxed">
                Establecemos un puente interactivo accesible en tiempo real. Mediante la articulación de un entorno web que opera bajo consentimientos específicos del paciente, permitimos expresar síntomas mediante pictogramas médicos, entablar chat bidireccional con transcripción por voz y contar con un asistente por cámara que traduce señas del paciente de forma instantánea.
              </p>
              <ul className="mt-4 space-y-2.5 text-xs font-semibold text-brand-text-secondary">
                <li className="flex items-center gap-2 text-brand-turquoise-dark">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-turquoise" /> No almacena datos biométricos, resguardando la privacidad.
                </li>
                <li className="flex items-center gap-2 text-brand-turquoise-dark">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-turquoise" /> Consentimientos granulares firmados digitalmente.
                </li>
                <li className="flex items-center gap-2 text-brand-turquoise-dark">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-turquoise" /> Interfaz con validación WCAG AA adaptada a cualquier móvil.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CÓMO FUNCIONA (FLUJO CTA Y CONSENTIMIENTO) */}
      <section id="como-funciona" className="py-20 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-brand-primary mb-2">Protocolo Asistencial</h2>
            <p className={`text-3xl font-black ${highContrast ? 'text-yellow-400' : 'text-brand-dark'}`}>
              Paso a paso: Consulta Inclusiva Transparente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                num: '01',
                title: 'Generar CTA',
                desc: 'Al llegar a admisión, se le entrega al paciente un Código Temporal de Atención (ej. SV-847291) intransferible y de un solo uso.',
                icon: Layers
              },
              {
                num: '02',
                title: 'Vincular y Validar',
                desc: 'El funcionario ingresa el código en su terminal institucional para gatillar la solicitud de atención en el dispositivo móvil del paciente.',
                icon: ShieldCheck
              },
              {
                num: '03',
                title: 'Firma de Consentimiento',
                desc: 'El paciente autoriza qué datos desea compartir de manera granular (ej. cámara para señas, alergias, o reportes a familiares).',
                icon: CheckCircle2
              },
              {
                num: '04',
                title: 'Interacción Segura',
                desc: 'Se abre el portal de comunicación interactivo por chat, voz o pictogramas, garantizando una consulta comprensible y autónoma.',
                icon: MessageSquare
              }
            ].map((step, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border relative transition-all duration-200 hover:-translate-y-1 ${highContrast ? 'border-yellow-400 bg-black' : 'bg-white border-brand-border/60 shadow-sm'
                  }`}
              >
                <div className="absolute top-4 right-4 text-4xl font-black text-brand-primary/10 font-mono">
                  {step.num}
                </div>
                <div className="w-10 h-10 rounded-lg bg-brand-light text-brand-primary flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-brand-dark mb-2">{step.title}</h4>
                <p className="text-xs text-brand-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVO: COMUNICACIÓN VISUAL ASISTIDA */}
      <section className={`py-20 border-y ${highContrast ? 'border-yellow-400 bg-black' : 'bg-brand-success-light/10 border-brand-border/20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs uppercase font-extrabold tracking-widest text-brand-primary">Traductor Inteligente</span>
              <h3 className={`text-3xl font-black leading-tight ${highContrast ? 'text-yellow-400' : 'text-brand-dark'}`}>
                Traducción Asistida de Lengua de Señas (LSCh) por Cámara
              </h3>
              <p className="text-sm leading-relaxed text-brand-text-secondary">
                Nuestra tecnología lee de forma segura mediante la cámara web de cualquier dispositivo (utilizando modelos inteligentes locales) la gesticulación y postura de las manos de la persona sorda. Reconoce un vocabulario médico acotado diseñado específicamente para escenarios de urgencias.
              </p>

              <div className={`p-4 rounded-xl border flex items-start gap-3 ${highContrast ? 'border-yellow-400' : 'bg-brand-light/30 border-brand-primary/10 text-brand-primary'}`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="block font-bold">⚠️ Principio de Control de Transmisión:</strong>
                  Las interpretaciones no se envían automáticamente al médico. El sistema solicita al paciente pulsar un gran botón de confirmación ("Confirmar Seña") para asegurar que la traducción sea 100% correcta.
                </div>
              </div>
            </div>

            {/* Simulated Interactive Camera Preview */}
            <div className="lg:col-span-6">
              <div className={`rounded-2xl border p-6 shadow-xl relative ${highContrast ? 'border-yellow-400 bg-black' : 'bg-white border-brand-border'}`}>
                <h4 className="text-sm font-bold text-brand-dark mb-3 flex items-center gap-1.5 border-b pb-2">
                  <Camera className="w-4 h-4 text-brand-primary" /> Demostración de Asistente de Señas
                </h4>

                <div className="relative aspect-video rounded-xl overflow-hidden bg-brand-dark flex flex-col items-center justify-center text-center p-6 text-white border">
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
                          <p className="text-sm font-bold tracking-wider font-mono">DETECTANDO EXTREMIDADES...</p>
                        </div>
                      ) : detectedSign ? (
                        <div className="space-y-4 z-10 max-w-sm">
                          <p className="text-xs text-brand-light/60 tracking-widest font-mono">POSTURA DETECTADA (CONFIANZA DEL {(confidence! * 100).toFixed(0)}%)</p>
                          <div className="bg-brand-turquoise text-white font-bold py-2 px-4 rounded-lg text-lg animate-bounce">
                            💬 "{detectedSign}"
                          </div>
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                alert(`Seña "${detectedSign}" confirmada para demostración.`);
                                setDetectedSign(null);
                              }}
                              className="bg-brand-success hover:bg-brand-success/90 text-white font-bold px-3 py-1.5 rounded-md text-xs"
                            >
                              ✓ Confirmar y Enviar
                            </button>
                            <button
                              onClick={() => setDetectedSign(null)}
                              className="bg-brand-coral hover:bg-brand-coral/90 text-white font-bold px-3 py-1.5 rounded-md text-xs"
                            >
                              ✗ Corregir Seña
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 z-10">
                          <p className="text-sm font-medium">Asistente óptico encendido. Gesticula frente a la cámara.</p>
                          <button
                            onClick={simulateAISignDetection}
                            className="bg-brand-primary hover:bg-brand-intermediate text-white text-xs font-bold py-2 px-4 rounded-lg shadow-md"
                          >
                            Simular Seña Médica
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3 z-10">
                      <Camera className="w-10 h-10 text-brand-light/40 mx-auto" />
                      <p className="text-xs text-brand-light/70 max-w-xs">PULSA INICIAR PARA ENCENDER LA CÁMARA DE DEMOSTRACIÓN (NO SE ALMACENAN IMÁGENES)</p>
                      <button
                        onClick={() => setCameraActive(true)}
                        className="bg-brand-turquoise hover:bg-brand-turquoise-dark text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow"
                      >
                        Iniciar Cámara Demostrativa
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-between items-center text-[11px] text-brand-text-secondary font-mono">
                  <span>Modo: Traductología LSCh</span>
                  {cameraActive && (
                    <button
                      onClick={() => {
                        setCameraActive(false);
                        setDetectedSign(null);
                      }}
                      className="text-brand-coral font-bold hover:underline"
                    >
                      Apagar Cámara
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PICTOGRAMAS MÉDICOS INTERACTIVOS (CON CARRUSEL Y BÚSQUEDA) */}
      <section id="pictogramas" className="py-20 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs uppercase font-extrabold tracking-widest text-brand-turquoise">Simbología Asistencial</span>
            <h3 className={`text-3xl font-black ${highContrast ? 'text-yellow-400' : 'text-brand-dark'}`}>
              Biblioteca de Pictogramas Clínicos
            </h3>
            <p className="text-sm text-brand-text-secondary mt-2">
              Prueba cómo se comunican las necesidades de forma no verbal con síntesis de voz en español. Explora por categorías o utiliza el buscador interactivo.
            </p>
          </div>

          {/* Search bar & Category Selector Container */}
          <div className="max-w-xl mx-auto mb-10 space-y-4">
            {/* Search Input Box */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Reset scroll progress when searching
                  setScrollProgress(0);
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = 0;
                  }
                }}
                placeholder="¿Qué buscas? Escribe aquí (ej: dolor, fiebre, agua, baño...)"
                className={`w-full pl-11 pr-12 py-3.5 rounded-2xl border font-bold text-xs focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none shadow-sm transition-all ${highContrast
                  ? 'border-yellow-400 bg-black text-yellow-400 focus:ring-yellow-400'
                  : 'border-brand-border bg-white text-brand-dark'
                  }`}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setScrollProgress(0);
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollLeft = 0;
                    }
                  }}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md transition-all ${highContrast
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                    : 'bg-brand-coral-light/30 text-brand-coral hover:bg-brand-coral hover:text-white'
                    }`}
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Category Selector Tabs */}
            <div className="flex flex-wrap justify-center gap-1.5 pt-1.5">
              {mockCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id && !searchQuery;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSearchQuery('');
                      setScrollProgress(0);
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollLeft = 0;
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 ${isSelected
                      ? highContrast
                        ? 'bg-yellow-400 text-black font-extrabold border-2 border-black ring-2 ring-yellow-400'
                        : 'bg-brand-primary text-white shadow-md shadow-brand-primary/20 scale-105'
                      : highContrast
                        ? 'border border-yellow-400 text-yellow-400 bg-black hover:bg-yellow-400/20'
                        : 'border border-brand-border/60 text-brand-text-secondary bg-white hover:border-brand-primary/40 hover:text-brand-primary hover:bg-brand-light/30'
                      }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Scope Label */}
          {searchQuery && (
            <div className="text-center mb-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${highContrast ? 'bg-yellow-400/20 text-yellow-400' : 'bg-brand-light text-brand-primary'
                }`}>
                🔍 Mostrando resultados para "{searchQuery}" ({mockPictograms.filter((pic) => {
                  if (!pic.isActive) return false;
                  return (
                    pic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    pic.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    pic.speechText.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                }).length})
              </span>
            </div>
          )}

          {/* Carousel Viewport Wrapper */}
          {mockPictograms.filter((pic) => {
            if (!pic.isActive) return false;
            if (searchQuery) {
              return (
                pic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pic.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pic.speechText.toLowerCase().includes(searchQuery.toLowerCase())
              );
            }
            return pic.categoryId === selectedCategory;
          }).length > 0 ? (
            <div className="relative px-0 md:px-12 group">
              {/* Left Arrow Button (hidden on scroll start) */}
              <button
                onClick={() => handleCarouselScroll('left')}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full border transition-all active:scale-95 shadow-lg hidden md:flex items-center justify-center ${scrollProgress <= 0.02
                  ? 'opacity-40 cursor-not-allowed border-brand-border text-brand-text-secondary/40 bg-brand-bg/40'
                  : highContrast
                    ? 'border-2 border-yellow-400 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black'
                    : 'border-brand-border bg-white text-brand-primary hover:bg-brand-light hover:text-brand-primary-dark hover:border-brand-primary/30'
                  }`}
                title="Deslizar a la izquierda"
                disabled={scrollProgress <= 0.02}
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Scrollable track with native snap & smooth behavior */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {mockPictograms
                  .filter((pic) => {
                    if (!pic.isActive) return false;
                    if (searchQuery) {
                      return (
                        pic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        pic.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        pic.speechText.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                    }
                    return pic.categoryId === selectedCategory;
                  })
                  .map((pic) => {
                    const isPlaying = isPlayingId === pic.id;
                    return (
                      <div
                        key={pic.id}
                        className={`snap-start shrink-0 w-full sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] p-6 rounded-2xl border flex flex-col justify-between items-center text-center transition-all duration-300 hover:shadow-lg hover:border-brand-primary/30 ${highContrast
                          ? 'border-yellow-400 bg-black text-yellow-400'
                          : 'bg-white border-brand-border/60 shadow-xs'
                          }`}
                      >
                        {/* Pictogram Visual Box with animated outline if playing */}
                        <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-4 transition-all duration-300 relative ${isPlaying
                          ? 'animate-bounce scale-110'
                          : 'hover:scale-110'
                          } ${pic.colorClass}`}>
                          {isPlaying && (
                            <span className="absolute -inset-1.5 rounded-full border border-brand-primary animate-ping opacity-45" />
                          )}
                          <span className="text-2xl">{getPictogramEmoji(pic.id)}</span>
                        </div>

                        {/* Info & Phrase description */}
                        <div className="space-y-1.5 mb-5 flex-1 flex flex-col justify-center">
                          <h4 className={`text-sm font-black tracking-tight ${highContrast ? 'text-yellow-400' : 'text-brand-dark'
                            }`}>
                            {pic.title}
                          </h4>
                          <p className={`text-xs italic leading-normal ${highContrast ? 'text-yellow-300' : 'text-brand-text-secondary'
                            }`}>
                            "{pic.phrase}"
                          </p>
                        </div>

                        {/* Synthesis Audio Action Trigger */}
                        <button
                          onClick={() => handlePlaySpeech(pic.id, pic.speechText)}
                          disabled={isPlaying}
                          className={`w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-black transition-all ${isPlaying
                            ? 'bg-brand-primary text-white shadow'
                            : highContrast
                              ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                              : 'bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white hover:shadow-sm'
                            }`}
                        >
                          <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                          {isPlaying ? 'Reproduciendo...' : 'Escuchar Voz'}
                        </button>
                      </div>
                    );
                  })}
              </div>

              {/* Right Arrow Button (hidden on scroll end) */}
              <button
                onClick={() => handleCarouselScroll('right')}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full border transition-all active:scale-95 shadow-lg hidden md:flex items-center justify-center ${scrollProgress >= 0.98
                  ? 'opacity-40 cursor-not-allowed border-brand-border text-brand-text-secondary/40 bg-brand-bg/40'
                  : highContrast
                    ? 'border-2 border-yellow-400 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black'
                    : 'border-brand-border bg-white text-brand-primary hover:bg-brand-light hover:text-brand-primary-dark hover:border-brand-primary/30'
                  }`}
                title="Deslizar a la derecha"
                disabled={scrollProgress >= 0.98}
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Mobile and desktop swipe visual guidance */}
              <div className="flex md:hidden justify-center gap-6 mt-4">
                <button
                  onClick={() => handleCarouselScroll('left')}
                  className={`p-2.5 rounded-xl border flex items-center gap-1 text-xs font-bold active:scale-95 transition-all ${scrollProgress <= 0.02
                    ? 'opacity-30 cursor-not-allowed'
                    : highContrast
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-brand-border text-brand-primary bg-white'
                    }`}
                  disabled={scrollProgress <= 0.02}
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button
                  onClick={() => handleCarouselScroll('right')}
                  className={`p-2.5 rounded-xl border flex items-center gap-1 text-xs font-bold active:scale-95 transition-all ${scrollProgress >= 0.98
                    ? 'opacity-30 cursor-not-allowed'
                    : highContrast
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-brand-border text-brand-primary bg-white'
                    }`}
                  disabled={scrollProgress >= 0.98}
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Scroll premium progress bar track at the bottom */}
              <div className="mt-5 max-w-xs mx-auto flex items-center gap-2">
                <span className="text-[9px] font-bold font-mono uppercase text-brand-text-secondary shrink-0">Inicio</span>
                <div className="flex-1 bg-brand-border/40 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-primary h-full transition-all duration-150 rounded-full"
                    style={{ width: `${Math.min(Math.max((scrollProgress * 100), 5), 100)}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold font-mono uppercase text-brand-text-secondary shrink-0">Fin</span>
              </div>
            </div>
          ) : (
            /* Friendly empty search result state */
            <div className={`p-12 text-center rounded-2xl border max-w-md mx-auto space-y-3 ${highContrast ? 'border-yellow-400 bg-black text-yellow-400' : 'bg-white border-brand-border/80'
              }`}>
              <span className="text-3xl block">💡</span>
              <h4 className="text-sm font-bold text-brand-dark">No se encontraron pictogramas</h4>
              <p className="text-xs text-brand-text-secondary leading-normal">
                Prueba buscando palabras más simples como <strong>"dolor"</strong>, <strong>"fiebre"</strong>, <strong>"agua"</strong> o <strong>"baño"</strong>.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setScrollProgress(0);
                }}
                className={`mt-2 text-xs font-bold hover:underline ${highContrast ? 'text-yellow-300' : 'text-brand-primary'
                  }`}
              >
                Limpiar búsqueda y ver todo
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 7. ROLES CLÍNICOS */}
      <section className={`py-20 border-t ${highContrast ? 'border-yellow-400 bg-black' : 'bg-white border-brand-border/30'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-extrabold tracking-widest text-brand-primary">Estructura Hospitalaria</span>
            <h3 className={`text-3xl font-black ${highContrast ? 'text-yellow-400' : 'text-brand-dark'}`}>
              Perfiles Clínicos Integrados
            </h3>
            <p className="text-sm text-brand-text-secondary mt-2">
              Diferenciación estricta de alcances por rol en el sistema de salud. Cada perfil visualiza sólo los datos de su competencia asistencial directa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                title: 'Admisión / Ventanilla',
                scope: 'Iniciación del caso. Captura datos básicos, preferencia de comunicación, alergias iniciales y asigna el código CTA de atención.',
                icon: Users
              },
              {
                title: 'Triage / Categorización',
                scope: 'Personal TENS o enfermería. Registra signos vitales (presión, saturación, frecuencia), dolor e ingresa nivel de gravedad (C1 a C5).',
                icon: Layers
              },
              {
                title: 'Consulta Médica',
                scope: 'Médico de cabecera. Visualiza la línea de tiempo completa, signos históricos, edita impresión clínica, indicaciones y realiza el cierre.',
                icon: Heart
              },
              {
                title: 'Administrador',
                scope: 'Gestión institucional. Habilita o restringe cuentas, audita accesos y configura pictogramas y tiempos de inactividad de la red.',
                icon: ShieldCheck
              }
            ].map((role, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-xl border relative ${highContrast ? 'border-yellow-400 bg-black' : 'bg-brand-bg/50 border-brand-border/40'
                  }`}
              >
                <div className="w-10 h-10 rounded-lg bg-brand-light text-brand-primary flex items-center justify-center mb-4">
                  <role.icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-brand-dark mb-2">{role.title}</h4>
                <p className="text-xs text-brand-text-secondary leading-relaxed">{role.scope}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. SEGURIDAD Y PRIVACIDAD & 9. CONSENTIMIENTO GRANULAR */}
      <section id="seguridad" className={`py-20 border-y ${highContrast ? 'border-yellow-400 bg-black' : 'bg-brand-dark text-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs uppercase font-extrabold tracking-widest text-brand-turquoise">Privacidad y Legalidad</span>
              <h3 className={`text-3xl font-black leading-tight ${highContrast ? 'text-yellow-400' : 'text-white'}`}>
                Seguridad de Nivel Hospitalario sin Almacenamiento Biométrico
              </h3>
              <p className="text-sm leading-relaxed text-brand-light/80">
                La confidencialidad es nuestro pilar fundamental. SEÑAVIDA opera conforme a estándares éticos estrictos que protegen la información clínica de la persona sorda, evitando fugas de identidad o seguimientos intrusivos.
              </p>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-turquoise/20 text-brand-turquoise flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="block font-bold">Consentimiento Granular:</strong>
                    El paciente autoriza qué sensores (cámara, micrófono) o qué módulos de datos (alergias, reporte a familiares) desea abrir para cada sesión.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-turquoise/20 text-brand-turquoise flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="block font-bold">Inmediación Local:</strong>
                    Las imágenes capturadas por el asistente de señas se procesan y desechan de forma inmediata en el cliente. Nunca se graban ni se transmiten servidores de video externos.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-turquoise/20 text-brand-turquoise flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="block font-bold">Auditoría Permanente (Blockchain/Logs):</strong>
                    Cada consulta de datos de pacientes, inicio o cierre de sesión, es firmada y almacenada en registros de auditoría no repudiables.
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Consent Interface Screen */}
            <div className="relative">
              <div className="rounded-xl p-5 bg-white text-brand-text-primary border border-brand-border/10 shadow-2xl space-y-4">
                <h4 className="text-xs font-bold text-brand-dark flex items-center gap-1.5 uppercase tracking-wider border-b pb-2">
                  🛡️ Configuración de Consentimiento Granular
                </h4>
                <p className="text-[11px] text-brand-text-secondary leading-normal">
                  Pulsar para configurar los accesos de la sesión activa <strong>SV-847291</strong>
                </p>

                <div className="space-y-2.5">
                  {[
                    { label: 'Uso de Cámara para Traductología', desc: 'Permite leer señas usando IA local.', active: true },
                    { label: 'Acceso a Historial Clínico de Alergias', desc: 'Habilita al médico a conocer antecedentes.', active: true },
                    { label: 'Compartir Traslados con Familiares', desc: 'Notifica de forma segura vía SMS/WhatsApp.', active: false }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-brand-bg rounded-lg border flex items-center justify-between">
                      <div className="max-w-[75%]">
                        <span className="text-xs font-bold text-brand-dark block">{item.label}</span>
                        <span className="text-[10px] text-brand-text-secondary">{item.desc}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.active ? 'bg-brand-success-light text-brand-success border border-brand-success/20' : 'bg-brand-coral-light/20 text-brand-coral border border-brand-coral/20'
                        }`}>
                        {item.active ? 'Aceptado' : 'Rechazado'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-center text-brand-text-secondary italic">
                  ✓ Firmware encriptado · Registro de auditoría guardado con éxito.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. BENEFICIOS */}
      <section className="py-20 z-10 relative bg-brand-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-extrabold tracking-widest text-brand-primary">Valor Agregado</span>
            <h3 className={`text-3xl font-black ${highContrast ? 'text-yellow-400' : 'text-brand-dark'}`}>
              Impacto Clínico y Humano
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Autonomía Total',
                desc: 'La persona sorda no depende de un familiar para relatar sus síntomas más íntimos, protegiendo su dignidad y autodeterminación.',
                ico: '🕊️'
              },
              {
                title: 'Mayor Rapidez',
                desc: 'Al agilizar la admisión y triage con herramientas visuales accesibles de auto-atención, se reducen significativamente las esperas asistenciales.',
                ico: '⚡'
              },
              {
                title: 'Disminución de Errores',
                desc: 'El registro de alergias, dolor e impresión clínica de forma clara evita errores de medicación o diagnósticos imprecisos.',
                ico: '🎯'
              }
            ].map((ben, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border relative ${highContrast ? 'border-yellow-400 bg-black' : 'bg-white border-brand-border/60 shadow-xs'
                  }`}
              >
                <div className="text-3xl mb-4">{ben.ico}</div>
                <h4 className="text-base font-bold text-brand-dark mb-2">{ben.title}</h4>
                <p className="text-xs text-brand-text-secondary leading-relaxed">{ben.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FAQ SECTION */}
      <section id="faq" className={`py-20 border-y ${highContrast ? 'border-yellow-400 bg-black' : 'bg-white border-brand-border/30'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-xs uppercase font-extrabold tracking-widest text-brand-primary">Resolución de Dudas</span>
            <h3 className={`text-3xl font-black ${highContrast ? 'text-yellow-400' : 'text-brand-dark'}`}>
              Preguntas Frecuentes
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 select-none ${highContrast
                    ? isOpen
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-yellow-400/50 bg-black hover:border-yellow-400'
                    : isOpen
                      ? 'bg-brand-light/50 border-brand-primary shadow-xs'
                      : 'bg-brand-bg/30 border-brand-border/50 hover:border-brand-primary/30 hover:bg-brand-bg/50'
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className={`text-sm font-bold flex items-center gap-2.5 transition-colors duration-200 ${highContrast
                      ? 'text-yellow-400'
                      : isOpen
                        ? 'text-brand-primary'
                        : 'text-brand-dark'
                      }`}>
                      <HelpCircle className={`w-4.5 h-4.5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'scale-110 text-brand-primary' : 'text-brand-turquoise'
                        }`} />
                      <span>{faq.q}</span>
                    </h4>
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-primary' : 'text-brand-text-secondary'
                      }`} />
                  </div>

                  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'
                    }`}>
                    <div className="overflow-hidden">
                      <p className={`text-xs leading-relaxed pl-7 border-l-2 ${highContrast
                        ? 'text-yellow-200 border-yellow-400'
                        : 'text-brand-text-secondary border-brand-primary/30'
                        }`}>
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 12. CONTACTO SECTION */}
      <section id="contacto" className="py-20 z-10 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className={`p-8 rounded-2xl border ${highContrast ? 'border-yellow-400 bg-black' : 'bg-white border-brand-border shadow-xl'}`}>
            <div className="text-center mb-8">
              <h3 className={`text-2xl font-black ${highContrast ? 'text-yellow-400' : 'text-brand-dark'}`}>
                Contacto & Soporte Técnico
              </h3>
              <p className="text-xs text-brand-text-secondary mt-1">
                ¿Quieres implementar SEÑAVIDA en tu centro asistencial? Escríbenos.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Mensaje enviado con éxito en esta demostración.');
              }}
              className="space-y-4 text-xs font-semibold"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-brand-dark">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    className="w-full h-11 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none"
                    placeholder="Ej. Dr. Andrés Soto"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-brand-dark">Correo Institucional</label>
                  <input
                    type="email"
                    required
                    className="w-full h-11 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none"
                    placeholder="Ej. asoto@minsal.cl"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-brand-dark">Establecimiento u Organismo</label>
                <input
                  type="text"
                  required
                  className="w-full h-11 px-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none"
                  placeholder="Ej. Hospital Regional de Villarrica"
                />
              </div>

              <div>
                <label className="block mb-1 text-brand-dark">Mensaje o Requerimiento</label>
                <textarea
                  required
                  rows={4}
                  className="w-full p-3 bg-brand-bg rounded-lg border border-brand-border font-medium focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                  placeholder="Escribe tu consulta o requerimiento técnico aquí..."
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-brand-primary hover:bg-brand-intermediate text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                Enviar Solicitud <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
