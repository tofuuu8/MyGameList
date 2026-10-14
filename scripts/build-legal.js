// Builds simple web pages for the Privacy Policy and Terms (for GitHub Pages or any website).
// Run:  node scripts/build-legal.js
const fs = require('fs');
const path = require('path');
const features = require('../src/features');
const config = { ...require('../src/legal/config'), googleSignIn: features.googleSignIn };
const { getPrivacyPolicy, getTerms } = require('../src/legal/content');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function render(doc) {
  const parts = [];
  doc.sections.forEach((s) => {
    parts.push(`<h2>${esc(s.heading)}</h2>`);
    let list = [];
    const flush = () => { if (list.length) { parts.push(`<ul>${list.join('')}</ul>`); list = []; } };
    s.body.forEach((line) => {
      if (line.startsWith('• ')) list.push(`<li>${esc(line.slice(2))}</li>`);
      else { flush(); parts.push(`<p>${esc(line)}</p>`); }
    });
    flush();
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(doc.title)} - ${esc(config.appName)}</title>
<style>
  :root { --bg:#fff; --text:#0a0a0a; --muted:#5e5e5e; --red:#d91c29; --line:#e2e2e2; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0a0a0a; --text:#fff; --muted:#a3a3a3; --red:#ff4b55; --line:#2c2c2c; } }
  body { margin:0; background:var(--bg); color:var(--text); font:16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width:720px; margin:0 auto; padding:32px 20px 64px; }
  .brand { color:var(--red); font-weight:700; letter-spacing:-0.02em; }
  h1 { font-size:2rem; margin:8px 0 4px; }
  h2 { font-size:1.15rem; margin:32px 0 8px; padding-top:16px; border-top:1px solid var(--line); }
  .updated { color:var(--muted); margin:0 0 8px; }
  li { margin:6px 0; }
</style>
</head>
<body>
<main>
<div class="brand">${esc(config.appName)}</div>
<h1>${esc(doc.title)}</h1>
<p class="updated">${esc(doc.updated)}</p>
${parts.join('\n')}
</main>
</body>
</html>
`;
}

const out = path.join(__dirname, '..', 'legal');
fs.mkdirSync(out, { recursive: true });
const home = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(config.appName)}</title>
<style>
  :root { --bg:#fff; --text:#0a0a0a; --muted:#5e5e5e; --red:#d91c29; --line:#e2e2e2; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0a0a0a; --text:#fff; --muted:#a3a3a3; --red:#ff4b55; --line:#2c2c2c; } }
  body { margin:0; background:var(--bg); color:var(--text); font:16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width:720px; margin:0 auto; padding:64px 20px; }
  h1 { font-size:2.5rem; margin:0; letter-spacing:-0.03em; } h1 span { color:var(--red); }
  .tag { color:var(--muted); font-size:1.15rem; margin:4px 0 32px; }
  a { color:var(--red); } nav { margin-top:32px; padding-top:16px; border-top:1px solid var(--line); display:flex; gap:20px; flex-wrap:wrap; }
</style>
</head>
<body>
<main>
<h1><span>My</span>GameList</h1>
<p class="tag">Your Games, Your Journey.</p>
<p>${esc(config.appName)} is a mobile app for keeping track of your PC game library. Add the games you own, mark what you are playing, finished or want to play, record ratings and hours, see which games your PC can run, and discover new games.</p>
<nav>
  <a href="privacy.html">Privacy Policy</a>
  <a href="terms.html">Terms of Service</a>
  <a href="mailto:${esc(config.contactEmail)}">Contact: ${esc(config.contactEmail)}</a>
</nav>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(out, 'index.html'), home);
fs.writeFileSync(path.join(out, 'privacy.html'), render(getPrivacyPolicy(config)));
fs.writeFileSync(path.join(out, 'terms.html'), render(getTerms(config)));
console.log('Wrote legal/index.html, legal/privacy.html and legal/terms.html');
