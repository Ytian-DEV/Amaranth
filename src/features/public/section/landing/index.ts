import type { ComponentType } from 'react';
import type { LandingProps } from './blocks';
import { BlogsLanding } from './BlogsLanding';
import { FeatureLanding } from './FeatureLanding';
import { InvestigativeLanding } from './InvestigativeLanding';
import { LiteraryLanding } from './LiteraryLanding';
import { NewsLanding } from './NewsLanding';
import { ScienceLanding } from './ScienceLanding';
import { SpecialsLanding } from './SpecialsLanding';
import { ViewsLanding } from './ViewsLanding';

/** Sections with their own front page (Track B). Others use the shared list template. */
export const sectionLandings: Record<string, ComponentType<LandingProps>> = {
  news: NewsLanding,
  feature: FeatureLanding,
  literary: LiteraryLanding,
  blogs: BlogsLanding,
  specials: SpecialsLanding,
  views: ViewsLanding,
  'science-technology': ScienceLanding,
  investigative: InvestigativeLanding,
};
