import fs from 'fs';
import path from 'path';
import { converter } from 'culori';


const toOklch = converter('oklch');
type ColorTokens = Record<string, string>;

const tokensPath = path.resolve("tokens/colors.json");
const outputDir = path.resolve("dist");

const colors = parseColorTokens(fs.readFileSync(tokensPath, 'utf-8'));

const scaleSteps: Record<string, number> = {
  50: 0.97,
  100: 0.93,
  200: 0.87,
  300: 0.80,
  400: 0.72,
  500: 0.65,
  600: 0.57,
  700: 0.49,
  800: 0.40,
  900: 0.32,
  950: 0.24
};

// Ensure output directory exists
if(!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

generateCssVariables();
generateTypeScriptTokens();
generateTailwindPresets();
console.log('✔ AdvantaCode tokens generated!');

function parseColorTokens(rawTokens: string): ColorTokens {
    const parsedTokens: unknown = JSON.parse(rawTokens);

    if (typeof parsedTokens !== 'object' || parsedTokens === null || Array.isArray(parsedTokens)) {
        throw new Error('Expected tokens/colors.json to contain a JSON object.');
    }

    const colorEntries = Object.entries(parsedTokens);

    for (const [colorName, colorValue] of colorEntries) {
        if (typeof colorValue !== 'string') {
            throw new Error(`Expected token "${colorName}" to be a string.`);
        }
    }

    return Object.fromEntries(colorEntries) as ColorTokens;
}


// Generate CSS variables
function generateCssVariables() {
    let css = `:root {\n`;

    for (const [variableName, variableValue] of Object.entries(colors)) {
        css += `  --ac-${variableName}: ${variableValue};\n`;
    }

    css += `}\n`;

    fs.writeFileSync(path.join(outputDir, 'tokens.css'), css);
}

// Generate TypeScript tokens
function generateTypeScriptTokens() {
    let ts = `export const tokens = {\n`;

    for (const [tokenName, tokenValue] of Object.entries(colors)) {
        ts += `  ${tokenName}: '${tokenValue}',\n`;
    }
    
    ts += `} as const;\n`;

    fs.writeFileSync(path.join(outputDir, 'tokens.ts'), ts);
}

// Generate Tailwind presets
function generateTailwindPresets() {
    let tailwind = 
    `export default {
        theme: {
            extend: {
                colors: {
    `;

    for (const tokenName of Object.keys(colors)) {
        tailwind += `                'ac-${tokenName}': 'var(--ac-${tokenName})',\n`;
    }
    
    tailwind += `}
            }
        }
    }
    `;

    fs.writeFileSync(path.join(outputDir, 'tailwind-preset.ts'), tailwind);
}

function generateColorScale(base: string) {
    const baseColor = toOklch(base);
    if (!baseColor) {
        throw new Error(`Unable to convert color "${base}" to oklch.`);
    }

    const scale: Record<string, string> = {};

    for (const [step, lightness] of Object.entries(scaleSteps)) {
        scale[step] = `oklch(${lightness} ${baseColor.c} ${baseColor.h})`;
    }

    return scale;
}

const palette: Record<string, any> = {};

for (const [colorName, colorValue] of Object.entries(colors)) {
    palette[colorName] = generateColorScale(colorValue);
}
