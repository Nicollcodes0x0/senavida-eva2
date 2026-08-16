/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppLogo } from './AppLogo';
import { Menu, X, Settings, Check, HelpCircle, Shield, Phone, Activity, Heart } from 'lucide-react';

interface PublicHeaderProps {
  onLoginClick: () => void;
  activeSection: string;
  onNavClick: (sectionId: string) => void;
  accessibilitySettings: {
    dyslexicFont: boolean;
    highContrast: boolean;
    fontSizeMultiplier: number;
  };
  setAccessibilitySettings: React.Dispatch<React.SetStateAction<{
    dyslexicFont: boolean;
    highContrast: boolean;
    fontSizeMultiplier: number;
  }>>;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  onLoginClick,
  activeSection,
  onNavClick,
  accessibilitySettings,
  setAccessibilitySettings
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const navItems = [
    { id: 'inicio', label: 'Inicio', subtitle: 'Volver a la portada principal', icon: Heart },
    { id: 'que-es', label: 'Qué es', subtitle: 'Quiénes somos y nuestro propósito', icon: Activity },
    { id: 'como-funciona', label: 'Cómo funciona', subtitle: 'Paso a paso del flujo de urgencias', icon: Settings },
    { id: 'pictogramas', label: 'Pictogramas', subtitle: 'Catálogo interactivo de comunicación', icon: HelpCircle },
    { id: 'seguridad', label: 'Seguridad', subtitle: 'Protección de datos y firmas', icon: Shield },
    { id: 'faq', label: 'Preguntas Frecuentes', subtitle: 'Dudas habituales resueltas', icon: HelpCircle },
    { id: 'contacto', label: 'Contacto', subtitle: 'Canales de soporte y comunicación', icon: Phone }
  ];

  const toggleDyslexicFont = () => {
    setAccessibilitySettings(prev => ({ ...prev, dyslexicFont: !prev.dyslexicFont }));
  };

