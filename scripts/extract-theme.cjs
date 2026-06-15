/**
 * ============================================================================
 * DYNAMIC THEME EXTRACTOR & CSS GENERATOR
 * ============================================================================
 * @file extract-theme.cjs
 * @description
 * Intercepts the Next.js build and dev pipelines to analyze the configured 
 * background image. Utilizes a node-vibrant quantization algorithm to extract 
 * the dominant color palette and dynamically generates a CSS file with native 
 * CSS variables.
 * * [PERFORMANCE]: Executing at build-time rather than client-side runtime 
 * prevents any "Flash of Unstyled Content" (FOUC) and saves the browser 
 * from performing heavy image-pixel math on every page load.
 * ============================================================================
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { Vibrant } = require('node-vibrant/node');
const fs = require('fs');

const imagePath = './public/assets/background.jpg';

console.log('[BUILD] Yìjìng OS: Analyzing background image for theme palette...');

Vibrant.from(imagePath).getPalette().then((palette) => {
  // Flatten the palette into an iterable array, filtering out any null swatches
  // (node-vibrant occasionally fails to find specific swatch types depending on the image)
  const swatches = [
    palette.Vibrant,
    palette.LightVibrant,
    palette.DarkVibrant,
    palette.Muted,
    palette.LightMuted,
    palette.DarkMuted
  ].filter(Boolean);

  let maxS = 0;
  let bestPopSwatch = null;

  // ----------------------------------------------------------------------
  // [ALGORITHMIC COLOR EXTRACTION]
  // ----------------------------------------------------------------------
  // Instead of averaging the image's saturation (which muddies the accent color 
  // if the background is mostly grey), all available swatches are iterated through 
  // to find the single most vibrant, highly-saturated color to use as the UI accent.
  swatches.forEach(s => {
    if (s.hsl[1] > maxS) {
      maxS = s.hsl[1];
      bestPopSwatch = s;
    }
  });

  // [FALLBACK CASCADE]: If standard swatches are missing, cascade down to alternatives
  // to guarantee the UI always receives a valid hex code.
  let dominantHex = '#fc2403'; // Absolute Fallback (Vermilion Red)
  let rawLight = (palette.LightVibrant || palette.LightMuted || palette.Vibrant) ? (palette.LightVibrant || palette.LightMuted || palette.Vibrant).hex : '#fdf3e8';
  let darkHex = (palette.DarkMuted || palette.DarkVibrant || palette.Muted) ? (palette.DarkMuted || palette.DarkVibrant || palette.Muted).hex : '#111313';
  let mutedHex = (palette.Muted || palette.DarkMuted || palette.LightMuted) ? (palette.Muted || palette.DarkMuted || palette.LightMuted).hex : '#71717a';

  // ----------------------------------------------------------------------
  // [ACCESSIBILITY (a11y) & UX FALLBACKS]
  // ----------------------------------------------------------------------
  // If the absolute maximum saturation of the entire image is less than 15%, 
  // the image is deemed grayscale/monotone. Standard extraction would yield 
  // invisible grey borders. Instead, high-contrast accents are forcefully injected.
  if (maxS < 0.15) {
    // Sort by pixel population to determine if the monotone image is light or dark
    const mainBg = swatches.sort((a,b) => b.population - a.population)[0];
    
    if (mainBg && mainBg.hsl[2] < 0.5) {
      console.log('  -> [DETECTED]: Monotone Dark. Applying Steel Blue highlight.');
      dominantHex = '#3b82f6'; // High-contrast against dark backgrounds
    } else {
      console.log('  -> [DETECTED]: Monotone Light/White. Applying Vermilion Red highlight.');
      dominantHex = '#fc2403'; // High-contrast against light backgrounds
    }
  } else if (bestPopSwatch) {
    console.log(`  -> [DETECTED]: Dynamic Colors. Extracting vibrant contrast (${bestPopSwatch.hex}).`);
    dominantHex = bestPopSwatch.hex;
  }

  // [CSS INJECTION]
  // Write the variables specifically to :root so they globally override theme-fallback.css
  const css = `
    :root {
      --color-sys-dominant: ${dominantHex};
      --color-sys-muted: ${mutedHex};
      --color-sys-dark: ${darkHex};
      --color-sys-light: ${rawLight};
    }
  `;

  fs.writeFileSync('./src/app/theme-dynamic.css', css);
  console.log('[BUILD] OK: Theme palette locked and CSS generated.');
}).catch(err => {
  console.error('[BUILD] FATAL: Failed to extract theme colors:', err);
});