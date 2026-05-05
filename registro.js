const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  console.log('Abriendo página...');
  await page.goto('https://garcibus-production.up.railway.app/', { waitUntil: 'networkidle' });

  console.log('Ingresando CURP...');
await page.locator('input[type="text"], input:not([type="hidden"])').first().fill('AAML081030HNLLNNA8');
  
  console.log('Clic en Ingresar...');
  await page.getByText('Ingresar al Sistema').click();

  console.log('Esperando formulario...');
  await page.waitForSelector('select', { timeout: 15000 });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
  const selects = document.querySelectorAll('select');
  const ida = selects[0];
  for (let opt of ida.options) {
    if (opt.text.includes('05:00')) { ida.value = opt.value; ida.dispatchEvent(new Event('change', { bubbles: true })); break; }
  }
  const regreso = selects[1];
  for (let opt of regreso.options) {
    if (opt.text.includes('16:10')) { regreso.value = opt.value; regreso.dispatchEvent(new Event('change', { bubbles: true })); break; }
  }
});

  await page.screenshot({ path: 'seleccionado.png', fullPage: true });

  console.log('Generando boleto...');
  await page.getByText('Generar boleto').click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'qr_pantalla.png', fullPage: true });

  console.log('Descargando QR...');
  try {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 8000 }),
      page.getByText('Descargar').click()
    ]);
    await download.saveAs('qr_boleto.' + (download.suggestedFilename().split('.').pop() || 'png'));
    console.log('QR descargado correctamente');
  } catch (e) {
    console.log('Intentando guardar imagen directamente...');
    const img = page.locator('img').last();
    const src = await img.getAttribute('src').catch(() => '');
    if (src.startsWith('data:')) {
      fs.writeFileSync('qr_boleto.png', Buffer.from(src.split(',')[1], 'base64'));
      console.log('QR guardado desde base64');
    } else {
      await img.screenshot({ path: 'qr_boleto.png' });
      console.log('QR capturado como screenshot');
    }
  }
console.log('Enviando QR por WhatsApp...');
  const imageUrl = 'https://raw.githubusercontent.com/LeoAlanis190874/registro-garcibus/principal/qr_boleto.png';
  const mensaje = encodeURIComponent('🚌 Tu boleto GarciBús está listo! Abre este link para ver tu QR: ' + imageUrl);
  await fetch(`https://api.callmebot.com/whatsapp.php?phone=5215660519285&text=${mensaje}&apikey=8925663`);
  console.log('WhatsApp enviado');
  await browser.close();
  console.log('✅ Listo');
})();
