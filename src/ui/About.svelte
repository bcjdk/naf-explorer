<script lang="ts">
  import { tick } from 'svelte';
  import { ABOUT } from '../scenario/scenario.ts';

  let { dialog = $bindable() }: { dialog?: HTMLDialogElement } = $props();
  /** Two views in one window: a short welcome, and the notes (framing, liberties, credits) one click away. */
  let view = $state<'welcome' | 'notes'>('welcome');

  async function show(v: 'welcome' | 'notes') {
    view = v;
    await tick();
    // Keyboard and screen-reader users follow the switch.
    document.getElementById(v === 'notes' ? 'about-notes-title' : 'about-title')?.focus();
  }
</script>

<!-- Native modal (spec §11): focus trap, Esc, inert background and focus return come from showModal(),
     which also focuses the first control, ✕. -->
<dialog
  bind:this={dialog}
  class="about"
  aria-labelledby="about-title"
  onclick={(e) => e.target === dialog && dialog?.close()}
  onclose={() => {
    view = 'welcome';
    if (dialog && 'onLoad' in dialog.dataset) document.getElementById('caption-heading')?.focus();
  }}
>
  <div class="about-body">
    <button class="about-close" aria-label="Close About" onclick={() => dialog?.close()}>✕</button>
    {#if view === 'welcome'}
      <h2 id="about-title" tabindex="-1">{ABOUT.title}</h2>
      <p class="about-lead">{ABOUT.lead}</p>
      <p class="about-who">{ABOUT.who}</p>
      <ul class="about-keys">
        {#each ABOUT.howTo as h (h.text)}
          <li>
            {#each h.keys as k, i (k)}{#if i}<span class="about-or">/</span>{/if}<kbd>{k}</kbd
              >{/each}
            <span>{h.text}</span>
          </li>
        {/each}
      </ul>
      <div class="about-foot">
        <button class="about-link" onclick={() => show('notes')}>Notes and credits →</button>
        <span class="about-hint">Press <kbd>Esc</kbd> to begin</span>
      </div>
    {:else}
      <!-- The dialog keeps its name; this heading names the view. -->
      <h2 id="about-title" class="sr-only">{ABOUT.title}</h2>
      <button class="about-link about-back" onclick={() => show('welcome')}>← Back</button>
      <h3 id="about-notes-title" tabindex="-1">Notes and credits</h3>
      <h4>An example, not a prescription</h4>
      <p>{ABOUT.framing}</p>
      <h4>Liberties taken</h4>
      <ul class="about-liberties">
        {#each ABOUT.liberties as l (l.what)}
          <li>
            <strong>{l.what}</strong>
            {l.detail}
            <span class="about-why"><strong>Why:</strong> {l.why}</span>
          </li>
        {/each}
      </ul>
      <h4>Credits</h4>
      <p>
        {ABOUT.author.before}<a href={ABOUT.author.href} target="_blank" rel="noopener"
          >{ABOUT.author.label}</a
        >.
      </p>
      <p>
        <a href={ABOUT.naf.href} target="_blank" rel="noopener">{ABOUT.naf.label}</a>{ABOUT.naf
          .after}
      </p>
      <p>
        {ABOUT.credit.before}<a href={ABOUT.credit.href} target="_blank" rel="noopener"
          >{ABOUT.credit.label}</a
        >
        (<a href={ABOUT.credit.source} target="_blank" rel="noopener">source</a>){ABOUT.credit
          .after}
      </p>
    {/if}
  </div>
</dialog>
