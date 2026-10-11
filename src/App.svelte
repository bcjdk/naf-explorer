<script lang="ts">
  import { tick } from 'svelte';
  import { STEPS } from './scenario/scenario.ts';
  import type { View } from './scenario/types.ts';
  import type { Target } from './model/inspect.ts';
  import { stateAt } from './model/state.ts';
  import { routesOf } from './routes.ts';
  import { timeline } from './model/timeline.ts';
  import { tokenStyle } from './theme.ts';
  import { fitScale, STAGE } from './layout.ts';
  import { load, save } from './storage.ts';
  import Header from './ui/Header.svelte';
  import Stage from './ui/Stage.svelte';
  import CaptionBar from './ui/CaptionBar.svelte';
  import About from './ui/About.svelte';
  import { finishAll, play, prefersReducedMotion } from './ui/motion.ts';

  const VIEW_KEY = 'naf.view';
  let about = $state<HTMLDialogElement>();
  // The About window opens on every load and refresh (brief 06, as changed by the user on 2026-10-11).
  $effect(() => {
    if (about && !about.open) about.showModal();
  });

  let step = $state(0);
  let view = $state<View>(load(VIEW_KEY) === 'technical' ? 'technical' : 'simple');
  let innerWidth = $state(1440);
  let innerHeight = $state(900);
  const scale = $derived(fitScale(innerWidth, innerHeight));
  const stage = $derived(stateAt(step));
  const routes = $derived(routesOf(step, view));

  let selected = $state<Target | null>(null);

  function select(t: Target) {
    finishAll();
    selected = t;
  }

  /** Every navigation finishes running motion first; only a single step forward plays (spec §8). */
  async function go(n: number, animate = false) {
    finishAll();
    // A focused line label belongs to the old beat and is about to unmount: keep focus on the story.
    const onLabel = document.activeElement?.classList.contains('label');
    const target = Math.max(0, Math.min(STEPS.length - 1, n));
    const from = step;
    step = target;
    await tick();
    // Rapid presses: only the latest navigation plays, once its beat is rendered.
    if (animate && step === target && target === from + 1 && !prefersReducedMotion())
      play(timeline(target));
    if (onLabel)
      (
        document.querySelector<HTMLElement>('.label') ?? document.getElementById('caption-heading')
      )?.focus();
  }

  function replay() {
    finishAll();
    if (!prefersReducedMotion()) play(timeline(step));
  }

  function openAbout() {
    finishAll();
    about?.showModal();
  }

  function setView(v: View) {
    view = v;
    save(VIEW_KEY, v);
  }

  function onKeydown(e: KeyboardEvent) {
    // Modified arrows belong to the browser and OS (history, text selection, spaces).
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    // The story stands still while About is open.
    if (about?.open) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(step + 1, true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(step - 1);
    }
  }
</script>

<svelte:window bind:innerWidth bind:innerHeight onkeydown={onKeydown} />

<div class="viewport" style={tokenStyle}>
  <div
    class="stage"
    style:width="{STAGE.w}px"
    style:height="{STAGE.h}px"
    style:transform="translate(-50%, -50%) scale({scale})"
  >
    <Header {step} {view} onJump={go} onView={setView} onAbout={openAbout} onReplay={replay} />
    <Stage {stage} {routes} {view} {step} {selected} onSelect={select} />
    <CaptionBar {step} {view} onBack={() => go(step - 1)} onNext={() => go(step + 1, true)} />
  </div>
  <!-- Inside .viewport so the dialog inherits the colour tokens; showModal() lifts it to the top layer. -->
  <About bind:dialog={about} />
</div>
