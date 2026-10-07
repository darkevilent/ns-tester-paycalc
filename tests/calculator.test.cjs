const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { fixtures, schedule } = require('./fixtures.cjs');
const payElements = require('./pay-elements.json');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const context = vm.createContext({});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const api = vm.runInContext('({calculatePay,resolveRates,currentPeriodIdx,getScale2Schedule,estimateTax,PAY_GRADES,TESTING_ALLOW_RATES,getSuperConcessionalCap})', context);
const date = s => new Date(s + 'T12:00:00');
const calc = (entries, options = {}) => api.calculatePay({ entries,
  rates: api.resolveRates('VZK', 6), taxSchedule: api.getScale2Schedule(date('2026-10-07')), ...options });
const line = (result, code) => result.lines.find(l => l.code === code);

for (const fixture of fixtures) {
  test(`regular pay reconciliation ${fixture.periodEnd}`, () => {
    const result = calc(fixture.entries, { deductions: 1005.02,
      rates: api.resolveRates('VZK', api.currentPeriodIdx(date(fixture.periodEnd))),
      taxSchedule: api.getScale2Schedule(date(fixture.paymentDate)),
      siteRate: fixture.siteRate, siteInSuper: fixture.siteInSuper });
    for (const [key, expected] of Object.entries(fixture.expected)) assert.equal(result[key], expected, key);
    const amounts = Object.fromEntries(result.lines.map(line => [line.code, line.amount]));
    assert.deepEqual(amounts, payElements[fixture.periodEnd], 'every source pay element');
    assert.equal(Math.round(result.lines.reduce((sum,l) => sum + l.amount,0)*100), Math.round(result.gross*100));
    if (fixture.recordedSuper === fixture.expected.superAmount) assert.equal(result.superAmount, fixture.recordedSuper);
  });
}

test('ten regular super records reconcile; capped and adjustment payments are separate', () => {
  assert.equal(fixtures.filter(f => f.recordedSuper === f.expected.superAmount).length, 10);
  assert.equal(fixtures[2].recordedSuper, 1388.13);
  assert.equal(fixtures[3].recordedSuper, null);
  const adjustment = { periodEnd:'2026-06-23', recordedSuper:747.95 };
  const result = calc([], { deductions:0 });
  for (const key of ['gross','taxable','tax','net','superBase','superAmount','workedHours','paidBaseHours']) assert.equal(result[key],0,key);
  assert.notEqual(result.superAmount, adjustment.recordedSuper);
});

test('daily annual/sick rounding and full precision percentage rates', () => {
  const annual = calc(schedule({annual_weekday:28.5,annual_sunday:9.5}), { rates:api.resolveRates('VZK',5) });
  assert.equal(line(annual,'annual').amount,4024.24);
  assert.equal(line(annual,'annualExcess').amount,301.83);
  assert.equal(line(annual,'annualSunday').amount,804.85);
  assert.equal(line(annual,'annualLoading').amount,804.85);
  assert.equal(line(calc(schedule({sick:19})),'sick').amount,2047.32);
  assert.equal(line(calc(schedule({weekday:57})),'night').rate,107.7541*0.30);
});

test('PH Worked components reconcile and A440 stays in super', () => {
  const result = calc([{type:'ph_worked',hours:5}], {rates:api.resolveRates('VZK',5)});
  assert.equal(line(result,'phWorked').amount,529.50);
  assert.equal(line(result,'phPenalty').amount,794.26);
  assert.equal(result.superBase,line(result,'a440').amount);
});

for (const type of ['weekday','sunday','ex_project','overtime','ph_worked','rostered_ph','pholeave','sick','annual_leave','bonus_wlbp','dayoff']) {
  test(`A440 and hours eligibility: ${type}`, () => {
    const result = calc([{type,hours:9.5,day:'MON'}]);
    const isPaid = type !== 'dayoff';
    const eligible = isPaid && type !== 'bonus_wlbp';
    const worked = ['weekday','sunday','ex_project','overtime','ph_worked'].includes(type);
    assert.equal(line(result,'a440')?.hours ?? 0,eligible ? 9.5 : 0);
    assert.equal(result.workedHours,worked ? 9.5 : 0);
    assert.equal(result.paidBaseHours,isPaid ? 9.5 : 0);
    // Corrections are also applied before 2026, without an eligibility cutoff.
    const old = calc([{type,hours:9.5}], {rates:api.resolveRates('VZK',0)});
    assert.equal(line(old,'a440')?.hours ?? 0,eligible ? 9.5 : 0);
  });
}

