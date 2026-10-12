<script lang="ts">
  import type { View } from '../scenario/types.ts';
  import { inspect, type Target } from '../model/inspect.ts';

  let {
    target,
    step,
    view,
    side,
    onSelect,
    onClose,
  }: {
    target: Target;
    step: number;
    view: View;
    side: 'left' | 'right';
    onSelect: (t: Target) => void;
    onClose: () => void;
  } = $props();

  const info = $derived(inspect(target, step, view));
</script>

<!-- Non-modal (spec §7): the story keeps stepping while it is open, and it follows the beat. -->
<aside class="inspector {side}" aria-labelledby="inspector-title">
  <button class="inspector-close" aria-label="Close inspector" onclick={onClose}>✕</button>
  <p class="inspector-kind">{info.kind}</p>
  <h2 id="inspector-title" tabindex="-1">{info.title}</h2>
  {#if info.note}<p class="inspector-note">{info.note}</p>{/if}
  {#each info.sections as s (s.heading)}
    <h3>{s.heading}</h3>
    <ul class:mono={s.look === 'code'}>
      {#each s.items as it, i (i)}
        <li>
          {#if it.target}
            <button class="inspector-link" onclick={() => onSelect(it.target!)}>{it.text}</button>
          {:else}
            {it.text}
          {/if}
        </li>
      {/each}
    </ul>
  {/each}
</aside>
