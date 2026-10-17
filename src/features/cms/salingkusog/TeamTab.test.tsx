import { fireEvent, render, screen, within } from '@testing-library/react';
import { navFor } from '../nav';
import { buildTeam, type SkStaff } from './skApi';
import { TeamView } from './TeamTab';

const staff: SkStaff[] = [
  { id: 'a', display_name: 'Ada Admin', email: 'a@vsu.edu.ph', role: 'super_admin', is_active: true, avatar_url: null },
  { id: 'e', display_name: 'Eve Exec', email: 'e@vsu.edu.ph', role: 'editor_in_chief', is_active: true, avatar_url: null },
  { id: 's', display_name: 'Sam Sports', email: 's@vsu.edu.ph', role: 'section_editor', is_active: true, avatar_url: null },
  { id: 'w', display_name: 'Wes Writer', email: 'w@vsu.edu.ph', role: 'staff_writer', is_active: true, avatar_url: null },
  { id: 'x', display_name: 'Xan Inactive', email: 'x@vsu.edu.ph', role: 'staff_writer', is_active: false, avatar_url: null },
];
const team = buildTeam(staff, [{ profile_id: 's', added_by: 'e', created_at: '2026-10-12T09:00:00+08:00' }]);

describe('buildTeam', () => {
  it('splits members, always-allowed roles and people who can be added', () => {
    expect(team.members.map((m) => [m.display_name, m.addedByName])).toEqual([['Sam Sports', 'Eve Exec']]);
    expect(team.managers.map((m) => m.id)).toEqual(['a', 'e']);
    expect(team.candidates.map((m) => m.id)).toEqual(['w']); // not managers, not inactive, not already on the team
  });
});

describe('TeamView', () => {
  it('lets managers add and remove members', () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    render(<TeamView {...team} canManage onAdd={onAdd} onRemove={onRemove} />);
    fireEvent.change(screen.getByLabelText('Staff account'), { target: { value: 'w' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add to team' }));
    expect(onAdd).toHaveBeenCalledWith('w');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Sam Sports from the Salingkusog team' }));
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 's' }));
    expect(within(screen.getByRole('region', { name: 'Always have access' })).getByText('Executive Editor')).toBeInTheDocument();
  });

  it('is read-only for team members', () => {
    render(<TeamView {...team} canManage={false} onAdd={() => undefined} onRemove={() => undefined} />);
    expect(screen.getByText('Sam Sports')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Staff account')).not.toBeInTheDocument();
  });
});

describe('Salingkusog nav item', () => {
  const has = (...args: Parameters<typeof navFor>) => navFor(...args).some((i) => i.to === '/admin/salingkusog');
  it('shows for the managing roles and team members only', () => {
    expect(has('managing_editor')).toBe(true);
    expect(has('editor_in_chief')).toBe(true);
    expect(has('section_editor')).toBe(false);
    expect(has('staff_writer', { skTeam: true })).toBe(true);
  });
});
