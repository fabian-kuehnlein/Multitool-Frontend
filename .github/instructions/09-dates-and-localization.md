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

Use dayjs for formatting:

```ts
dayjs(inputDate).format('YYYY-MM-DDTHH:mm:ss');
```

## Rules

- **Always use dayjs** for parsing, formatting, arithmetic and comparisons. Never use raw `Date` math or the `moment` library.
- The only raw `Date` usage allowed is interop where a library (Angular Material datepicker, FullCalendar) requires it — convert immediately via dayjs.
- When building API payloads, normalize dates to `YYYY-MM-DDTHH:mm:ss` before sending.
- For week calculations, use the `isoWeek` dayjs plugin; week starts on Monday (dayjs default with `de` locale / `isoWeek`).
- The Angular `DatePipe` is fine for template display (`{{ item.dueDate | date: "dd.MM.yyyy" }}`) — note the pipe uses lowercase `dd.MM.yyyy`.
