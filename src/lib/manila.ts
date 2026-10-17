// Philippine time (UTC+8, no daylight saving) for dates that must not depend on the reader's device.
const MANILA_OFFSET_MS = 8 * 3600_000;

/** YYYY-MM-DD in Manila for an instant. */
export function manilaDate(at: string | Date = new Date()) {
  return new Date(new Date(at).getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 10);
}

/** HH:MM in Manila for an instant. */
export function manilaTime(at: string | Date) {
  return new Date(new Date(at).getTime() + MANILA_OFFSET_MS).toISOString().slice(11, 16);
}

/** Every day from start to end inclusive (YYYY-MM-DD): [{ date, number }]. */
export function dayRange(startsOn: string, endsOn: string) {
  const days: { date: string; number: number }[] = [];
  const end = new Date(`${endsOn}T00:00:00Z`).getTime();
  for (let t = new Date(`${startsOn}T00:00:00Z`).getTime(), n = 1; t <= end && n <= 60; t += 86_400_000, n++) {
    days.push({ date: new Date(t).toISOString().slice(0, 10), number: n });
  }
  return days;
}
