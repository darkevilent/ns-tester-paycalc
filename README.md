# NS Tester Pay Calculator v1.5

A single-file HTML pay calculator for Metro Trains Night Shift Testing staff. Enter your fortnightly schedule and get an estimated pay breakdown instantly — no server, no install, runs entirely in the browser.

## Features

- **Manual schedule entry** — choose each day's shift type from a drop-down, click hours to edit
- **All shift types** — Weekday NS, Sunday NS, Project EX, Overtime, PH Worked, Rostered PH, Non Rostered PH, Sick, Bonus / WLBP, Annual Leave, Day Off
- **Automatic overtime split** — Weekday and Sunday shifts over 9.5h automatically split into normal hours + overtime (200%) for any excess
- **Pay period aware** — rates update automatically based on today's date across all periods from Jul-23 to Jan-27, including the 1% rise from Jan-26
- **Hours summary** — Hours Worked counts actual shifts; Hours Paid also includes paid leave and unworked public holidays. Neither includes penalty hours
- **Reset button** — restore the schedule to the default template in one click
- **Pre-tax deductions** — enter salary sacrifice, car lease, purchased leave etc. to adjust taxable income
- **Tax estimate** — PAYG withholding calculated as fortnightly Scale 2 using the date-effective ATO NAT 1004 Schedule 1 formulas, including the 1 July 2026 update
- **Super estimate** — 12% SG on eligible earnings (excludes Overtime and PH Worked pay; A440 and Annual Leave Loading are included)
- **Annual estimate** — projects your fortnightly result × 26 for yearly gross, tax and net; super uses a capped projection assumption ($30,000 until 30 Jun 2026, then $32,500 from 1 Jul 2026)
- **Pays remaining** — shows pays left in the current financial year and the next pay date

## Pay Grades

Grades available: VB8 (Trainee Tester), VZI (Tester L1), VZN (Tester L2), VZO (Senior Tester L1), VZJ (Senior Tester L2), VZK (Technical Officer L1), VZL (Technical Officer L2).

Each grade has a base hourly rate. The **Testing Allowance (A078)** is added on top to form the **combined rate**, which is the basis for all pay calculations. The grade selector shows the combined rate for the current pay period.

For VZK, the verified combined rates are $105.9008/hr for Jan-26 and $107.7541/hr from 12 July 2026. A440 is $1.9731/hr and $2.0076/hr respectively. The July tax schedule starts separately on 1 July 2026.

## How Each Shift Type Is Calculated

All rates below use the **combined rate** (base + A078 testing allowance) unless stated otherwise.

### Weekday NS

- Normal pay: hours (capped at 9.5h) × combined rate
- NS Weekday Penalty: same hours × 30% of combined rate
- Hours over 9.5h automatically split to Overtime (see below)
- E Grade Electrical — Infra (A440) applies to all hours including any overtime excess

### Sunday NS

- Normal pay: hours (capped at 9.5h) × combined rate
- Weekend NS Penalty: same hours × 100% of combined rate
- Hours over 9.5h automatically split to Overtime (see below)
- E Grade Electrical — Infra (A440) applies to all hours including any overtime excess

### Project EX

- Normal pay: hours × project rate (combined rate, floored at VZI OT rate)
- Penalty pay: hours × project rate again (effectively 200% total)
- Site Allowance: hours × $10.75/hr (editable to four decimal places). Excluded from super by default; select **Include site allowance in super** for eligible construction allowances
- JumpUp-Infra: hours × $5.0955/hr (editable in the breakdown; included in super)
- E Grade (A440) applies

### Overtime (dedicated shift)

- Pay: hours × combined rate × 200%
- E Grade (A440) applies
- This pay is excluded from super; A440 remains included

### PH Worked

- Pay: hours × combined rate × 250%, shown as base 100% + penalty 150%
- E Grade (A440) applies
- This pay is excluded from super; A440 remains included

### Sick

- Pay: hours × combined rate (100%)
- E Grade (A440) applies

### Bonus / WLBP

- Pay: hours × combined rate (100%)
- E Grade (A440) does not apply

### Rostered PH

- Pay: rostered hours × combined rate (100%)
- E Grade (A440) applies

### Non Rostered PH

- Pay: hours × combined rate (100%), defaulting to 7.6h
- E Grade (A440) applies

### Annual Leave — Weekday

- Base pay: hours × combined rate
- NS Excess: hours × 10% of combined rate
- Annual Leave Loading: hours × 20% of combined rate
- E Grade (A440) applies

### Annual Leave — Sunday

- Base pay: hours × combined rate
- NS Sunday Excess: hours × 80% of combined rate
- Annual Leave Loading: hours × 20% of combined rate
- E Grade (A440) applies

## Allowances

| Allowance | Code | Applies to |
|---|---|---|
| Testing Allowance | A078 | All shift types (built into combined rate) |
| E Grade Electrical — Infra | A440 | Weekday, Sunday, Project EX, Overtime, PH Worked, Rostered PH, Non Rostered PH, Sick, Annual Leave |
| Annual Leave Loading | — | All Annual Leave hours |
| Site Allowance | — | Project EX shifts only |
| JumpUp-Infra | — | Project EX shifts only |

## Usage

1. Open `index.html` in any modern browser (or visit the GitHub Pages URL)
2. Select your pay grade
3. Use the drop-downs to set each day's shift type; click hours to adjust if needed
4. Optionally enter pre-tax deductions

## Notes

- All figures are estimates only — for reference purposes, not payroll advice
- Tax uses the ATO NAT 1004 PAYG withholding formula in effect on the current date for fortnightly Scale 2 payments
- Super estimates ordinary fortnightly contributions; capped or adjustment pays can differ. Pre-tax car deductions do not reduce the super base
- Annual estimate assumes 26 identical fortnights for gross, tax and net; super uses a capped projection assumption ($30,000 until 30 Jun 2026, then $32,500 from 1 Jul 2026)
- Site Allowance and JumpUp-Infra rates are editable inline in the breakdown
- Pay elements round to cents before gross is added. Sick and Annual Leave base pay, and weekday annual leave excess, round per day; percentage rates keep full precision
- Run calculation tests with `node --test tests/calculator.test.cjs`
