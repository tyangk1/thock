// Playwright snippet (browser_run_code_unsafe filename): exercise THOCK and screenshot each part.
async (page) => {
  const W = page.viewportSize().width;
  const P = W <= 500 ? 'm390' : 'd1440';
  const dir = 'C:/Users/CANAWAN PC/Code_SID-Corp/landing-lab/builds/thock/lab/shots';
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:4513/?t=' + Date.now());
  await page.evaluate(() => localStorage.removeItem('thock.box.v1'));
  await page.waitForFunction(() => !document.getElementById('loader'), null, { timeout: 40000 });
  await page.waitForTimeout(500);
  const shot = (n) => page.screenshot({ path: `${dir}/${P}-${n}.png` });
  await shot('hero-0');
  // type for real
  if (W > 500) { await page.mouse.move(700, 300); for (const ch of 'HELLO THOCK') { await page.keyboard.press(ch === ' ' ? 'Space' : `Key${ch}`); await page.waitForTimeout(90); } }
  else { for (const ch of 'HELLO') { await page.locator(`.key[data-code="Key${ch}"]`).dispatchEvent('pointerdown'); await page.evaluate(() => dispatchEvent(new Event('pointerup'))); await page.waitForTimeout(90); } }
  await page.waitForTimeout(1800);
  await shot('hero-typed');
  const typed = await page.textContent('#typed');
  const caps = await page.evaluate(() => window.__thock.kb.phys.count());
  for (const f of [.15, .55, .95]) { await page.evaluate((f) => window.__thock.el('.xray', f), f); await page.waitForTimeout(1200); await shot(`xray-${f}`); }
  await page.evaluate(() => window.__thock.y(document.getElementById('switches').getBoundingClientRect().top + scrollY - 40)); await page.waitForTimeout(900); await shot('switches');
  await page.evaluate(() => window.__thock.y(document.getElementById('colors').getBoundingClientRect().top + scrollY)); await page.waitForTimeout(900);
  await page.click('.cw[data-cw="ink"]'); await page.waitForTimeout(330); await shot('colors-slam'); await page.waitForTimeout(1300); await shot('colors-ink');
  const theme = await page.evaluate(() => document.body.dataset.theme);
  await page.evaluate(() => window.__thock.y(document.querySelector('.riso').getBoundingClientRect().top + scrollY)); await page.waitForTimeout(900);
  if (W > 500) { const b = await page.locator('.ph').nth(1).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(600); }
  await shot('riso');
  await page.evaluate(() => window.__thock.y(document.getElementById('race').getBoundingClientRect().top + scrollY)); await page.waitForTimeout(900);
  await page.click('#raceStart'); await page.waitForTimeout(1200);
  const txt = await page.evaluate(() => document.getElementById('raceText').textContent.replace(/\u00a0/g, ' '));
  for (const ch of txt.slice(0, 22)) { await page.keyboard.type(ch); await page.waitForTimeout(40); }
  await page.waitForTimeout(400); await shot('race');
  const wpm = await page.textContent('#wpm');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__thock.y(document.getElementById('build').getBoundingClientRect().top + scrollY)); await page.waitForTimeout(900);
  await page.locator('label:has(input[name="case"][value="pop"])').click(); await page.locator('label:has(input[name="artisan"])').click();
  await page.waitForTimeout(500); const price = await page.textContent('#buildPrice');
  await page.click('#buildForm button[type="submit"]'); await page.waitForTimeout(1400);
  await shot('build'); const count = await page.textContent('#boxCount');
  await page.click('#boxBtn'); await page.waitForTimeout(600); await shot('drawer'); await page.keyboard.press('Escape');
  await page.evaluate(() => window.__thock.y(document.body.scrollHeight)); await page.waitForTimeout(900); await shot('footer');
  const ov = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  return { errors, typed, caps, theme, wpm, price, count, ov };
}