test('weekday and Sunday excess become OT without duplicate A440 or hours', () => {
  const split = calc([{type:'weekday',hours:12},{type:'sunday',hours:10}]);
  const explicit = calc([{type:'weekday',hours:9.5},{type:'sunday',hours:9.5},{type:'overtime',hours:3}]);
  assert.deepEqual(split,explicit);
  assert.equal(line(split,'a440').hours,22);
  assert.equal(split.workedHours,22);
  assert.equal(split.paidBaseHours,22);
});

test('July wage boundary and payment-date tax selection are independent', () => {
  assert.equal(api.currentPeriodIdx(date('2026-07-01')),5);
  assert.equal(api.currentPeriodIdx(date('2026-07-11')),5);
  assert.equal(api.currentPeriodIdx(date('2026-07-12')),6);
  const oldTax = api.getScale2Schedule(date('2026-06-30'));
  const newTax = api.getScale2Schedule(date('2026-07-01'));
  assert.equal(api.estimateTax(15078.13, oldTax),5786);
  assert.equal(api.estimateTax(15078.13, newTax),5776);
  assert.equal(api.resolveRates('VZK',5).combined,105.9008);
  assert.equal(api.resolveRates('VZK',6).combined,107.7541);
  assert.equal(api.resolveRates('VZK',6).eGrade,2.0076);
});

test('other grade base/testing values and unverified VZK periods are preserved', () => {
  for (const grade of api.PAY_GRADES) for (let pi=0;pi<8;pi++) {
    if (grade.code === 'VZK' && [5,6].includes(pi)) continue;
    const rates = api.resolveRates(grade.code,pi);
    assert.equal(rates.combined,grade.rates[pi]+api.TESTING_ALLOW_RATES[pi]);
    assert.ok(Number.isFinite(calc(schedule({weekday:9.5,ex_project:9.5}), {rates}).gross));
  }
});

test('normal combines project at same rate, but keeps a higher project floor separate', () => {
  const entries = schedule({weekday:38,sunday:19,ex_project:19});
  const result = calc(entries,{rates:api.resolveRates('VZK',5)});
  assert.equal(line(result,'normal').amount,8048.46);
  assert.equal(line(result,'projectNormal'),undefined);
  const floored = calc(entries,{rates:api.resolveRates('VB8',5)});
  assert.equal(line(floored,'normal').hours,57);
  assert.equal(line(floored,'projectNormal').hours,19);
  assert.ok(line(floored,'projectNormal').rate > line(floored,'normal').rate);
});

test('site precision and opt-in super, JumpUp super, and deductions', () => {
  const entries = schedule({ex_project:9.5});
  const flat = calc(entries);
  const excluded = calc(entries,{siteRate:3.7021});
  const included = calc(entries,{siteRate:3.7021,siteInSuper:true});
  assert.equal(line(flat,'site').amount,102.13);
  assert.equal(line(flat,'site').superEligible,false);
  assert.equal(line(excluded,'site').amount,35.17);
  assert.equal(line(included,'site').rate,3.7021);
  assert.equal(included.gross,excluded.gross);
  assert.equal(Math.round((included.superBase-excluded.superBase)*100),3517);
  assert.equal(line(flat,'jumpUp').amount,48.41);
  assert.equal(line(flat,'jumpUp').superEligible,true);
  const deducted = calc(entries,{deductions:1005.02});
  assert.equal(deducted.superBase,flat.superBase);
  assert.equal(deducted.taxable,Math.round((flat.gross-1005.02)*100)/100);
  const exhausted = calc(entries,{deductions:99999});
  assert.equal(exhausted.net,0);
  assert.equal(exhausted.tax,0);
});

test('calculation is deterministic and does not mutate supplied inputs', () => {
  const entries = schedule({weekday:19,sick:9.5});
  const before = JSON.stringify(entries);
  assert.deepEqual(calc(entries),calc(entries));
  assert.equal(JSON.stringify(entries),before);
});

test('unworked PH displays separate categories without changing shared pay-code rounding', () => {
  const result = calc([{type:'rostered_ph',hours:9.5},{type:'pholeave',hours:7.6}]);
  const ph = line(result,'phGazette');
  assert.equal(ph.parts.length,2);
  assert.equal(ph.parts[0].label,'Rostered PH');
  assert.equal(ph.parts[1].label,'Non Rostered PH');
  assert.equal(ph.parts[0].amount,1023.66);
  assert.equal(ph.parts[1].amount,818.94);
  assert.equal(Math.round(ph.parts.reduce((sum,part) => sum + part.amount,0)*100),ph.amountCents);
  assert.equal(line(calc([{type:'pholeave',hours:7.6}]),'phGazette').parts[0].amount,818.93);
});
