import { describe, expect, it } from 'vitest';
import { STEPS, kind, version } from '../../src/scenario/scenario.ts';
import { lineKey, stateAt, type Slot, type StageState } from '../../src/model/state.ts';
import { stepLength, timeline, type MotionSlot } from '../../src/model/timeline.ts';

const at = (id: string) => STEPS.findIndex((s) => s.id === id);
const end = (s: MotionSlot) => s.start + s.duration;
const status = (id?: string) => (id ? version(id).status : undefined);
const newest = (s: StageState, k: string) =>
  (Object.values(s.slots).flat() as Slot[]).find((x) => x.kind === k)?.versions.at(-1);

describe('timeline (spec §8)', () => {
  it('a network event animates only the field it changes', () => {
    const targets = (id: string) =>
      timeline(at(id))
        .filter((s) => s.kind === 'network')
        .map((s) => s.target);
    expect(targets('D1')).toEqual(['link']);
    expect(targets('P8')).toEqual(['path']);
    expect(targets('R7')).toEqual(['path']);
  });

  it('a beat without events has no motion', () => {
    expect(timeline(at('P1'))).toEqual([]);
  });

  it('draws every signal and handoff as a line, in event order, one after another', () => {
    STEPS.forEach((step, n) => {
      const lines = timeline(n).filter((s) => s.kind === 'line');
      const expected = step.events.flatMap((e, i) =>
        e.t === 'signal' || e.t === 'handoff' ? [[lineKey(e), i]] : [],
      );
      expect(
        lines.map((s) => [s.target, s.event]),
        step.id,
      ).toEqual(expected);
      lines
        .slice(1)
        .forEach((s, k) => expect(s.start, step.id).toBeGreaterThanOrEqual(end(lines[k]!)));
    });
  });

  it('an artifact appears only after every exchange addressed to its producer earlier in the step', () => {
    STEPS.forEach((step, n) => {
      const slots = timeline(n);
      for (const a of slots.filter((s) => s.kind === 'appear')) {
        const producer = kind(version(a.target).kind).producer;
        for (const l of slots.filter((s) => s.kind === 'line' && s.event < a.event)) {
          const e = step.events[l.event]!;
          if ((e.t === 'signal' || e.t === 'handoff') && e.to === producer)
            expect(a.start, `${step.id} ${a.target}`).toBeGreaterThanOrEqual(end(l));
        }
      }
    });
  });

  it('nothing starts before an earlier exchange in the step has finished', () => {
    STEPS.forEach((step, n) => {
      const slots = timeline(n);
      for (const l of slots.filter((s) => s.kind === 'line'))
        for (const s of slots.filter((x) => x.event > l.event))
          expect(s.start, `${step.id} ${s.kind} ${s.target}`).toBeGreaterThanOrEqual(end(l));
    });
  });

  it('a Network artifact appears just before its own handoff', () => {
    STEPS.forEach((step, n) => {
      const slots = timeline(n);
      for (const a of slots.filter(
        (s) => s.kind === 'appear' && kind(version(s.target).kind).producer === 'network',
      )) {
        const next = step.events[a.event + 1];
        expect(next, `${step.id} ${a.target}`).toMatchObject({ t: 'handoff', version: a.target });
        const line = slots.find((s) => s.kind === 'line' && s.event === a.event + 1)!;
        expect(line.start, `${step.id} ${a.target}`).toBe(end(a));
      }
    });
  });

  it('every status chip whose value changed pulses three times, within the beat', () => {
    STEPS.forEach((step, n) => {
      const before = stateAt(n - 1);
      const now = stateAt(n);
      const expected: string[] = [];
      for (const sl of Object.values(now.slots).flat() as Slot[]) {
        const id = sl.versions.at(-1)!;
        if (status(id) && status(id) !== status(newest(before, sl.kind))) expected.push(id);
      }
      for (const [sf, id] of Object.entries(now.surfaces))
        if (
          status(id) &&
          status(id) !== status(before.surfaces[sf as keyof typeof before.surfaces])
        )
          expected.push(`surface:${sf}`);
      if (now.linkDegraded && !before.linkDegraded) expected.push('link');
      const slots = timeline(n);
      const pulses = slots.filter((s) => s.kind === 'pulse');
      expect(pulses.map((p) => p.target).toSorted(), step.id).toEqual(expected.toSorted());
      for (const p of pulses) expect(end(p), step.id).toBeLessThanOrEqual(stepLength(slots));
    });
  });

  it('pulses the moments that matter: the fault, the degraded service, the violation', () => {
    const targets = (id: string) =>
      timeline(at(id))
        .filter((s) => s.kind === 'pulse')
        .map((s) => s.target);
    expect(targets('D1')).toEqual(['link']);
    expect(targets('D9')).toEqual(expect.arrayContaining(['ss2', 'surface:portal']));
    expect(targets('D10')).toEqual(expect.arrayContaining(['ev-viol', 'surface:faultMgmt']));
  });

  it('a receiver gains the result when the handoff line arrives', () => {
    STEPS.forEach((step, n) => {
      const slots = timeline(n);
      for (const l of slots.filter((s) => s.kind === 'line')) {
        const e = step.events[l.event]!;
        if (e.t !== 'handoff') continue;
        const to = e.surface ? `surface:${e.surface}` : e.to;
        expect(
          slots.some((s) => s.kind === 'gain' && s.target === to && s.start === end(l)),
          `${step.id} ${l.target}`,
        ).toBe(true);
      }
    });
  });

  it('each working party gets one work slot, at its first work in the beat', () => {
    STEPS.forEach((step, n) => {
      const owners = [...new Set(step.events.flatMap((e) => (e.t === 'work' ? [e.owner] : [])))];
      expect(
        timeline(n)
          .filter((s) => s.kind === 'work')
          .map((s) => s.target),
        step.id,
      ).toEqual(owners);
    });
  });

  it('no beat runs longer than 8 s, so a reader can follow it', () => {
    STEPS.forEach((step, n) => expect(stepLength(timeline(n)), step.id).toBeLessThanOrEqual(8000));
  });
});
