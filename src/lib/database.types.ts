/**
 * Types for supabase/v2/schema.sql, in the shape `supabase gen types` produces.
 * Hand-maintained (no Supabase CLI/Docker in this environment): update this
 * file together with the schema.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole =
  | 'super_admin'
  | 'editor_in_chief'
  | 'managing_editor'
  | 'section_editor'
  | 'staff_writer'
  | 'contributor';
export type ArticleStatus = 'draft' | 'submitted' | 'in_review' | 'scheduled' | 'published' | 'archived' | 'rejected';
export type NavPlacement = 'primary' | 'more' | 'hidden';
export type ContributorType = 'staff' | 'student' | 'guest' | 'faculty' | 'alumni';
export type AssetKind = 'image' | 'document' | 'audio' | 'video';
export type ArticleMediaUsage = 'inline' | 'gallery' | 'attachment';
export type RevisionKind = 'autosave' | 'manual' | 'status';
export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';
export type IntakeStatus = 'submitted' | 'reviewing' | 'accepted' | 'declined' | 'converted';
export type ContactCategory = 'general' | 'editorial' | 'submission' | 'technical' | 'advertising' | 'feedback';
export type ContactStatus = 'unread' | 'in_progress' | 'resolved' | 'spam';
export type IssueType = 'regular' | 'special' | 'graduation' | 'annual' | 'commemorative';
export type TeamRoleGroup = 'adviser' | 'editorial_board' | 'section_head' | 'staff';

type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};
type Table<Row, Required extends keyof Row, R extends Rel[] = []> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: R;
};
// Relationship literal for a default-named foreign key
type FK<T extends string, C extends string, Ref extends string, One extends boolean = false> = {
  foreignKeyName: `${T}_${C}_fkey`;
  columns: [C];
  isOneToOne: One;
  referencedRelation: Ref;
  referencedColumns: ['id'];
};

export type ProfileRow = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: AppRole;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffInviteRow = {
  email: string;
  role: AppRole;
  section_slugs: string[];
  invited_by: string | null;
  accepted_at: string | null;
  created_at: string;
};

export type SectionRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  nav_placement: NavPlacement;
  nav_order: number;
  accepts_submissions: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileSectionRow = { profile_id: string; section_id: string };

export type CategoryRow = {
  id: string;
  section_id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  is_assignable: boolean;
  created_at: string;
  updated_at: string;
};

export type TagRow = { id: string; slug: string; name: string; created_at: string };

export type MediaVariant = { width: number; path: string };

export type MediaAssetRow = {
  id: string;
  bucket: 'media' | 'archives';
  path: string;
  kind: AssetKind;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  caption: string | null;
  credit: string | null;
  variants: MediaVariant[];
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ContributorRow = {
  id: string;
  profile_id: string | null;
  name: string;
  slug: string;
  type: ContributorType;
  position: string | null;
  program: string | null;
  bio: string | null;
  avatar_asset_id: string | null;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicationIssueRow = {
  id: string;
  title: string;
  slug: string;
  volume: number | null;
  issue_number: number | null;
  issue_type: IssueType;
  issue_date: string;
  description: string | null;
  cover_asset_id: string | null;
  pdf_asset_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type ArticleRow = {
  id: string;
  section_id: string;
  category_id: string;
  issue_id: string | null;
  issue_position: number | null;
  title: string;
  slug: string;
  kicker: string | null;
  dek: string | null;
  excerpt: string;
  body_json: Json | null;
  body_html: string;
  body_text: string;
  reading_minutes: number;
  cover_asset_id: string | null;
  cover_caption: string | null;
  byline_override: string | null;
  status: ArticleStatus;
  is_featured: boolean;
  editorial_priority: number;
  allow_comments: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_asset_id: string | null;
  submitted_at: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  archived_at: string | null;
  view_count: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleAuthorRow = { article_id: string; contributor_id: string; credit_label: string; position: number };
export type ArticleTagRow = { article_id: string; tag_id: string };
export type ArticleMediaRow = {
  article_id: string;
  asset_id: string;
  usage: ArticleMediaUsage;
  position: number;
  caption: string | null;
};
export type ArticleRevisionRow = {
  id: number;
  article_id: string;
  kind: RevisionKind;
  title: string;
  body_json: Json | null;
  body_html: string;
  saved_by: string | null;
  created_at: string;
};
export type ArticleActivityRow = {
  id: number;
  article_id: string;
  actor_id: string | null;
  action: 'created' | 'status' | 'note';
  from_status: ArticleStatus | null;
  to_status: ArticleStatus | null;
  note: string | null;
  created_at: string;
};
export type ArticleDailyViewsRow = { article_id: string; day: string; views: number };
export type ArticleCommentRow = {
  id: string;
  article_id: string;
  parent_id: string | null;
  author_name: string;
  body: string;
  status: CommentStatus;
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
};
export type ArticleCommentPrivateRow = { comment_id: string; author_email: string };
export type HomeSlotRow = {
  slot: 'lead' | 'folio';
  article_id: string | null;
  pull_quote: string | null;
  attribution: string | null;
  updated_by: string | null;
  updated_at: string;
};
export type ArticleSubmissionRow = {
  id: string;
  submitter_name: string;
  submitter_email: string;
  submitter_affiliation: string | null;
  section_id: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  status: IntakeStatus;
  reviewer_id: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  converted_article_id: string | null;
  created_at: string;
  updated_at: string;
};
export type EventReportRow = {
  id: string;
  organization: string;
  contact_name: string;
  contact_email: string;
  event_title: string;
  event_date: string | null;
  venue: string | null;
  summary: string;
  status: IntakeStatus;
  reviewer_id: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  converted_article_id: string | null;
  created_at: string;
  updated_at: string;
};
export type IntakeFileRow = {
  id: string;
  submission_id: string | null;
  event_report_id: string | null;
  path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};
export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: ContactCategory;
  message: string;
  status: ContactStatus;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
  updated_at: string;
};
export type TeamTermRow = {
  id: string;
  label: string;
  starts_on: string;
  ends_on: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
};
export type TeamMemberRow = {
  id: string;
  term_id: string;
  role_group: TeamRoleGroup;
  position_title: string;
  contributor_id: string | null;
  display_name: string | null;
  photo_asset_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
export type DepartmentContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
export type SiteSettingRow = {
  key: string;
  value: Json;
  is_public: boolean;
  updated_by: string | null;
  updated_at: string;
};
export type AuditLogRow = {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Json;
  created_at: string;
};

export type ArticleCardRow = {
  id: string;
  slug: string;
  title: string;
  kicker: string | null;
  dek: string | null;
  excerpt: string;
  status: ArticleStatus;
  is_featured: boolean;
  editorial_priority: number;
  reading_minutes: number;
  published_at: string | null;
  updated_at: string;
  view_count: number;
  section_id: string;
  section_slug: string;
  section_name: string;
  category_id: string;
  category_slug: string;
  category_name: string;
  cover_asset_id: string | null;
  cover_bucket: 'media' | 'archives' | null;
  cover_path: string | null;
  cover_alt: string | null;
  cover_width: number | null;
  cover_height: number | null;
  cover_variants: MediaVariant[] | null;
  byline: string | null;
  created_by: string | null;
};

export type MostReadRow = {
  id: string;
  slug: string;
  title: string;
  section_slug: string;
  section_name: string;
  category_name: string;
  published_at: string;
  views: number;
};

export type SearchResultRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  section_slug: string;
  section_name: string;
  category_name: string;
  published_at: string | null;
  status: ArticleStatus;
  cover_bucket: 'media' | 'archives' | null;
  cover_path: string | null;
  cover_alt: string | null;
  rank: number;
  total_count: number;
};

export type DashboardStats = {
  published: number;
  published_this_week: number;
  scheduled: number;
  drafts: number;
  in_review: number;
  pending_submissions: number | null;
  oldest_pending_at: string | null;
  unread_messages: number | null;
  pending_comments: number | null;
  views_this_month: number;
  views_last_month: number;
};

// ---------------------------------------------------------------- Salingkusog (supabase/v2/salingkusog.sql)

export type SkCategory = 'ball_games' | 'athletics' | 'racket_sports' | 'aquatics' | 'mind_games' | 'esports' | 'dance_cheer';
export type SkDivision = 'men' | 'women' | 'mixed' | 'open';
export type SkFormat = 'bracket' | 'round_robin' | 'timed' | 'judged';
export type SkMatchStatus = 'upcoming' | 'live' | 'final' | 'postponed' | 'cancelled';
export type SkMedal = 'gold' | 'silver' | 'bronze';
export type SkAwardKind = 'mvp_of_day' | 'athlete_of_day' | 'finals_mvp';
// sk_matches.periods: [{ "label": "Q1", "a": 18, "b": 21 }]
export type SkPeriod = { label: string; a: number | null; b: number | null };
// sk_matches.team_stats: [{ "label": "Rebounds", "a": "42", "b": "38" }]
export type SkStatPair = { label: string; a: string; b: string };
// sk_awards.stat_line: [{ "label": "PTS", "value": "24" }]
export type SkStatValue = { label: string; value: string };

export type SkEditionRow = {
  id: string;
  year: number;
  title: string;
  subtitle: string | null;
  starts_on: string;
  ends_on: string;
  points_gold: number;
  points_silver: number;
  points_bronze: number;
  is_current: boolean;
  is_published: boolean;
  schedule_pdf_asset_id: string | null;
  map_asset_id: string | null;
  /** /salingkusog-2026/countdown is public while true (managing roles only) */
  countdown_enabled: boolean;
  /** null = first day, 8:00 AM Manila */
  countdown_at: string | null;
  created_at: string;
  updated_at: string;
};
export type SkCountdownRow = { title: string; subtitle: string | null; starts_on: string; countdown_at: string };
export type SkFactionRow = {
  id: string;
  edition_id: string;
  name: string;
  slug: string;
  short_name: string | null;
  motto: string | null;
  color: string;
  logo_asset_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
export type SkVenueRow = {
  id: string;
  edition_id: string;
  name: string;
  slug: string;
  description: string | null;
  map_number: number | null;
  map_x: number | null;
  map_y: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
export type SkSportRow = {
  id: string;
  edition_id: string;
  name: string;
  slug: string;
  category: SkCategory;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
export type SkEventRow = {
  id: string;
  edition_id: string;
  sport_id: string;
  name: string;
  slug: string;
  division: SkDivision;
  format: SkFormat;
  is_team: boolean;
  result_unit: string | null;
  venue_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
export type SkAthleteRow = {
  id: string;
  edition_id: string;
  faction_id: string;
  name: string;
  slug: string;
  program: string | null;
  photo_asset_id: string | null;
  created_at: string;
  updated_at: string;
};
export type SkMatchRow = {
  id: string;
  edition_id: string;
  event_id: string;
  round: string | null;
  round_order: number;
  bracket_slot: number | null;
  venue_id: string | null;
  scheduled_at: string;
  status: SkMatchStatus;
  side_a_id: string | null;
  side_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  periods: SkPeriod[];
  team_stats: SkStatPair[];
  live_note: string | null;
  started_at: string | null;
  ended_at: string | null;
  recap_article_id: string | null;
  winner_side: 'a' | 'b' | null; // generated
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};
export type SkAthleteStatsRow = { match_id: string; athlete_id: string; stats: Record<string, number | string> };
export type SkPlacementRow = {
  id: string;
  edition_id: string;
  event_id: string;
  place: number;
  medal: SkMedal | null;
  faction_id: string;
  athlete_id: string | null;
  result: string | null;
  awarded_on: string;
  created_at: string;
  updated_at: string;
};
export type SkAwardRow = {
  id: string;
  edition_id: string;
  kind: SkAwardKind;
  day: string;
  athlete_id: string;
  match_id: string | null;
  event_id: string | null;
  headline: string | null;
  stat_line: SkStatValue[];
  quote: string | null;
  created_at: string;
  updated_at: string;
};
/** One row for sk_set_placements (medal comes from the place). */
export type SkPlacementInput = { place: number; faction_id: string; athlete_id?: string | null; result?: string | null; awarded_on?: string | null };
export type SkTeamRow = { profile_id: string; added_by: string | null; created_at: string };

export type SkMedalTableRow = {
  edition_id: string;
  faction_id: string;
  name: string;
  slug: string;
  short_name: string | null;
  color: string;
  logo_asset_id: string | null;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  points: number;
  rank: number;
};
export type SkPointsByDayRow = { edition_id: string; faction_id: string; day: string; day_number: number; points: number };
export type SkHeadToHeadRow = { edition_id: string; faction_id: string; opponent_id: string; wins: number; losses: number };
export type SkEventStatusRow = {
  edition_id: string;
  event_id: string;
  sport_id: string;
  completed: boolean;
  first_match_at: string | null;
  last_match_at: string | null;
  live: boolean;
};
export type SkEventLeaderRow = { edition_id: string; event_id: string; athlete_id: string; stat: string; total: number; games: number };

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, 'id' | 'email' | 'display_name'>;
      staff_invites: Table<StaffInviteRow, 'email'>;
      sections: Table<SectionRow, 'slug' | 'name'>;
      profile_sections: Table<ProfileSectionRow, 'profile_id' | 'section_id'>;
      categories: Table<CategoryRow, 'section_id' | 'slug' | 'name', [FK<'categories', 'section_id', 'sections'>]>;
      tags: Table<TagRow, 'slug' | 'name'>;
      media_assets: Table<MediaAssetRow, 'path' | 'mime_type' | 'size_bytes'>;
      contributors: Table<
        ContributorRow,
        'name' | 'slug',
        [FK<'contributors', 'avatar_asset_id', 'media_assets'>, FK<'contributors', 'profile_id', 'profiles', true>]
      >;
      publication_issues: Table<
        PublicationIssueRow,
        'title' | 'slug' | 'issue_date',
        [FK<'publication_issues', 'cover_asset_id', 'media_assets'>, FK<'publication_issues', 'pdf_asset_id', 'media_assets'>]
      >;
      articles: Table<
        ArticleRow,
        'category_id' | 'title',
        [
          FK<'articles', 'section_id', 'sections'>,
          FK<'articles', 'category_id', 'categories'>,
          FK<'articles', 'cover_asset_id', 'media_assets'>,
          FK<'articles', 'og_image_asset_id', 'media_assets'>,
          FK<'articles', 'issue_id', 'publication_issues'>,
        ]
      >;
      article_authors: Table<
        ArticleAuthorRow,
        'article_id' | 'contributor_id',
        [FK<'article_authors', 'article_id', 'articles'>, FK<'article_authors', 'contributor_id', 'contributors'>]
      >;
      article_tags: Table<
        ArticleTagRow,
        'article_id' | 'tag_id',
        [FK<'article_tags', 'article_id', 'articles'>, FK<'article_tags', 'tag_id', 'tags'>]
      >;
      article_media: Table<
        ArticleMediaRow,
        'article_id' | 'asset_id',
        [FK<'article_media', 'article_id', 'articles'>, FK<'article_media', 'asset_id', 'media_assets'>]
      >;
      article_revisions: Table<ArticleRevisionRow, 'article_id' | 'title'>;
      article_activity: Table<
        ArticleActivityRow,
        'article_id' | 'action',
        [FK<'article_activity', 'actor_id', 'profiles'>]
      >;
      article_daily_views: Table<ArticleDailyViewsRow, 'article_id' | 'day'>;
      article_comments: Table<
        ArticleCommentRow,
        'article_id' | 'author_name' | 'body',
        [FK<'article_comments', 'article_id', 'articles'>]
      >;
      article_comment_private: Table<ArticleCommentPrivateRow, 'comment_id' | 'author_email'>;
      home_slots: Table<HomeSlotRow, 'slot', [FK<'home_slots', 'article_id', 'articles'>]>;
      article_submissions: Table<
        ArticleSubmissionRow,
        'submitter_name' | 'submitter_email' | 'title',
        [FK<'article_submissions', 'section_id', 'sections'>]
      >;
      event_reports: Table<
        EventReportRow,
        'organization' | 'contact_name' | 'contact_email' | 'event_title' | 'summary'
      >;
      intake_files: Table<IntakeFileRow, 'path' | 'file_name'>;
      contact_messages: Table<ContactMessageRow, 'name' | 'email' | 'subject' | 'message'>;
      team_terms: Table<TeamTermRow, 'label' | 'starts_on'>;
      team_members: Table<
        TeamMemberRow,
        'term_id' | 'role_group' | 'position_title',
        [
          FK<'team_members', 'term_id', 'team_terms'>,
          FK<'team_members', 'contributor_id', 'contributors'>,
          FK<'team_members', 'photo_asset_id', 'media_assets'>,
        ]
      >;
      department_contacts: Table<DepartmentContactRow, 'name'>;
      site_settings: Table<SiteSettingRow, 'key' | 'value'>;
      audit_log: Table<AuditLogRow, 'action' | 'entity'>;
      sk_editions: Table<SkEditionRow, 'year' | 'title' | 'starts_on' | 'ends_on'>;
      sk_factions: Table<SkFactionRow, 'edition_id' | 'name' | 'slug', [FK<'sk_factions', 'logo_asset_id', 'media_assets'>]>;
      sk_venues: Table<SkVenueRow, 'edition_id' | 'name' | 'slug'>;
      sk_sports: Table<SkSportRow, 'edition_id' | 'name' | 'slug' | 'category'>;
      sk_events: Table<SkEventRow, 'sport_id' | 'name' | 'slug'>;
      sk_athletes: Table<SkAthleteRow, 'faction_id' | 'name' | 'slug', [FK<'sk_athletes', 'photo_asset_id', 'media_assets'>]>;
      sk_matches: Table<SkMatchRow, 'event_id' | 'scheduled_at', [FK<'sk_matches', 'recap_article_id', 'articles'>]>;
      sk_athlete_stats: Table<
        SkAthleteStatsRow,
        'match_id' | 'athlete_id',
        [FK<'sk_athlete_stats', 'match_id', 'sk_matches'>, FK<'sk_athlete_stats', 'athlete_id', 'sk_athletes'>]
      >;
      sk_placements: Table<SkPlacementRow, 'event_id' | 'place' | 'faction_id'>;
      sk_awards: Table<
        SkAwardRow,
        'edition_id' | 'kind' | 'day' | 'athlete_id',
        [FK<'sk_awards', 'match_id', 'sk_matches'>, FK<'sk_awards', 'event_id', 'sk_events'>]
      >;
      sk_team: Table<SkTeamRow, 'profile_id', [FK<'sk_team', 'profile_id', 'profiles', true>]>;
    };
    Views: {
      article_cards: { Row: ArticleCardRow; Relationships: [] };
      sk_medal_table: { Row: SkMedalTableRow; Relationships: [] };
      sk_points_by_day: { Row: SkPointsByDayRow; Relationships: [] };
      sk_head_to_head: { Row: SkHeadToHeadRow; Relationships: [] };
      sk_event_status: { Row: SkEventStatusRow; Relationships: [] };
      sk_event_leaders: { Row: SkEventLeaderRow; Relationships: [] };
    };
    Functions: {
      record_article_view: { Args: { p_article_id: string }; Returns: undefined };
      sk_set_placements: { Args: { p_event_id: string; p_rows: SkPlacementInput[] }; Returns: number };
      sk_countdown: { Args: Record<string, never>; Returns: SkCountdownRow[] };
      most_read_articles: { Args: { p_days?: number; p_limit?: number }; Returns: MostReadRow[] };
      archive_months: { Args: Record<string, never>; Returns: { month: string; articles: number }[] };
      search_articles: {
        Args: {
          p_query: string;
          p_section?: string | null;
          p_from?: string | null;
          p_to?: string | null;
          p_limit?: number;
          p_offset?: number;
          p_live_only?: boolean;
        };
        Returns: SearchResultRow[];
      };
      submit_comment: {
        Args: {
          p_article_id: string;
          p_name: string;
          p_email: string;
          p_body: string;
          p_parent_id?: string | null;
          p_website?: string | null;
        };
        Returns: string;
      };
      submit_article: {
        Args: {
          p_name: string;
          p_email: string;
          p_affiliation: string | null;
          p_section_slug: string | null;
          p_title: string;
          p_summary: string | null;
          p_body: string | null;
          p_files?: Json;
          p_website?: string | null;
        };
        Returns: string;
      };
      submit_event_report: {
        Args: {
          p_organization: string;
          p_contact_name: string;
          p_contact_email: string;
          p_event_title: string;
          p_event_date: string | null;
          p_venue: string | null;
          p_summary: string;
          p_files?: Json;
          p_website?: string | null;
        };
        Returns: string;
      };
      send_contact_message: {
        Args: {
          p_name: string;
          p_email: string;
          p_subject: string;
          p_category: ContactCategory;
          p_message: string;
          p_website?: string | null;
        };
        Returns: string;
      };
      transition_article: {
        Args: { p_article_id: string; p_to: ArticleStatus; p_note?: string | null; p_scheduled_for?: string | null };
        Returns: ArticleRow;
      };
      add_article_note: { Args: { p_article_id: string; p_note: string }; Returns: undefined };
      convert_intake_to_article: {
        Args: { p_kind: 'submission' | 'event'; p_intake_id: string; p_category_id: string };
        Returns: string;
      };
      dashboard_stats: { Args: Record<string, never>; Returns: DashboardStats };
      media_usage: { Args: { p_asset_id: string }; Returns: number };
    };
    Enums: {
      app_role: AppRole;
      article_status: ArticleStatus;
      nav_placement: NavPlacement;
      contributor_type: ContributorType;
      asset_kind: AssetKind;
      article_media_usage: ArticleMediaUsage;
      revision_kind: RevisionKind;
      comment_status: CommentStatus;
      intake_status: IntakeStatus;
      contact_category: ContactCategory;
      contact_status: ContactStatus;
      issue_type: IssueType;
      team_role_group: TeamRoleGroup;
      sk_category: SkCategory;
      sk_division: SkDivision;
      sk_format: SkFormat;
      sk_match_status: SkMatchStatus;
      sk_medal: SkMedal;
      sk_award_kind: SkAwardKind;
    };
    CompositeTypes: Record<string, never>;
  };
};