  const toggleHighContrast = () => {
    setAccessibilitySettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const changeFontSize = (multiplier: number) => {
    setAccessibilitySettings(prev => ({ ...prev, fontSizeMultiplier: multiplier }));
  };

  return (
    <header
      id="public-header"
      className={`sticky top-0 z-50 w-full backdrop-blur-md transition-all duration-300 border-b ${
        accessibilitySettings.highContrast
          ? 'bg-black border-yellow-400 text-yellow-400'
          : 'bg-white/95 border-brand-border text-brand-text-primary shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavClick('inicio')}>
            <AppLogo variant="horizontal" theme={accessibilitySettings.highContrast ? 'dark' : 'light'} size="md" />
          </div>

          {/* Desktop Navigation - Clean, spaced-out, and highly intuitive */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-3 px-4">
            {navItems.map((item) => {
              const isSelected = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavClick(item.id);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-bold tracking-tight transition-all duration-200 whitespace-nowrap ${
                    isSelected
                      ? accessibilitySettings.highContrast
                        ? 'bg-yellow-400 text-black font-extrabold ring-2 ring-yellow-400'
                        : 'bg-brand-primary text-white shadow-sm font-extrabold'
                      : accessibilitySettings.highContrast
                      ? 'hover:bg-yellow-400/20 text-yellow-400 border border-transparent hover:border-yellow-400'
                      : 'text-brand-text-secondary hover:text-brand-primary hover:bg-brand-light/80'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action Bar with Mobile Hamburger Menu */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Accessibility Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPanelOpen(!panelOpen)}
                className={`p-2.5 rounded-xl transition-all border ${
                  accessibilitySettings.highContrast
                    ? 'border-yellow-400 text-yellow-400 bg-black hover:bg-yellow-400/10'
                    : 'border-brand-border text-brand-text-secondary bg-brand-bg hover:bg-brand-light hover:text-brand-primary shadow-sm'
                }`}
                title="Herramientas de Accesibilidad"
                aria-expanded={panelOpen}
              >
                <Settings className="w-5 h-5" />
              </button>

              {panelOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-xl bg-white border border-brand-border p-4 text-brand-text-primary ring-1 ring-black/5 z-50">
                  <h3 className="text-sm font-bold text-brand-dark mb-3 flex items-center gap-1.5 border-b pb-2">
                    ♿ Adaptabilidad Inclusiva
                  </h3>
                  <div className="space-y-3">
                    {/* Dyslexic / High Readability Font */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Fuente Accesible (Atkinson)</span>
                      <button
                        onClick={toggleDyslexicFont}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          accessibilitySettings.dyslexicFont ? 'bg-brand-turquoise' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            accessibilitySettings.dyslexicFont ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* High Contrast Mode */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Alto Contraste</span>
                      <button
                        onClick={toggleHighContrast}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          accessibilitySettings.highContrast ? 'bg-brand-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            accessibilitySettings.highContrast ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Font Size Modifier */}
                    <div>
                      <span className="text-xs font-semibold block mb-1.5">Tamaño del Texto</span>
                      <div className="grid grid-cols-3 gap-1 bg-brand-bg p-1 rounded-lg border border-brand-border">
                        <button
                          onClick={() => changeFontSize(1.0)}
                          className={`text-xs py-1 rounded font-medium ${
                            accessibilitySettings.fontSizeMultiplier === 1.0 ? 'bg-white text-brand-primary shadow-sm font-bold' : 'text-brand-text-secondary hover:text-brand-primary'
                          }`}
                        >
                          Norm
                        </button>
                        <button
                          onClick={() => changeFontSize(1.15)}
                          className={`text-xs py-1 rounded font-medium ${
                            accessibilitySettings.fontSizeMultiplier === 1.15 ? 'bg-white text-brand-primary shadow-sm font-bold' : 'text-brand-text-secondary hover:text-brand-primary'
                          }`}
                        >
                          Méd
                        </button>
                        <button
                          onClick={() => changeFontSize(1.3)}
                          className={`text-xs py-1 rounded font-medium ${
                            accessibilitySettings.fontSizeMultiplier === 1.3 ? 'bg-white text-brand-primary shadow-sm font-bold' : 'text-brand-text-secondary hover:text-brand-primary'
                          }`}
                        >
                          Grd
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t text-[10px] text-brand-text-secondary text-center">
                    Cumple con la pauta WCAG 2.2 AA
                  </div>
                </div>
              )}
            </div>

            {/* Login Access Button (Hidden on small mobile screens, visible elsewhere) */}
            <button
              onClick={onLoginClick}
              className={`hidden sm:flex px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 items-center gap-1.5 ${
                accessibilitySettings.highContrast
                  ? 'bg-yellow-400 text-black border-2 border-black hover:bg-yellow-300 font-extrabold'
                  : 'bg-brand-primary text-white hover:bg-brand-intermediate shadow-sm shadow-brand-primary/10 hover:shadow-md'
              }`}
            >
              🔐 Acceso Institucional
            </button>

            {/* Mobile Hamburger Menu Button (lg:hidden) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2.5 px-3.5 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${
                accessibilitySettings.highContrast
                  ? 'border-yellow-400 text-yellow-400 bg-black hover:bg-yellow-400/20'
                  : 'border-brand-border text-brand-text-primary bg-brand-bg hover:bg-brand-light hover:border-brand-primary/40 shadow-sm'
              }`}
              title="Abrir Menú de Navegación"
            >
              <Menu className="w-5 h-5 text-brand-primary" />
              <span className="text-xs font-black uppercase tracking-wider">Menú</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Slide-out Off-canvas Drawer Overlay (Unified for Desktop & Mobile) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden animate-fade-in" role="dialog" aria-modal="true">
          {/* Backdrop overlay with blur */}
          <div 
            className="fixed inset-0 bg-brand-dark/55 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex">
            {/* Drawer Panel */}
            <div className={`w-screen max-w-md shadow-2xl flex flex-col h-full transform transition-all duration-300 ease-in-out ${
              accessibilitySettings.highContrast
                ? 'bg-black border-l-4 border-yellow-400 text-yellow-400'
                : 'bg-white border-l border-brand-border text-brand-text-primary'
            }`}>
              {/* Drawer Header */}
              <div className={`p-6 flex items-center justify-between border-b ${
                accessibilitySettings.highContrast ? 'border-yellow-400' : 'border-brand-border'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏥</span>
                  <span className={`text-base font-black tracking-tight uppercase ${
                    accessibilitySettings.highContrast ? 'text-yellow-400' : 'text-brand-dark'
                  }`}>
                    SeñaVida Menú
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-2 rounded-lg transition-all ${
                    accessibilitySettings.highContrast
                      ? 'border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black'
                      : 'hover:bg-brand-light text-brand-text-secondary hover:text-brand-dark'
                  }`}
                  title="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Nav Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-3.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${
                    accessibilitySettings.highContrast ? 'text-yellow-400/80' : 'text-brand-text-secondary'
                  }`}>
                    Navegación del Sitio
                  </span>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onNavClick(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left p-4 rounded-2xl transition-all flex gap-4 items-start ${
                            isSelected
                              ? accessibilitySettings.highContrast
                                ? 'bg-yellow-400 text-black font-black border-2 border-black'
                                : 'bg-brand-primary text-white shadow-md shadow-brand-primary/20 scale-[1.02]'
                              : accessibilitySettings.highContrast
                              ? 'border border-yellow-400 hover:bg-yellow-400/20 text-yellow-400'
                              : 'border border-brand-border/60 hover:border-brand-primary/30 hover:bg-brand-light/40 hover:translate-x-1.5'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : accessibilitySettings.highContrast
                              ? 'bg-yellow-400/10 text-yellow-400'
                              : 'bg-brand-light text-brand-primary'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-black block">{item.label}</span>
                            <span className={`text-[11px] block font-semibold leading-relaxed ${
                              isSelected 
                                ? 'text-white/80' 
                                : accessibilitySettings.highContrast 
                                ? 'text-yellow-400/75' 
                                : 'text-brand-text-secondary'
                            }`}>
                              {item.subtitle}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Access Links inside Drawer */}
                <div className={`pt-6 border-t ${
                  accessibilitySettings.highContrast ? 'border-yellow-400' : 'border-brand-border'
                } space-y-3.5`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${
                    accessibilitySettings.highContrast ? 'text-yellow-400/80' : 'text-brand-text-secondary'
                  }`}>
                    Accesos Directos
                  </span>
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      onClick={() => {
                        onLoginClick();
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-xl text-xs font-extrabold transition-all ${
                        accessibilitySettings.highContrast
                          ? 'bg-yellow-400 text-black border-2 border-black'
                          : 'bg-brand-dark text-white hover:bg-brand-primary'
                      }`}
                    >
                      🔐 Acceso Personal de Salud
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className={`p-6 border-t text-center text-[11px] font-semibold ${
                accessibilitySettings.highContrast 
                  ? 'border-yellow-400 text-yellow-400/70' 
                  : 'border-brand-border text-brand-text-secondary'
              }`}>
                SeñaVida v1.4 • Inclusividad Sin Barreras
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
