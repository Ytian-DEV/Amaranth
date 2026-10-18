import { allowedTransitions, assignableRoles, canEditContent, canEditSk, canGrantPublishing, canManageSkTeam, canPublish, canPublishArticles, isAdmin, isEditor, publishesByRole, roleLabels } from './permissions';

describe('roles', () => {
  it('ranks roles like the database', () => {
    expect(isAdmin('editor_in_chief')).toBe(true);
    expect(isAdmin('managing_editor')).toBe(false);
    expect(canPublish('managing_editor')).toBe(true);
    expect(canPublish('section_editor')).toBe(false);
    expect(isEditor('section_editor')).toBe(true);
    expect(isEditor('staff_writer')).toBe(false);
  });

  it('only super admins grant super admin', () => {
    expect(assignableRoles('super_admin')).toContain('super_admin');
    expect(assignableRoles('editor_in_chief')).not.toContain('super_admin');
    expect(assignableRoles('managing_editor')).toEqual([]);
  });
});

describe('Salingkusog', () => {
  it('only super admin, Executive Editor and managing editor choose the team', () => {
    expect(roleLabels.editor_in_chief).toBe('Executive Editor');
    expect(['super_admin', 'editor_in_chief', 'managing_editor'].every((r) => canManageSkTeam(r as never))).toBe(true);
    expect(canManageSkTeam('section_editor')).toBe(false);
    expect(canManageSkTeam('staff_writer')).toBe(false);
  });

  it('team members of any role can enter data', () => {
    expect(canEditSk('managing_editor', false)).toBe(true);
    expect(canEditSk('contributor', true)).toBe(true);
    expect(canEditSk('section_editor', false)).toBe(false);
    expect(canEditSk(null, true)).toBe(false);
  });
});

describe('allowedTransitions', () => {
  const writerOwn = { isOwner: true, canEditSection: false };
  const sectionEditor = { isOwner: false, canEditSection: true };

  it('writer: draft → submitted only', () => {
    expect(allowedTransitions('staff_writer', { status: 'draft', ...writerOwn })).toEqual(['submitted']);
  });

  it('writer can withdraw a submission but not review it', () => {
    expect(allowedTransitions('staff_writer', { status: 'submitted', ...writerOwn })).toEqual(['draft']);
    expect(allowedTransitions('staff_writer', { status: 'in_review', ...writerOwn })).toEqual([]);
  });

  it('section editor reviews, returns and rejects but cannot publish', () => {
    expect(allowedTransitions('section_editor', { status: 'submitted', ...sectionEditor }).sort()).toEqual(
      ['draft', 'in_review', 'rejected'].sort(),
    );
    expect(allowedTransitions('section_editor', { status: 'in_review', ...sectionEditor }).sort()).toEqual(
      ['draft', 'rejected'].sort(),
    );
  });

  it('publisher can publish, schedule, archive and unpublish', () => {
    const eic = { isOwner: false, canEditSection: true };
    expect(allowedTransitions('editor_in_chief', { status: 'in_review', ...eic })).toEqual(
      expect.arrayContaining(['published', 'scheduled', 'draft', 'rejected']),
    );
    expect(allowedTransitions('editor_in_chief', { status: 'published', ...eic }).sort()).toEqual(['archived', 'draft'].sort());
    expect(allowedTransitions('editor_in_chief', { status: 'archived', ...eic }).sort()).toEqual(['draft', 'published'].sort());
  });

  it('locks content for owners once submitted', () => {
    expect(canEditContent({ status: 'draft', ...writerOwn })).toBe(true);
    expect(canEditContent({ status: 'submitted', ...writerOwn })).toBe(false);
    expect(canEditContent({ status: 'published', ...sectionEditor })).toBe(true);
  });
});

describe('publishing access', () => {
  const own = { isOwner: true, canEditSection: false };

  it('staff without access only save drafts and submit for review', () => {
    expect(allowedTransitions('staff_writer', { status: 'draft', ...own })).toEqual(['submitted']);
    expect(allowedTransitions('section_editor', { status: 'draft', ...own })).not.toContain('published');
  });

  it('the Business Manager and granted staff publish and schedule', () => {
    expect(roleLabels.business_manager).toBe('Business Manager');
    expect(allowedTransitions('business_manager', { status: 'draft', ...own })).toEqual(expect.arrayContaining(['published', 'scheduled']));
    expect(allowedTransitions('staff_writer', { status: 'draft', ...own, publishAccess: true })).toEqual(expect.arrayContaining(['published', 'scheduled']));
    expect(canPublishArticles(null, true)).toBe(false);
  });

  it('only the three managing roles give access; the Business Manager does not', () => {
    expect(['super_admin', 'editor_in_chief', 'managing_editor'].every((r) => canGrantPublishing(r as never))).toBe(true);
    expect(canGrantPublishing('business_manager')).toBe(false);
    expect(publishesByRole('business_manager')).toBe(true);
    expect(publishesByRole('section_editor')).toBe(false);
  });
});
