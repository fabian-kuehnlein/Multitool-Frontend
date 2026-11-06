# Dates & Localization

## German UI

- All UI text is **German** (labels, buttons, snackbars, dialog messages, empty states).
- Use the informal "du" form for user-facing text (e.g. "Möchtest du ... wirklich löschen?"). Avoid new "Sie" formulations.
- Keep hardcoded strings in the template/component; there is no i18n extraction in this project.

## Locale setup

- `de` is the active locale for the whole app:
  - `registerLocaleData(localeDe, 'de')` and `LOCALE_ID = 'de'` in `app.config.ts`.
  - `dayjs.locale('de')` at startup.
  - The Material DateAdapter is dayjs-based (`provideDayjsAdapter()`, `core/date/dayjs-adapter.ts`).
  - A German `MatPaginatorIntl` provides "Elemente pro Seite:", "Nächste Seite", etc.
- Material components (datepicker, paginator) render German out of the box because of the above — do not hard-code English labels.

## Date/time formats

| Context | Format | Example |
| --- | --- | --- |
| Display (user-facing) | `DD.MM.YYYY` | `24.12.2026` |
| Display (date + time) | `DD.MM.YYYY HH:mm` | `24.12.2026 09:30` |
| Time input values | `HH:mm` | `09:30` |
| API payloads / storage | `YYYY-MM-DDTHH:mm:ss` | `2026-12-24T09:30:00` |
| FullCalendar/date-only | `YYYY-MM-DD` | `2026-12-24` |

## Central date utility

All general date parsing, formatting, comparison and arithmetic goes through
`src/app/shared/utilities/date.util.ts`. It exports a `DateUtil` constant of
pure functions (no service, no injection) and the format constants, so every
feature uses the same behaviour and the same patterns.

```ts
import { DateUtil } from '../../../shared/utilities/date.util';

DateUtil.getCurrent();                       // Dayjs, now
DateUtil.getCurrentApiDateTime();            // '2026-12-24T09:30:00'
DateUtil.formatApiDateTime(value);           // string | null, API format
DateUtil.formatApiDate(value);               // string | null, 'YYYY-MM-DD'
DateUtil.formatDisplayDate(value);           // '24.12.2026'
DateUtil.formatDisplayDateTime(value);       // '24.12.2026 09:30'
DateUtil.formatDisplayTime(value);           // '09:30'
DateUtil.parse(value);                       // Dayjs | null
DateUtil.startOfDay(value);                  // Dayjs | null
DateUtil.addDays(value, 1);                  // Dayjs | null
DateUtil.isSameDay(a, b);                    // boolean
DateUtil.isBeforeDay(a, b);                  // boolean
DateUtil.toDate(value);                      // Date | null
```

- `DateUtil` accepts `DateValue` (`dayjs.ConfigType | number[]`), so FullCalendar
  inputs (`Date`, string, `number[]`) can be passed directly.
- Return values are `null` (not `Invalid Date`) when the input cannot be parsed.
- Use the exported constants (`API_DATE_TIME_FORMAT`, `DISPLAY_DATE_FORMAT`, …)
  instead of repeating format strings.
- Feature `utilities/date.util.ts` files were removed; do not add new
  feature-local date helpers — extend the shared one instead.

Dayjs is still the underlying library and remains fine **inside** date math
that chains several operations (e.g. recurrence expansion, duration handling).
Outside `DateUtil`, prefer its methods over importing dayjs.

Form services (e.g. `event-form.service.ts`, `todo-dialog-form.service.ts`)
stay responsible for mapping form values to DTOs. They call `DateUtil` for all
date parsing/formatting instead of doing dayjs work themselves.

## Rules

- **Use `DateUtil` for general date handling.** Never use raw `Date` math or the `moment` library.
- The only raw `Date` usage allowed is interop where a library (Angular Material datepicker, FullCalendar) requires it — convert immediately via `DateUtil`.
- When building API payloads, normalize dates to `YYYY-MM-DDTHH:mm:ss` before sending (`DateUtil.formatApiDateTime(...)`). The DB columns are `timestamp without time zone`, so the value must be a floating wall-clock datetime without a timezone offset.
- **iCal exception:** the iCal export endpoint (`POST /api/Calendar/events/ical`) needs a timezone offset so the backend can convert the wall-clock time of **timed** events to UTC. Use `DateUtil.formatIcalDateTime(...)`, which produces `YYYY-MM-DDTHH:mm:ssZ` (e.g. `2026-12-24T09:30:00+01:00`). For all-day events the backend uses only the date part, so the offset does not shift the day. Do not use this format for normal API payloads.
- For week calculations, use `DateUtil.getWeekStart`, `getWeekEnd` and `getIsoWeek`; weeks start on Monday (`isoWeek`).
- The Angular `DatePipe` is fine for template display (`{{ item.dueDate | date: "dd.MM.yyyy" }}`) — note the pipe uses lowercase `dd.MM.yyyy`.
