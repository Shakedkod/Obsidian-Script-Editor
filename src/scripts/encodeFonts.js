/**
 * Run this script with: node scripts/encodeFonts.js
 * 
 * Place your font files in a 'fonts' directory:
 * - fonts/Regular.ttf
 * - fonts/RegularHe.ttf
 * - fonts/Bold.ttf
 * - fonts/BoldHe.ttf
 */

const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, './fonts');
const outputFile = path.join(__dirname, '../services/fonts.ts');

const fontFiles = {
    regular: 'Regular.otf',
    regularHe: 'HeRegular.ttf',
    bold: 'Bold.ttf',
    boldHe: 'HeBold.ttf',
};

const encodedFonts = {};

for (const [key, filename] of Object.entries(fontFiles)) {
    const fontPath = path.join(fontsDir, filename);
    const fontBuffer = fs.readFileSync(fontPath);
    const base64 = fontBuffer.toString('base64');
    encodedFonts[key] = `data:font/ttf;base64,${base64}`;
}

const output = `// fonts.ts - Auto-generated font file
// Generated on: ${new Date().toISOString()}

export const FONTS = {
    regular: '${encodedFonts.regular}',
    regularHe: '${encodedFonts.regularHe}',
    bold: '${encodedFonts.bold}',
    boldHe: '${encodedFonts.boldHe}',
};
`;

fs.writeFileSync(outputFile, output);
console.log('Fonts encoded successfully to src/fonts.ts');