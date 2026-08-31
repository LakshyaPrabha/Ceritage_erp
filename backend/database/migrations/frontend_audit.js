const fs = require('fs');
const path = require('path');
const dir = '../frontend/src/pages/modules';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const report = files.map(f => {
  const code = fs.readFileSync(path.join(dir, f), 'utf8');
  const lines = code.split('\n').length;
  const matches = [
    ...code.matchAll(/apiRequest\(\s*["'`]([^"'`?]+)/g),
    ...code.matchAll(/fetch\(\s*`\$\{API_BASE\}([^`?]+)/g),
    ...code.matchAll(/fetch\(\s*`\$\{API\}([^`?]+)/g),
    ...code.matchAll(/fetch\(\s*API\s*\+\s*["']([^"'?]+)/g),
    ...code.matchAll(/fetch\(\s*API_BASE\s*\+\s*["']([^"'?]+)/g),
    ...code.matchAll(/fetch\(\s*["'](\/api\/[^"'?]+)["']/g)
  ];
  const uniqueApis = [...new Set(matches.map(m => m[1]))];
  return {
    file: f,
    lines,
    uniqueApis
  };
});

report.sort((a, b) => b.lines - a.lines);
console.log('=== ACCURATE FRONTEND MODULE API INTEGRATION AUDIT ===');
report.forEach(r => {
  const apis = r.uniqueApis.length > 0 ? r.uniqueApis.join(', ') : 'MOCK / STATIC UI ONLY';
  console.log(`• ${r.file.padEnd(20)}: ${String(r.lines).padStart(4)} lines | APIs: ${apis}`);
});
