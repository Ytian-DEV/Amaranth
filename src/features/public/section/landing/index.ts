import type { ComponentType } from 'react';
import type { LandingProps } from './blocks';
import { NewsLanding } from './NewsLanding';

/** Sections with their own front page (Track B). Others use the shared list template. */
export const sectionLandings: Record<string, ComponentType<LandingProps>> = {
  news: NewsLanding,
};
