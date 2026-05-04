const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  console.log('Abriendo página...');
  await page.goto('https://garcibus-production.up.railway.app/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'paso1_inicio.png', fullPage: true });

  console.log('Ingresando CURP...');
  await page.locator('input').first().fill('AAML081030HNLLNNA8');
  await page.screenshot({ path: 'paso2_curp.png' });

  console.log('Ingresando al sistema...');
  await page.getByText('Ingresar al Sistema').click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'paso3_formulario.png', fullPage: true });

  // Imprimir todo el HTML del formulario para debug
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('pagina.html', html);
  console.log('HTML guardado');

  console.log('Buscando dropdowns...');
  const allElements = await page.locator('select, [role="combobox"], [role="listbox"], [class*="select"], [class*="dropdown"]').all();
  console.log(`Elementos encontrados: ${allElements.length}`);

  for (let i = 0; i < allElements.length; i++) {
    const tag = await allElements[i].evaluate(el => el.tagName);
    const cls = await allElements[i].getAttribute('class') || '';
    const role = await allElements[i].getAttribute('role') || '';
    console.log(`Elemento ${i}: tag=${tag}, role=${role}, class=${cls}`);
  }

  await browser.close();
  console.log('Debug completado - revisa los artefactos');
})();
