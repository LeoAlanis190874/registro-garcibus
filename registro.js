const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true
  });
  const page = await context.newPage();

  console.log('Abriendo página...');
  await page.goto('https://garcibus-production.up.railway.app/', {
    waitUntil: 'networkidle'
  });

  // Ingresar CURP
  console.log('Ingresando CURP...');
  const curpInput = await page.locator('input[type="text"], input[placeholder*="CURP"], input[placeholder*="curp"], input[name*="curp"], input[name*="CURP"]').first();
  await curpInput.fill('AAML081030HNLLNNA8');

  // Click en "Ingresar al sistema"
  console.log('Ingresando al sistema...');
  await page.locator('button:has-text("Ingresar"), a:has-text("Ingresar"), input[value*="Ingresar"]').first().click();
  await page.waitForLoadState('networkidle');

  // Seleccionar IDA CU a las 5:00 AM
  console.log('Seleccionando ida...');
  // Busca el select relacionado con "ida" o "CU"
  const idaSelect = await page.locator('select').filter({ hasText: '' }).all();
  
  // Intentar encontrar el select de ida por label cercano
  const allSelects = await page.locator('select').all();
  console.log(`Selects encontrados: ${allSelects.length}`);

  // Estrategia: buscar label con texto "ida" y seleccionar el select asociado
  let idaFound = false;
  for (const select of allSelects) {
    const id = await select.getAttribute('id') || '';
    const name = await select.getAttribute('name') || '';
    const labelText = await page.locator(`label[for="${id}"]`).textContent().catch(() => '');
    if (
      id.toLowerCase().includes('ida') || 
      name.toLowerCase().includes('ida') ||
      labelText.toLowerCase().includes('ida') ||
      id.toLowerCase().includes('cu') ||
      name.toLowerCase().includes('cu')
    ) {
      await select.selectOption({ label: /5:00\s*(AM|am)/i });
      console.log('Ida seleccionada: 5:00 AM');
      idaFound = true;
      break;
    }
  }

  if (!idaFound && allSelects.length >= 1) {
    // Fallback: primer select = ida
    await allSelects[0].selectOption({ label: /5:00\s*(AM|am)/i });
    console.log('Ida seleccionada (fallback): 5:00 AM');
  }

  // Seleccionar REGRESO García a las 16:10
  console.log('Seleccionando regreso...');
  let regresoFound = false;
  const allSelects2 = await page.locator('select').all();
  for (const select of allSelects2) {
    const id = await select.getAttribute('id') || '';
    const name = await select.getAttribute('name') || '';
    const labelText = await page.locator(`label[for="${id}"]`).textContent().catch(() => '');
    if (
      id.toLowerCase().includes('regreso') || 
      name.toLowerCase().includes('regreso') ||
      labelText.toLowerCase().includes('regreso') ||
      id.toLowerCase().includes('garcia') ||
      name.toLowerCase().includes('garcia')
    ) {
      await select.selectOption({ label: /16:10/i });
      console.log('Regreso seleccionado: 16:10');
      regresoFound = true;
      break;
    }
  }

  if (!regresoFound && allSelects2.length >= 2) {
    // Fallback: segundo select = regreso
    await allSelects2[1].selectOption({ label: /16:10/i });
    console.log('Regreso seleccionado (fallback): 16:10');
  }

  // Esperar a que aparezca el QR
  console.log('Esperando QR...');
  await page.waitForSelector('img[src*="qr"], canvas, img[alt*="QR"], img[alt*="qr"], .qr, #qr', {
    timeout: 15000
  }).catch(() => console.log('QR no detectado por selector, continuando...'));

  await page.waitForTimeout(2000);

  // Tomar screenshot para verificar
  await page.screenshot({ path: 'pantalla_qr.png', fullPage: true });
  console.log('Screenshot guardado: pantalla_qr.png');

  // Descargar QR
  console.log('Descargando QR...');
  const downloadDir = process.env.GITHUB_WORKSPACE || '.';
  
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.locator('button:has-text("Descargar"), a:has-text("Descargar"), button:has-text("descargar"), a:has-text("descargar")').first().click()
  ]);

  const suggestedFilename = download.suggestedFilename() || 'qr_registro.png';
  const savePath = path.join(downloadDir, suggestedFilename);
  await download.saveAs(savePath);
  console.log(`QR descargado: ${savePath}`);

  await browser.close();
  console.log('✅ Proceso completado exitosamente');
})();
