import { parseCsv, parseTime, resolveSchedule, scheduleTemplate, type ScheduleSetup } from './scheduleCsv';

const setup: ScheduleSetup = {
  edition: { starts_on: '2026-11-02', ends_on: '2026-11-07' },
  sports: [
    { id: 'bb', name: 'Basketball', slug: 'basketball' },
    { id: 'vb', name: 'Volleyball', slug: 'volleyball' },
    { id: 'at', name: 'Athletics', slug: 'athletics' },
  ],
  events: [
    { id: 'bb-m', sport_id: 'bb', name: 'Men', slug: 'basketball-men', venue_id: 'gym' },
    { id: 'vb-w', sport_id: 'vb', name: 'Women', slug: 'volleyball-women', venue_id: null },
    { id: 'vb-m', sport_id: 'vb', name: 'Men', slug: 'volleyball-men', venue_id: null },
    { id: 'at-100w', sport_id: 'at', name: '100m Dash · Women', slug: 'athletics-100m-dash-women', venue_id: null },
  ],
  factions: [
    { id: 'pt', name: 'Primordial Tiamat', slug: 'primordial-tiamat', short_name: 'PT' },
    { id: 'sd', name: 'Sylvan Dragons', slug: 'sylvan-dragons', short_name: 'SD' },
    { id: 'cv', name: 'Centicore Vanguard', slug: 'centicore-vanguard', short_name: 'CV' },
  ],
  venues: [
    { id: 'gym', name: 'Main Gym', slug: 'main-gym', map_number: 1 },
    { id: 'annex', name: 'Annex Court', slug: 'annex-court', map_number: 2 },
    { id: 'oval', name: 'Oval', slug: 'oval', map_number: 3 },
  ],
  existing: [],
};

describe('parseCsv', () => {
  it('handles quotes, commas inside quotes, CRLF and blank lines', () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n\r\n1,\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
      ['1', ''],
    ]);
  });
});

describe('parseTime', () => {
  it.each([
    ['14:30', '14:30'],
    ['2:30 PM', '14:30'],
    ['12 am', '00:00'],
    ['7', '07:00'],
    ['25:00', null],
    ['noon', null],
  ])('%s → %s', (raw, out) => expect(parseTime(raw)).toBe(out));
});

describe('resolveSchedule', () => {
  it('turns the template into matches in Philippine time', () => {
    const { lines, headerError } = resolveSchedule(scheduleTemplate, setup);
    expect(headerError).toBeNull();
    expect(lines.map((l) => l.errors)).toEqual([[], [], []]);
    expect(lines[0].match).toEqual({ event_id: 'bb-m', scheduled_at: '2026-11-03T08:00:00+08:00', round: 'Semifinal 1', side_a_id: 'pt', side_b_id: 'sd', venue_id: 'gym' });
    expect(lines[1].match).toMatchObject({ event_id: 'vb-w', side_a_id: 'pt', side_b_id: 'cv', venue_id: 'annex' });
    expect(lines[2].match).toMatchObject({ event_id: 'at-100w', side_a_id: null, side_b_id: null, venue_id: 'oval' });
  });

  it('accepts header aliases, a single-event sport and the event venue as default', () => {
    const csv = 'Day,Start,Sport,Team A,Team B\n2026-11-04,9:00 AM,basketball,SD,TBD';
    const [line] = resolveSchedule(csv, setup).lines;
    expect(line.errors).toEqual([]);
    expect(line.match).toMatchObject({ event_id: 'bb-m', scheduled_at: '2026-11-04T09:00:00+08:00', side_a_id: 'sd', side_b_id: null, venue_id: 'gym' });
  });

  it('reports every problem on a line', () => {
    const csv = 'date,time,sport,event,side_a,side_b,venue\n2026-12-01,later,Volleyball,,Tiamat,PT,Moon';
    const [line] = resolveSchedule(csv, setup).lines;
    expect(line.match).toBeNull();
    expect(line.errors).toEqual([
      'Date is outside the edition (2026-11-02 to 2026-11-07).',
      'Time must look like 14:30 or 2:30 PM.',
      'Volleyball has 2 events; say which one.',
      'Unknown faction “Tiamat” (side A).',
      'Unknown venue “Moon”.',
    ]);
  });

  it('marks games already in the schedule or repeated in the file', () => {
    const csv = 'date,time,sport,side_a,side_b\n2026-11-03,08:00,Basketball,PT,SD\n2026-11-03,10:00,Basketball,PT,SD\n2026-11-03,10:00,Basketball,PT,SD';
    const existing = [{ event_id: 'bb-m', scheduled_at: '2026-11-03T00:00:00+00:00', side_a_id: 'pt', side_b_id: 'sd' }];
    const { lines } = resolveSchedule(csv, { ...setup, existing });
    expect(lines.map((l) => l.duplicate)).toEqual([true, false, true]);
  });

  it('needs a header with date, time and sport', () => {
    expect(resolveSchedule('2026-11-03,08:00,Basketball', setup).headerError).toMatch(/Missing columns: date, time, sport/);
  });
});
