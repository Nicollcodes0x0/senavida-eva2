/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Hand } from 'lucide-react';

interface AppLogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon-only';
  theme?: 'dark' | 'light' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

export const AppLogo: React.FC<AppLogoProps> = ({
  variant = 'horizontal',
  theme = 'light',
  size = 'md'
}) => {
  const isDark = theme === 'dark';
  const isWhite = theme === 'white';

  // Sizing definitions for the outer gradient badge
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-11 h-11',
    lg: 'w-20 h-20'
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl tracking-wider font-bold',
    lg: 'text-3xl tracking-widest font-extrabold'
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px] font-medium leading-tight tracking-normal',
    lg: 'text-[13px] font-medium leading-tight'
  };

  // Color classes
  const textTitleColor = isWhite
    ? 'text-white'
    : isDark
    ? 'text-white'
    : 'text-brand-dark';

  const textSubtitleColor = isWhite
    ? 'text-brand-light/80'
    : isDark
    ? 'text-brand-light/70'
    : 'text-brand-text-secondary';

  return (
    <div
      id="app-logo-wrapper"
      className={`flex select-none ${
        variant === 'vertical' ? 'flex-col items-center text-center' : 'flex-row items-center'
      } ${size === 'sm' ? 'gap-2' : size === 'lg' ? 'gap-4' : 'gap-2.5'}`}
    >
      {/* Icon composite container mirroring the Señavida logo upload: Gradient -> White Circle -> Sky Blue Circle -> Hand */}
      <div
        id="app-logo-composite-icon"
        className={`relative flex items-center justify-center rounded-2xl transition-all duration-300 hover:scale-105 shadow-md bg-gradient-to-tr from-[#7ecbeb] via-[#91ddd4] to-[#a3eed2] ${iconSizes[size]}`}
      >
        {/* Inner White Circle */}
        <div className="w-[72%] h-[72%] bg-white rounded-full flex items-center justify-center shadow-xs">
          {/* Inner Sky Blue Circle */}
          <div className="w-[80%] h-[80%] bg-[#70c1ec] rounded-full flex items-center justify-center">
            {/* White Hand Icon */}
            <Hand className="w-[58%] h-[58%] text-white stroke-[2.25] fill-none" />
          </div>
        </div>
      </div>

      {variant !== 'icon-only' && (
        <div id="app-logo-text-area" className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className={`${titleSizes[size]} font-sans uppercase tracking-widest font-black`}>
              {isWhite ? (
                <span className="text-white">Señavida</span>
              ) : (
                <>
                  <span className="text-[#51b6e6]">Seña</span>
                  <span className="text-[#1fb9a4]">vida</span>
                </>
              )}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
              isWhite || isDark
                ? 'bg-[#1fb9a4]/20 text-[#1fb9a4]'
                : 'bg-brand-turquoise/15 text-brand-turquoise-dark'
            }`}>
              Inclusivo
            </span>
          </div>
          {variant === 'horizontal' && (
            <span className={`${subtitleSizes[size]} ${textSubtitleColor} font-sans font-medium`}>
              Comunicación inclusiva en salud
            </span>
          )}
        </div>
      )}

      {variant === 'vertical' && (
        <span className={`${subtitleSizes[size]} ${textSubtitleColor} max-w-[180px] mt-1 font-sans font-medium`}>
          Comunicación inclusiva en salud
        </span>
      )}
    </div>
  );
};
