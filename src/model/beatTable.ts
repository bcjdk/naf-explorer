import { CHAPTERS, RESPONSIBILITIES, STEPS, kind, version } from '../scenario/scenario.ts';
import type { Chapter, Step } from '../scenario/types.ts';
import { artifactName, describe } from './describe.ts';

/** Spec §5, generated so that it can never drift from scenario.ts (lesson 23). */
export function beatTable(steps: readonly Step[] = STEPS): string {
  const out: string[] = [];
  for (const ch of Object.keys(CHAPTERS) as Chapter[]) {
    out.push(
      `### ${CHAPTERS[ch]}`,
      '',
      '| # | Title | New | Events in order |',
      '|---|---|---|---|',
    );
    for (const s of steps.filter((x) => x.chapter === ch)) {
      const added = s.events.flatMap((e) =>
        e.t === 'appear'
          ? [
              `${RESPONSIBILITIES[kind(version(e.version).kind).producer].name}: ${artifactName(e.version)}`,
            ]
          : [],
      );
      const events = s.events.flatMap((e) => (e.t === 'appear' ? [] : [describe(e, 'simple')]));
      out.push(
        `| ${s.id} | ${s.title} | ${added.join(' · ') || 'none'} | ${events.join(' · ') || 'none'} |`,
      );
    }
    out.push('');
  }
  return out.join('\n');
}
