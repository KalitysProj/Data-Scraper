const puppeteer = require('puppeteer');

async function inspectINPI() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  });

  const page = await browser.newPage();

  try {
    console.log('📍 Navigation vers data.inpi.fr...');
    await page.goto('https://data.inpi.fr/', { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('\n📋 Structure de la page:');

    await page.waitForTimeout(3000);

    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        searchInputs: Array.from(document.querySelectorAll('input[type="text"], input[type="search"]')).map(el => ({
          id: el.id,
          name: el.name,
          placeholder: el.placeholder,
          class: el.className
        })),
        buttons: Array.from(document.querySelectorAll('button, input[type="submit"]')).map(el => ({
          text: el.textContent?.trim().substring(0, 50),
          class: el.className,
          type: el.type
        })),
        links: Array.from(document.querySelectorAll('a[href*="entreprise"], a[href*="recherche"], a[href*="avance"]')).map(el => ({
          text: el.textContent?.trim(),
          href: el.href
        }))
      };
    });

    console.log(JSON.stringify(pageInfo, null, 2));

    console.log('\n🔍 Recherche du lien vers la recherche avancée...');
    const advancedSearchLink = pageInfo.links.find(l =>
      l.text?.includes('avancée') || l.text?.includes('Avancée') || l.href?.includes('avancee')
    );

    if (advancedSearchLink) {
      console.log(`✅ Trouvé: ${advancedSearchLink.href}`);
      console.log('\n📍 Navigation vers recherche avancée...');

      await page.goto(advancedSearchLink.href, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(3000);

      const advancedPageInfo = await page.evaluate(() => {
        return {
          url: window.location.href,
          formInputs: Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
            tag: el.tagName,
            type: el.type,
            id: el.id,
            name: el.name,
            placeholder: el.placeholder,
            label: el.labels?.[0]?.textContent?.trim()
          })),
          selectors: {
            forms: Array.from(document.querySelectorAll('form')).map(f => ({
              action: f.action,
              method: f.method,
              id: f.id,
              class: f.className
            }))
          }
        };
      });

      console.log('\n📋 Formulaire de recherche avancée:');
      console.log(JSON.stringify(advancedPageInfo, null, 2));

      console.log('\n🔍 Test de recherche...');

      const apeCodeInput = await page.$('input[name*="ape"], input[id*="ape"], input[placeholder*="APE"]');
      const deptInput = await page.$('input[name*="departement"], input[name*="dept"], select[name*="departement"]');

      if (apeCodeInput && deptInput) {
        console.log('✅ Champs APE et département trouvés!');

        await apeCodeInput.type('6201Z');
        await deptInput.type('75');

        await page.waitForTimeout(1000);

        const submitButton = await page.$('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          console.log('🚀 Lancement de la recherche...');
          await submitButton.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

          const resultsInfo = await page.evaluate(() => {
            return {
              url: window.location.href,
              resultItems: Array.from(document.querySelectorAll('[class*="result"], [class*="company"], [class*="entreprise"], .card, .item, article, li')).slice(0, 3).map(el => ({
                classes: el.className,
                html: el.innerHTML.substring(0, 500)
              })),
              pagination: Array.from(document.querySelectorAll('[class*="pagination"], [class*="pager"]')).map(el => ({
                classes: el.className,
                html: el.innerHTML.substring(0, 300)
              }))
            };
          });

          console.log('\n📊 Structure des résultats:');
          console.log(JSON.stringify(resultsInfo, null, 2));
        }
      } else {
        console.log('❌ Champs APE ou département non trouvés');
      }
    }

    console.log('\n⏸️  Le navigateur reste ouvert pour inspection manuelle. Appuyez sur Ctrl+C pour fermer.');
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await browser.close();
  }
}

inspectINPI();