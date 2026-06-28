/**
 * ============================================================================
 * SVG ICON ASSET LIBRARY & FACTORY
 * ============================================================================
 * @file icons.tsx
 * @description
 * Contains all SVG assets converted into functional React components. 
 * By using inline SVGs instead of <img> tags, this allows Tailwind CSS to 
 * dynamically manipulate the 'currentColor' fill based on hover states and themes.
 * * @note Icons sourced from KDE Breeze (https://invent.kde.org/frameworks/breeze-icons)
 * Licensed under LGPL-2.1-or-later.
 * ============================================================================
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
// ----------------------------------------------------------------------
// DESKTOP APPS
// ----------------------------------------------------------------------
export const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 22 22" fill="currentColor" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <path d="M 11 3 A 3.9999902 4.0000296 0 0 0 7 7 A 3.9999902 4.0000296 0 0 0 11 11 A 3.9999902 4.0000296 0 0 0 15 7 A 3.9999902 4.0000296 0 0 0 11 3 z M 11 4 A 3 3.0000296 0 0 1 14 7 A 3 3.0000296 0 0 1 11 10 A 3 3.0000296 0 0 1 8 7 A 3 3.0000296 0 0 1 11 4 z M 11 12 A 7.9999504 8.0000296 0 0 0 3.0722656 19 L 4.0800781 19 A 6.9999604 7.0000296 0 0 1 11 13 A 6.9999604 7.0000296 0 0 1 17.921875 19 L 18.929688 19 A 7.9999504 8.0000296 0 0 0 11 12 z "/>
  </svg>
);

export const SkillsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 22 22" fill="currentColor" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 4v2H3v4h16V6h-4V4zm1 1h6v1H8zm-5 6v7h16v-7h-5v2H8v-2zm6 0v1h4v-1z"/>
  </svg>
);

export const WorksIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 22 22" fill="currentColor" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <path d="M 3 3 L 3 4 L 3 19 L 4 19 L 19 19 L 19 18 L 19 5 L 12 5 L 10 3 L 10 3 L 10 3 L 4 3 L 3 3 z M 4 4 L 7 4 L 9.6 4 L 10.6 5 L 6.6 9 L 6.6 9 L 4 9 L 4 4 z M 9 8 L 18 8 L 18 18 L 4 18 L 4 10 L 5.6 10 L 7 10 L 7 10 L 7 10 L 9 8 z "/>
  </svg>
);

export const ContactIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 22 22" fill="currentColor" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <path d="m 1,3 0,1 0,8 0,6 0,0.414062 L 1,19 l 1,0 6,0 6,0 6,0 1,0 0,-0.585938 L 21,18 21,12 21,3 20.951172,3 20,3 19.537109,3 2.4628906,3 2,3 1,3 Z M 2,4 2.0488281,4 2.2714844,4.2226562 8.0234375,9.9765625 6,12 2,16 2,12 2,4.2226562 2,4 Z M 3.4628906,4 18.537109,4 11,11.537109 3.4628906,4 Z M 19.951172,4 20,4 20,4.2226562 20,12 20,16 16,12 13.976562,9.9765625 19.728516,4.2226562 19.951172,4 Z m -11.2207032,6.683594 1.4531252,1.451172 0.814453,0.814453 0.002,0 0.816406,-0.814453 1.453125,-1.451172 L 14.585938,12 19.537109,16.951172 20,17.414062 20,18 14,18 8,18 2,18 2,17.414062 2.4628906,16.951172 7.4140625,12 8.7304688,10.683594 Z"/>
  </svg>
);

export const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

export const MindmapIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} viewBox="0 0 600 600" fill="currentColor" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0,600) scale(0.1,-0.1)" stroke="none">
      <path d="M1325 5793 c-394 -84 -677 -456 -652 -855 24 -376 290 -686 656 -764 144 -30 353 -11 482 44 l47 20 30 -31 c16 -18 118 -137 225 -265 l196 -233 -46 -67 c-62 -90 -110 -197 -140 -312 -44 -167 -34 -420 23 -556 8 -18 14 -40 14 -48 0 -11 -584 -406 -623 -422 -7 -2 -37 14 -67 37 -128 96 -258 139 -420 139 -318 0 -584 -203 -669 -510 -26 -92 -28 -257 -6 -345 88 -340 415 -567 756 -524 327 41 570 288 608 617 8 66 0 187 -15 234 -4 15 56 59 320 233 l326 216 79 -65 c136 -110 281 -178 451 -210 46 -9 86 -18 88 -21 6 -6 71 -594 72 -645 0 -32 -4 -37 -53 -62 -225 -118 -363 -365 -343 -616 12 -158 72 -288 186 -403 133 -134 300 -197 489 -186 180 11 314 76 439 212 227 248 215 636 -28 876 -79 78 -199 150 -275 165 -19 3 -35 9 -35 13 0 4 -16 150 -35 325 -19 175 -35 329 -35 343 0 16 8 27 28 35 170 69 264 130 379 246 l85 85 187 -92 c102 -50 199 -97 214 -104 15 -6 29 -21 31 -32 2 -11 9 -46 14 -78 45 -240 290 -424 539 -403 271 22 473 241 473 511 0 237 -156 440 -385 500 -159 41 -342 -4 -468 -115 l-48 -43 -195 96 c-107 53 -194 101 -194 107 0 6 7 54 16 108 20 122 13 253 -20 384 -25 97 -78 224 -116 278 l-21 30 396 396 c218 218 401 393 408 391 162 -69 223 -82 351 -74 258 15 471 175 564 425 33 90 42 266 18 362 -26 104 -81 204 -153 280 -82 88 -155 136 -263 174 -77 27 -97 30 -205 30 -105 0 -130 -3 -200 -28 -212 -73 -364 -235 -421 -447 -32 -120 -17 -316 31 -409 14 -26 10 -30 -389 -429 l-403 -402 -52 30 c-69 41 -152 76 -248 103 -68 20 -100 23 -253 22 -161 0 -182 -2 -263 -27 -48 -15 -115 -41 -149 -58 -33 -17 -64 -27 -68 -22 -102 116 -430 515 -430 523 0 6 14 31 31 56 45 65 86 158 110 249 29 111 29 289 0 399 -83 315 -334 551 -649 612 -94 18 -237 17 -327 -3z m245 -364 c175 -28 319 -161 365 -334 66 -255 -104 -512 -369 -558 -187 -32 -385 73 -473 251 -38 75 -38 77 -38 196 0 117 1 123 34 191 65 132 194 231 331 254 76 12 77 12 150 0z m3522 -191 c50 -15 122 -78 151 -132 30 -58 31 -174 0 -232 -107 -201 -383 -197 -478 8 -64 137 4 300 149 355 41 15 129 16 178 1z m-1826 -1573 c200 -67 348 -228 400 -434 24 -96 16 -243 -19 -341 -32 -91 -102 -196 -171 -256 -59 -51 -186 -116 -266 -135 -70 -17 -199 -16 -270 1 -132 31 -266 118 -346 223 -93 122 -129 244 -121 402 9 162 61 280 177 395 164 164 396 219 616 145z m1621 -1257 c20 -12 38 -35 49 -64 22 -58 8 -109 -41 -153 -29 -25 -44 -31 -83 -31 -106 0 -169 95 -129 193 17 39 36 55 84 72 43 15 74 11 120 -17z m-3706 -330 c66 -30 129 -92 160 -156 18 -38 23 -64 23 -132 0 -73 -4 -92 -27 -138 -35 -67 -89 -121 -152 -152 -72 -35 -198 -35 -270 0 -63 31 -117 85 -152 152 -24 46 -28 64 -27 138 0 72 4 93 27 137 82 158 261 223 418 151z m2224 -1007 c101 -46 159 -133 158 -241 0 -77 -17 -122 -68 -178 -52 -59 -113 -85 -194 -85 -149 0 -261 112 -261 260 0 106 51 192 142 237 65 32 161 35 223 7z"/>
    </g>
  </svg>
);

// ----------------------------------------------------------------------
// WINDOW CONTROLS
// ----------------------------------------------------------------------
export const MinimizeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 22 22" fill="currentColor" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <path d="m3.707031 7l-.707031.707031 6.125 6.125 1.875 1.875 1.875-1.875 6.125-6.125-.707031-.707031-6.125 6.125-1.167969 1.167969-1.167969-1.167969-6.125-6.125"/>
  </svg>
);

export const MaximizeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 22 22" fill="currentColor" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.707 15L3 14.293l6.125-6.125L11 6.293l1.875 1.875L19 14.293l-.707.707-6.125-6.125L11 7.707 9.832 8.875 3.707 15"/>
  </svg>
);

export const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 22 22" fill="currentColor" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <g strokeLinecap="square">
      <path d="m6 6 10 10m-10 0 10-10"/>
      <path d="M 6,5.1523437 5.1523437,6 10.152344,11 5.1523437,16 6,16.847656 l 5,-5 5,5 L 16.847656,16 l -5,-5 5,-5 L 16,5.1523437 11,10.152344 Z"/>
    </g>
  </svg>
);

// ----------------------------------------------------------------------
// TASKBAR & SYSTEM TRAY
// ----------------------------------------------------------------------
export const StartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <path transform="translate(-22, 0)" d="M 32 4 A 1.5 1.5 0 0 0 30.5 5.5 A 1.5 1.5 0 0 0 32 7 A 1.5 1.5 0 0 0 33.5 5.5 A 1.5 1.5 0 0 0 32 4 z M 42.5 4 L 39.5 7 L 44 11.5 L 39.5 16 L 42.5 19 L 50 11.5 L 42.5 4 z M 28.5 13 A 2.5 2.5 0 0 0 26 15.5 A 2.5 2.5 0 0 0 28.5 18 A 2.5 2.5 0 0 0 31 15.5 A 2.5 2.5 0 0 0 28.5 13 z M 35 22 A 3 3 0 0 0 32 25 A 3 3 0 0 0 35 28 A 3 3 0 0 0 38 25 A 3 3 0 0 0 35 22 z "/>
  </svg>
);

export const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 22 22" fill="currentColor" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <path d="m11 3c-4.431998 0-8 3.568002-8 8 0 4.431998 3.568002 8 8 8 4.431998 0 8-3.568002 8-8 0-4.431998-3.568002-8-8-8m0 1c3.877999 0 7 3.122001 7 7 0 3.877999-3.122001 7-7 7-3.877999 0-7-3.122001-7-7 0-3.877999 3.122001-7 7-7m-1 1v7h1 5v-1h-5v-6h-1"/>
  </svg>
);

export function getIconRenderer(iconName: string) {
  switch(iconName.toLowerCase()) {
    case 'user': return UserIcon;
    case 'skills': return SkillsIcon;
    case 'works': return WorksIcon;
    case 'contact': return ContactIcon;
    case 'github': return GithubIcon;
    case 'mindmap': return MindmapIcon;
  }

  // Type-safe dynamic import from Lucide
  const formattedName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  const LucideIcon = LucideIcons[formattedName as keyof typeof LucideIcons] as React.ElementType;

  return LucideIcon || WorksIcon; 
}