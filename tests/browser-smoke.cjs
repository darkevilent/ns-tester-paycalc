const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({channel:'msedge', headless:true});
  try {
    const context = await browser.newContext({ viewport:{width:1280,height:1000} });
    await context.setOffline(true);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);
    assert.match(await page.title(), /v1\.5/);
    await page.locator('#gradeSelect').selectOption('VZK');
    const initialGross = await page.locator('#grossVal').textContent();
    assert.equal(await page.locator('#hoursVal').textContent(),'76');
    assert.equal(await page.locator('#paidHoursVal').textContent(),'76.00');
    // Edit Monday, then prove Reset updates the displayed calculation.
    await page.locator('#wk1days .day-hrs').nth(1).click();
    await page.locator('.day-hrs-input').fill('12');
    await page.locator('.day-hrs-input').press('Enter');
    assert.equal(await page.locator('#hoursVal').textContent(),'78.50');
    assert.notEqual(await page.locator('#grossVal').textContent(),initialGross);
    await page.getByRole('button',{name:'Reset'}).click();
    assert.equal(await page.locator('#grossVal').textContent(),initialGross);
    const initialSuper = await page.locator('#superVal').textContent();
    const initialNet = await page.locator('#netVal').textContent();
    await page.locator('#preTaxInput').fill('1005.02');
    assert.notEqual(await page.locator('#netVal').textContent(),initialNet);
    assert.equal(await page.locator('#superVal').textContent(),initialSuper);
    await page.locator('#gradeSelect').selectOption('VB8');
    assert.notEqual(await page.locator('#grossVal').textContent(),initialGross);
    await page.locator('#gradeSelect').selectOption('VZK');
    // Leave counts as paid but not worked; Bonus/WLBP removes A440.
    await page.locator('#wk1days .type-select').nth(1).selectOption('sick');
    assert.equal(await page.locator('#hoursVal').textContent(),'66.50');
    assert.equal(await page.locator('#paidHoursVal').textContent(),'76.00');
    const sickGross = await page.locator('#grossVal').textContent();
    await page.locator('#wk1days .type-select').nth(1).selectOption('bonus_wlbp');
    assert.notEqual(await page.locator('#grossVal').textContent(),sickGross);
    await page.locator('#wk1days .type-select').nth(1).selectOption('ex_project');
    await page.getByRole('spinbutton',{name:'Site Allowance hourly rate',exact:true}).fill('3.7021');
    await page.getByRole('spinbutton',{name:'Site Allowance hourly rate',exact:true}).press('Tab');
    assert.equal(await page.getByRole('spinbutton',{name:'Site Allowance hourly rate',exact:true}).inputValue(),'3.7021');
    const excludedSuper = await page.locator('#superVal').textContent();
    const projectGross = await page.locator('#grossVal').textContent();
    await page.getByLabel('Include site allowance in super').check();
    assert.notEqual(await page.locator('#superVal').textContent(),excludedSuper);
    assert.equal(await page.locator('#grossVal').textContent(),projectGross);
    await page.getByRole('spinbutton',{name:'JumpUp-Infra hourly rate',exact:true}).fill('5.1234');
    await page.getByRole('spinbutton',{name:'JumpUp-Infra hourly rate',exact:true}).press('Tab');
    assert.equal(await page.getByRole('spinbutton',{name:'JumpUp-Infra hourly rate',exact:true}).inputValue(),'5.1234');
    await page.locator('#wk1days .type-select').nth(4).selectOption('rostered_ph');
    await page.locator('#wk1days .type-select').nth(5).selectOption('pholeave');
    assert.equal(await page.locator('#bdRows .bd-desc').filter({hasText:/^Rostered PH/}).count(),1);
    assert.equal(await page.locator('#bdRows .bd-desc').filter({hasText:/^Non Rostered PH/}).count(),1);
    assert.equal(await page.getByText('Unworked PH (rostered / non-rostered)',{exact:false}).count(),0);
    fs.mkdirSync(path.join(__dirname,'../tmp/browser'),{recursive:true});
    await page.screenshot({path:path.join(__dirname,'../tmp/browser/desktop.png'),fullPage:true});
    for (const width of [390,320]) {
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`overflow at ${width}px`);
      await page.screenshot({path:path.join(__dirname,`../tmp/browser/mobile-${width}.png`),fullPage:true});
    }
    await page.locator('#gradeSelect').selectOption('');
    assert.equal(await page.locator('#resultSec').isVisible(),false);
    assert.equal(await page.locator('#schedSec').isVisible(),false);
    assert.deepEqual(errors,[]);
    console.log('PASS: offline file opening; schedule edits; reset; grades; deductions; leave; four-decimal allowance edits; site super option; 390px/320px layouts; no script errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
