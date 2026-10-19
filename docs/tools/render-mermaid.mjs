// Renders every docs/diagrams/*.mmd to .svg and .png with the system Chrome.
// usage: node render-mermaid.mjs <diagramsDir> [name-filter]
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const dir = resolve(process.argv[2]);
const filter = process.argv[3];
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const mermaidJs = readFileSync(new URL('./node_modules/mermaid/dist/mermaid.min.js', import.meta.url), 'utf8');

const files = readdirSync(dir).filter((f) => f.endsWith('.mmd') && (!filter || f.includes(filter)));
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif}
  #out{display:inline-block;padding:16px;background:#fff}
</style></head><body><div id="out"></div><script>${mermaidJs}</script></body></html>`);
await page.evaluate(() => {
  window.mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: 'Arial, Helvetica, sans-serif',
    themeVariables: {
      primaryColor: '#e8f1e9',
      primaryBorderColor: '#14361f',
      primaryTextColor: '#111a14',
      lineColor: '#3f6a00',
      secondaryColor: '#f4f8e6',
      tertiaryColor: '#fafaf7',
      fontSize: '15px',
    },
    flowchart: { htmlLabels: true, curve: 'basis', useMaxWidth: false },
    sequence: { useMaxWidth: false, mirrorActors: false },
    er: { useMaxWidth: false },
    state: { useMaxWidth: false },
    class: { useMaxWidth: false },
    gantt: { useMaxWidth: false, useWidth: 1500, barHeight: 26, fontSize: 15, sectionFontSize: 15, leftPadding: 280 },
  });
});

let failed = 0;
for (const f of files) {
  const src = readFileSync(join(dir, f), 'utf8');
  const res = await page.evaluate(async (code) => {
    try {
      const { svg } = await window.mermaid.render('d' + Math.random().toString(36).slice(2), code);
      document.getElementById('out').innerHTML = svg;
      const el = document.querySelector('#out svg');
      const box = el.getBoundingClientRect();
      return { svg, w: box.width, h: box.height };
    } catch (e) {
      return { error: String(e.message || e) };
    }
  }, src);
  if (res.error) {
    failed++;
    console.log(`FAIL ${f}: ${res.error.slice(0, 300)}`);
    continue;
  }
  const base = join(dir, f.replace(/\.mmd$/, ''));
  writeFileSync(base + '.svg', res.svg);
  const el = await page.$('#out');
  await el.screenshot({ path: base + '.png' });
  console.log(`ok   ${f} ${Math.round(res.w)}x${Math.round(res.h)}`);
}
await browser.close();
process.exit(failed ? 1 : 0);
