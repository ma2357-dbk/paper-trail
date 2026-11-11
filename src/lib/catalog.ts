/**
 * Catalogue rows (events, steps, document types) are translated by id:
 * messages/<locale>.json → catalog.events.<id>.title etc. The ids come from the
 * database, so they cannot be statically typed; these helpers keep the casts in
 * one place. Pass `t` from `getTranslations("catalog")` / `useTranslations("catalog")`.
 */
type Translate = (key: never) => string;

export function eventTitle(t: Translate, eventId: string) {
  return t(`events.${eventId}.title` as never);
}

export function stepTitle(t: Translate, stepTemplateId: string) {
  return t(`steps.${stepTemplateId}.title` as never);
}

export function stepOffice(t: Translate, stepTemplateId: string) {
  return t(`steps.${stepTemplateId}.office` as never);
}

export function stepSummary(t: Translate, stepTemplateId: string) {
  return t(`steps.${stepTemplateId}.summary` as never);
}

export function documentTypeLabel(t: Translate, documentTypeId: string) {
  return t(`documentTypes.${documentTypeId}` as never);
}
