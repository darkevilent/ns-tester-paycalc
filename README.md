# NS Tester Pay Calculator v1.5

A standalone calculator for Metro Trains Night Shift Testing staff. Open `index.html` in a modern browser, select a grade, and enter a fortnightly schedule. It works offline with no server, installation or external assets.

## Using the calculator

- Choose each day's shift type; click its hours to edit. Weekday and Sunday hours above 9.5 automatically become overtime.
- Sick and Bonus / WLBP have separate choices. Annual Leave uses Sunday treatment on the SUN rows.
- Enter optional pre-tax deductions. They reduce taxable income, not eligible super earnings.
- When a Project shift is present, edit Site Allowance and JumpUp-Infra rates in the breakdown to four decimal places. The site rate defaults to $10.7500/hr with **Include site allowance in super** off. Turn it on for eligible construction site allowances. JumpUp defaults to $5.0955/hr and is included in super.
- Reset restores the default 76-hour schedule and recalculates immediately. It keeps the selected grade, deductions and allowance settings.
- There are no date controls: the interface estimates current pay using today's wage period and tax schedule.

## Rates and timing

Available grades: VB8, VZI, VZN, VZO, VZJ, VZK and VZL. The combined hourly rate is base plus Testing Allowance A078. Verified VZK combined-rate overrides are $105.9008 for Jan-26 and $107.7541 for Jul-26. These preserve the existing base and testing arrays without inventing a different split. Other grades' combined rates are unchanged.

A440 is $1.9731/hr for Jan-26 and $2.0076/hr for Jul-26. The July 2026 wage period begins **12 July 2026**. The fortnight 28 June–11 July, paid 16 July, still uses Jan-26 wages but the July tax schedule. Other existing wage dates and values are retained; unverified grades have not been independently reconciled.

Fortnightly PAYG uses the existing ATO NAT 1004 Schedule 1, Scale 2 coefficients and rounding (tax-free threshold claimed). Tax follows the **payment date**, independently of the wage period. The [official July 2026 schedule](https://www.legislation.gov.au/F2026L00716/asmade/2026-06-12/text/original/epub/OEBPS/document_1/document_1.html) starts on 1 July 2026. Historical tests supply their wage period and payment date separately; the interface remains current-pay only.

## Pay elements

Percentages below apply to the combined rate unless indicated otherwise.

| Schedule entry | Pay | A440 | Actual worked hours |
|---|---|---|---|
| Weekday NS | Normal 100% + night penalty 30%; excess above 9.5h at 200% | Yes, including excess | Yes |
| Sunday NS | Normal 100% + weekend penalty 100%; excess above 9.5h at 200% | Yes, including excess | Yes |
| Project EX | Normal + penalty, each at the greater of combined rate or existing VZI-derived project floor; site and JumpUp allowances | Yes | Yes |
| Overtime | 200% | Yes | Yes |
| PH Worked | Separate base 100% + penalty 150% | Yes | Yes |
| Rostered PH, unworked | 100% | Yes | No |
| Non Rostered PH | 100%, default 7.6h | Yes | No |
| Sick | 100% | Yes | No |
| Bonus / WLBP | 100% | No | No |
| Annual Leave, weekday | Base 100% + excess 10% + loading 20% | Yes | No |
| Annual Leave, Sunday | Base 100% + excess 80% + loading 20% | Yes | No |
| Day Off | None | No | No |

Corrected A440 eligibility applies throughout all supported wage periods, with no new eligibility cutoff.

**Hours Worked** counts weekday, Sunday, project, overtime and PH Worked hours. **Hours Paid** counts every paid schedule hour once, including leave, Bonus / WLBP and unworked public holidays. Neither includes penalty equivalent hours; automatic overtime splits do not duplicate hours or A440.

## Rounding

Derived percentages retain full precision, rather than using the four-decimal rate printed on a payslip. Pay elements round to cents before gross is summed:

- Sick and Annual Leave base pay, and weekday annual leave excess, round per entered day then sum. Four 9.5h leave days at $105.9008 produce $4,024.24; three weekday leave excess days produce $301.83. Two 9.5h sick days at $107.7541 produce $2,047.32.
- Other elements aggregate by pay code and rate. Normal pay combines weekday, Sunday and project hours when their rate matches. A project floor above the combined rate creates a separate normal line. Rostered and non-rostered unworked holidays display on separate lines. They retain the shared PH Gazette rounding total; any cent remainder is allocated to the non-rostered line.
- PH Worked base and penalty round separately: 5h at $105.9008 produces $529.50 base plus $794.26 penalty.
- Fortnightly PAYG keeps the existing weekly-equivalent calculation: discard cents from half the taxable fortnight, add $0.99, apply Scale 2, round weekly withholding to a dollar, then double it.

## Super and annual projection

The ordinary fortnightly estimate is 12% of eligible earnings. It excludes overtime and PH Worked base/penalty pay, and excludes site allowance unless selected. It includes A440 amounts (including units attached to OT and PH Worked), annual leave loading, JumpUp, ordinary project pay and other paid leave. Pre-tax car deductions do not reduce this base. These are this calculator's agreed payroll assumptions, reconciled against the supplied VZK evidence.

No payroll history, remaining contribution limit or adjustment input is modelled. Capped pays and super-only adjustments can therefore differ from the ordinary estimate. The reference May 30 contribution was capped at $1,388.13 versus the $1,442.57 ordinary estimate; June 13 had no current contribution versus $1,374.09 estimated; June 23 recorded a $747.95 super-only adjustment with no wages.

The annual projection assumes 26 identical fortnights. Its super figure retains the existing cap assumption: $30,000 before 1 July 2026 and $32,500 thereafter. That cap applies only to the projection, not the ordinary fortnightly result; it does not predict actual payroll contribution limits or adjustments. The pays-remaining indicator retains the existing fortnightly Tuesday cadence and does not predict changed payment dates.

All figures are estimates for reference, not payroll advice.

## Implementation and validation

The single HTML script contains the pure `calculatePay` function. It accepts schedule entries, resolved rates, a resolved tax schedule, deductions, site rate/super choice and JumpUp rate. It returns cent-rounded breakdown lines, gross, taxable income, PAYG, net, eligible super base/amount, worked hours and paid base hours. The interface renders those results. `resolveRates`, `currentPeriodIdx` and `getScale2Schedule` allow tests to resolve historical inputs independently.

The `tests/` directory includes the anonymised fixtures, calculation regression suite and optional browser smoke checks. Private PDFs and generated screenshots remain ignored.

Run the anonymised regression suite with Node (no dependencies):

```sh
node --test tests/calculator.test.cjs
```

The 12 regular fixtures reproduce gross, taxable income, PAYG and net to the cent and all 10 ordinary recorded super contributions. Capped and super-only cases are checked separately. Fixtures reconstruct equivalent schedules from aggregate hours; they do not assert actual shift dates. Tests also cover daily rounding, every eligibility category, automatic OT, wage/tax boundaries, other grades, the project floor, allowance precision, super choice and deductions.

Optional browser smoke checks require Playwright and Microsoft Edge:

```sh
node tests/browser-smoke.cjs
```

They open the local HTML with network access blocked, check schedule editing, grades, deductions, reset, allowance controls and mobile overflow, and save screenshots under ignored `tmp/browser/`.

Private reference PDFs and personal details are not test assets and must not be committed. The original reference files stay outside this worktree.
