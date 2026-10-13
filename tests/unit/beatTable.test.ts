import { describe as group, expect, it } from 'vitest';
import { beatTable } from '../../src/model/beatTable.ts';
import { describe } from '../../src/model/describe.ts';

group('describe', () => {
  it('writes signals, handoffs, work and marks as one line each', () => {
    expect(
      describe(
        {
          t: 'signal',
          signal: 'checkConformance',
          from: 'orchestrator',
          to: 'observability',
          version: 'ds1',
        },
        'simple',
      ),
    ).toBe('Orchestrator ⇢ Observability: check config v1');
    expect(
      describe(
        {
          t: 'handoff',
          version: 'sr',
          from: 'presentation',
          to: 'orchestrator',
          surface: 'portal',
        },
        'simple',
      ),
    ).toBe('Portal → Orchestrator: Service request (submitted)');
    expect(describe({ t: 'mark', version: 'si', marker: 'UNCHANGED' }, 'simple')).toBe(
      'Service intent (v1) = UNCHANGED',
    );
  });

  it('writes the network ground truth in each view', () => {
    const link = { t: 'network', link: { id: 'CPH01-ODE01', status: 'DEGRADED' } } as const;
    expect(describe(link, 'simple')).toBe('Link CPH01-ODE01 ▲ DEGRADED');
    expect(describe(link, 'technical')).toBe('Link CPH01-ODE01 ▲ DEGRADED');
    expect(describe({ t: 'network', acmePath: 'B' }, 'simple')).toBe(
      'ACME traffic: path B via KOL01',
    );
    expect(describe({ t: 'network', acmePath: 'B' }, 'technical')).toBe(
      'ACME (colour 100) · path B CPH01-KOL01-AAR01',
    );
  });

  it('uses the view for work labels', () => {
    const e = {
      t: 'work',
      owner: 'executor',
      verb: 'apply',
      label: { simple: 'apply', technical: 'gNMI Set' },
    } as const;
    expect(describe(e, 'simple')).toBe('Executor: apply');
    expect(describe(e, 'technical')).toBe('Executor: gNMI Set');
  });
});

group('beatTable', () => {
  const md = beatTable();
  const rows = md.split('\n').filter((l) => /^\| [PDR]\d+ \|/.test(l));

  it('has one row per beat under three chapter headings', () => {
    expect(rows).toHaveLength(40);
    expect(md).toContain('### Provision');
    expect(md).toContain('### Detect');
    expect(md).toContain('### Remediate');
  });

  it('lists new artifacts and events in order', () => {
    expect(rows[0]).toBe('| P1 | Orientation | none | none |');
    const p9 = rows.find((r) => r.startsWith('| P9 |'))!;
    expect(p9).toContain('Collector: Observed device state (v1)');
    expect(p9).toMatch(/read back applied state.*read back done/);
    expect(rows.find((r) => r.startsWith('| P2 |'))).toContain(
      'Portal → Orchestrator: Service request (submitted)',
    );
  });
});
