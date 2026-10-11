<script lang="ts">
  import { CHAPTERS, STEPS, TITLE } from '../scenario/scenario.ts';
  import type { Chapter, View } from '../scenario/types.ts';

  let {
    step,
    view,
    onJump,
    onView,
  }: { step: number; view: View; onJump: (n: number) => void; onView: (v: View) => void } =
    $props();

  const chapters = Object.keys(CHAPTERS) as Chapter[];
  const indexed = STEPS.map((s, i) => ({ s, i }));
</script>

<header class="header">
  <h1>{TITLE}</h1>
  <nav aria-label="Story">
    {#each chapters as ch (ch)}
      <div class="chapter">
        <button
          class="chapter-name"
          class:current={STEPS[step]?.chapter === ch}
          onclick={() => onJump(STEPS.findIndex((s) => s.chapter === ch))}>{CHAPTERS[ch]}</button
        >
        {#each indexed.filter(({ s }) => s.chapter === ch) as { s, i } (s.id)}
          <button
            class="tick"
            aria-label="Go to {s.id}: {s.title}"
            aria-current={i === step ? 'step' : undefined}
            onclick={() => onJump(i)}
          ></button>
        {/each}
      </div>
    {/each}
  </nav>
  <!-- Toggle buttons, not radios: native radios use ←/→, which belong to the story (spec rev 2). -->
  <div class="view" role="group" aria-label="Detail level">
    <button aria-pressed={view === 'simple'} onclick={() => onView('simple')}>Simple</button>
    <button aria-pressed={view === 'technical'} onclick={() => onView('technical')}
      >Technical</button
    >
  </div>
</header>
