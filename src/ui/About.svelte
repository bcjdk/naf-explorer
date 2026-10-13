<script lang="ts">
  import { ABOUT } from '../scenario/scenario.ts';

  let { dialog = $bindable() }: { dialog?: HTMLDialogElement } = $props();
</script>

<!-- Native modal (spec §11): focus trap, Esc, inert background and focus return come from showModal(),
     which also focuses the first control, ✕. -->
<dialog
  bind:this={dialog}
  class="about"
  aria-labelledby="about-title"
  onclick={(e) => e.target === dialog && dialog?.close()}
  onclose={() => {
    if (dialog && 'onLoad' in dialog.dataset) document.getElementById('caption-heading')?.focus();
  }}
>
  <div class="about-body">
    <button class="about-close" aria-label="Close About" onclick={() => dialog?.close()}>✕</button>
    <h2 id="about-title">{ABOUT.title}</h2>
    <p class="about-lead">{ABOUT.intro}</p>

    <div class="about-columns">
      {#each ABOUT.sections as s (s.heading)}
        <section>
          <h3>{s.heading}</h3>
          <p>{s.text}</p>
        </section>
      {/each}
    </div>

    <blockquote>{ABOUT.framing} {ABOUT.liberties}</blockquote>

    <h3>How to use it</h3>
    <ul class="about-keys">
      {#each ABOUT.howTo as h (h.text)}
        <li>
          {#each h.keys as k, i (k)}{#if i}<span class="about-or">/</span>{/if}<kbd>{k}</kbd>{/each}
          <span>{h.text}</span>
        </li>
      {/each}
    </ul>

    <h3>References</h3>
    <ul class="about-refs">
      <li>
        <a href={ABOUT.naf.href} target="_blank" rel="noopener">{ABOUT.naf.label}</a>
        <span>{ABOUT.naf.after}</span>
      </li>
      <li>
        <span
          >{ABOUT.credit.before}<a href={ABOUT.credit.href} target="_blank" rel="noopener"
            >{ABOUT.credit.label}</a
          >
          (<a href={ABOUT.credit.source} target="_blank" rel="noopener">source</a>){ABOUT.credit
            .after}</span
        >
      </li>
    </ul>
  </div>
</dialog>
