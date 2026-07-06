const { execSync } = require('child_process');
const fs = require('fs');

console.log('Extracting from git HEAD:src/App.jsx...');
const content = execSync('git show HEAD:src/App.jsx', { maxBuffer: 1024 * 1024 * 10 }).toString('utf8');
const lines = content.split(/\r?\n/);

// Lines 143 to 302 (0-indexed index 142 to 301)
const extractedLines = lines.slice(142, 302);

let fileContent = extractedLines.join('\n');

// Add "export" prefix to the constants and functions
fileContent = fileContent.replace('const ALL_INSTANCE_TYPES =', 'export const ALL_INSTANCE_TYPES =');
fileContent = fileContent.replace('const REGIONAL_MULTIPLIERS =', 'export const REGIONAL_MULTIPLIERS =');
fileContent = fileContent.replace('const OS_IMAGES =', 'export const OS_IMAGES =');
fileContent = fileContent.replace('const calculateEC2Cost =', 'export const calculateEC2Cost =');

const destPath = 'src/components/EC2PricingDb.jsx';
console.log('Writing to:', destPath);
fs.writeFileSync(destPath, fileContent, 'utf8');
console.log('Done!');
