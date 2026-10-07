// Anonymised, equivalent schedules, not assertions about actual shift dates.
// Every ordinary/leave entry is at most 9.5h so automatic OT is meaningful.
function schedule(groups) {
  return Object.entries(groups).flatMap(([kind, total]) => {
    const type = kind.startsWith('annual_') ? 'annual_leave' : kind;
    const day = kind === 'sunday' || kind === 'annual_sunday' ? 'SUN' : 'MON';
    const days = [];
    while (total > 0) {
      const hours = Math.min(total, 9.5);
      days.push({ type, day, hours });
      total -= hours;
    }
    return days;
  });
}

const fixtures = [
  ['2026-05-02','2026-05-07',12841.31,11836.29,4262,7574.29,1540.96,1540.96,
    {weekday:28.5,sunday:9.5,annual_weekday:28.5,annual_sunday:9.5,pholeave:7.6}],
  ['2026-05-16','2026-05-21',15761.85,14756.83,5636,9120.83,1625.46,1625.46,
    {weekday:38,sunday:19,ex_project:19,overtime:9.5}],
  ['2026-05-30','2026-06-04',12021.44,11016.42,3878,7138.42,1442.57,1388.13,
    {weekday:57,sunday:19}],
  ['2026-06-13','2026-06-18',16900.87,15895.85,6170,9725.85,1374.09,null,
    {weekday:38,sunday:14,ex_project:9.5,rostered_ph:9.5,ph_worked:5,overtime:19}],
  ['2026-06-27','2026-07-02',14840.13,13835.11,5192,8643.11,1539.36,1539.36,
    {weekday:47.5,sunday:19,ex_project:9.5,overtime:9.5},3.7021,true],
  ['2026-07-11','2026-07-16',16083.15,15078.13,5776,9302.13,1447.07,1447.07,
    {weekday:57,sunday:19,overtime:19}],
  ['2026-07-25','2026-07-30',15091.83,14086.81,5310,8776.81,1565.34,1565.34,
    {weekday:47.5,sunday:19,ex_project:9.5,overtime:9.5},3.0146,true],
  ['2026-08-08','2026-08-13',14298.22,13293.20,4936,8357.20,1470.11,1470.11,
    {weekday:57,sunday:19,overtime:9.5}],
  ['2026-08-22','2026-08-25',11617.61,10612.59,3678,6934.59,1394.11,1394.11,
    {weekday:38,sunday:19,sick:19}],
  ['2026-09-05','2026-09-08',12231.82,11226.80,3966,7260.80,1467.82,1467.82,
    {weekday:57,sunday:19}],
  ['2026-09-19','2026-09-22',14298.22,13293.20,4936,8357.20,1470.11,1470.11,
    {weekday:57,sunday:19,overtime:9.5}],
  ['2026-10-03','2026-10-06',15132.41,14127.39,5328,8799.39,1570.21,1570.21,
    {weekday:57,sunday:19,overtime:9.5,pholeave:7.6}],
].map(([periodEnd,paymentDate,gross,taxable,tax,net,superAmount,recordedSuper,groups,siteRate=10.75,siteInSuper=false]) => ({
  periodEnd, paymentDate, expected: {gross,taxable,tax,net,superAmount}, recordedSuper,
  entries:schedule(groups), siteRate, siteInSuper,
}));
module.exports = { fixtures, schedule };
