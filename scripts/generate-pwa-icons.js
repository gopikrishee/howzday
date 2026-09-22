import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/favicon.svg');
const svgBuffer = fs.readFileSync(svgPath);

// Regular standard icon SVG (fill frame)
const stdSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="howzday-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="50%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#E11D48" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#howzday-grad)" />
  <!-- Sun rays -->
  <g fill="none" stroke="#FFFFFF" stroke-width="36" stroke-linecap="round">
    <line x1="256" y1="88" x2="256" y2="128" />
    <line x1="256" y1="384" x2="256" y2="424" />
    <line x1="88" y1="256" x2="128" y2="256" />
    <line x1="384" y1="256" x2="424" y2="256" />
    <line x1="136" y1="136" x2="168" y2="168" />
    <line x1="344" y1="344" x2="376" y2="376" />
    <line x1="136" y1="376" x2="168" y2="344" />
    <line x1="344" y1="168" x2="376" y2="136" />
  </g>
  <!-- Sun core -->
  <circle cx="256" cy="256" r="88" fill="#FFFFFF" />
  <!-- Cheerful day smile -->
  <circle cx="224" cy="240" r="12" fill="#D97706" />
  <circle cx="288" cy="240" r="12" fill="#D97706" />
  <path d="M 216 272 Q 256 304 296 272" fill="none" stroke="#D97706" stroke-width="14" stroke-linecap="round" />
</svg>
`;

// Maskable icon SVG (with safe padding zone for circular/squircle cuts)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="howzday-grad-mask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="50%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#E11D48" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#howzday-grad-mask)" />
  <!-- Centered safe zone content -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <g fill="none" stroke="#FFFFFF" stroke-width="36" stroke-linecap="round">
      <line x1="256" y1="88" x2="256" y2="128" />
      <line x1="256" y1="384" x2="256" y2="424" />
      <line x1="88" y1="256" x2="128" y2="256" />
      <line x1="384" y1="256" x2="424" y2="256" />
      <line x1="136" y1="136" x2="168" y2="168" />
      <line x1="344" y1="344" x2="376" y2="376" />
      <line x1="136" y1="376" x2="168" y2="344" />
      <line x1="344" y1="168" x2="376" y2="136" />
    </g>
    <!-- Sun core -->
    <circle cx="256" cy="256" r="88" fill="#FFFFFF" />
    <!-- Cheerful day smile -->
    <circle cx="224" cy="240" r="12" fill="#D97706" />
    <circle cx="288" cy="240" r="12" fill="#D97706" />
    <path d="M 216 272 Q 256 304 296 272" fill="none" stroke="#D97706" stroke-width="14" stroke-linecap="round" />
  </g>
</svg>
`;

async function generate() {
  await sharp(Buffer.from(stdSvg)).resize(192, 192).png().toFile('public/pwa-192x192.png');
  console.log('Created public/pwa-192x192.png');

  await sharp(Buffer.from(stdSvg)).resize(512, 512).png().toFile('public/pwa-512x512.png');
  console.log('Created public/pwa-512x512.png');

  await sharp(Buffer.from(stdSvg)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  console.log('Created public/apple-touch-icon.png');

  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile('public/pwa-maskable-512x512.png');
  console.log('Created public/pwa-maskable-512x512.png');
}

generate().catch(console.error);
