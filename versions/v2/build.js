/* 组装自包含 index.html */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

const files = ['questions','story','readers','editor','endings','events'];
const content = {};
for (const f of files) {
  content[f] = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', f + '.json'), 'utf8'));
}

const css = ['style.css','pacing.css'].map(f=>fs.readFileSync(path.join(ROOT,'src',f),'utf8')).join('\n');
const js = ['app.js','pacing.js'].map(f=>fs.readFileSync(path.join(ROOT,'src',f),'utf8')).join('\n');

const contentJs = 'window.CONTENT = ' + JSON.stringify(content).replace(/<\//g, '<\\/') + ';';

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>盐选人生：90天写作生存战</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✍️</text></svg>">
<style>${css}</style>
</head>
<body>
<div id="app"></div>
<script>${contentJs}</script>
<script>${js}</script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');
console.log('built index.html:', html.length, 'bytes');
console.log('content sizes:', files.map(f => f + '=' + JSON.stringify(content[f]).length).join(' '));
