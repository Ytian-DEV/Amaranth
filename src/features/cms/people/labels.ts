import type { TeamRoleGroup } from '@/lib/database.types';

export const groupLabels: Record<TeamRoleGroup, string> = {
  adviser: 'Advisers',
  editorial_board: 'Editorial board',
  section_head: 'Section heads',
  staff: 'Staff',
};

export const groups = Object.keys(groupLabels) as TeamRoleGroup[];
