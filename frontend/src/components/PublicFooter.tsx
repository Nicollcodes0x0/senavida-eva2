/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppLogo } from './AppLogo';
import { Heart, ShieldCheck, Accessibility, FileText, Globe } from 'lucide-react';

interface PublicFooterProps {
  onNavClick: (sectionId: string) => void;
  onLoginClick: () => void;
  highContrast?: boolean;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onNavClick,
  onLoginClick,
  highContrast = false
}) => {
  return (
    <footer
      id="public-footer"
      className={`border-t transition-colors duration-300 ${
        highContrast
          ? 'bg-black text-yellow-400 border-yellow-400'
          : 'bg-brand-dark text-white border-brand-border/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand block */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <AppLogo variant="horizontal" theme="white" size="md" />
            <p className="text-sm text-brand-light/70 max-w-sm mt-3 leading-relaxed">
              SEÑAVIDA es una plataforma de apoyo y mediación comunicacional diseñada para garantizar una consulta autónoma, inclusiva y transparente en servicios sanitarios de urgencia.
            </p>
            <div className="flex items-center gap-3.5 pt-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-brand-light">
                <Accessibility className="w-4 h-4 text-brand-turquoise" /> WCAG 2.2 AA
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-brand-light">
                <ShieldCheck className="w-4 h-4 text-brand-turquoise" /> Ley N° 20.584 Chile
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-brand-light">
                <Globe className="w-4 h-4 text-brand-turquoise" /> Datos Locales
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-bold text-brand-light tracking-wider uppercase mb-4">
              Navegación
            </h3>
            <ul className="space-y-2 text-sm">
              {['inicio', 'que-es', 'como-funciona', 'pictogramas', 'seguridad', 'faq'].map((section) => (
                <li key={section}>
                  <button
                    onClick={() => onNavClick(section)}
                    className="text-brand-light/80 hover:text-brand-turquoise hover:underline transition-colors capitalize text-left"
                  >
                    {section.replace('-', ' ')}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional links */}
          <div>
            <h3 className="text-sm font-bold text-brand-light tracking-wider uppercase mb-4">
              Área Profesional
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  onClick={onLoginClick}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary text-white font-semibold text-xs hover:bg-brand-intermediate transition-colors"
                >
                  🔐 Ingresar al Sistema
                </button>
              </li>
              <li className="text-xs text-brand-light/50 pt-2 leading-relaxed">
                Desarrollado para redes asistenciales públicas y privadas de salud en Chile.
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-light/50">
          <p>© 2026 SEÑAVIDA. Todos los derechos reservados. Tecnología asistiva sin almacenamiento de datos biométricos.</p>
          <div className="flex gap-4">
            <a href="#terminos" className="hover:underline hover:text-brand-turquoise">Términos de Uso</a>
            <a href="#privacidad" className="hover:underline hover:text-brand-turquoise">Política de Privacidad</a>
            <span className="flex items-center gap-1 text-brand-turquoise">
              <Heart className="w-3.5 h-3.5 fill-current" /> Salud para Todos
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
