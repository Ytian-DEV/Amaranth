// Prints an HTML file to PDF with the system Chrome (A4, page numbers in the footer).
// usage: node print-pdf.mjs <in.html> <out.pdf> [footer title]
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const [input, output, title = 'Amaranth v2 — Documentation'] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(pathToFileURL(resolve(input)).href, { waitUntil: 'networkidle0', timeout: 120000 });
await page.pdf({
  path: output,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '18mm' },
  headerTemplate: `<div style="width:100%;font-size:7.5px;color:#556058;font-family:Arial;padding:0 18mm;text-align:right">${title}</div>`,
  footerTemplate: '<div style="width:100%;font-size:7.5px;color:#556058;font-family:Arial;text-align:center">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
});
await browser.close();
console.log('pdf ok', output);
