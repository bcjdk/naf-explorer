<script lang="ts">
  import { RESPONSIBILITIES, SURFACES } from '../scenario/scenario.ts';
  import type { Party, View } from '../scenario/types.ts';
  import { inspect, type Item, type Target } from '../model/inspect.ts';

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
  const accent = (p?: Party) => (p ? `var(--${p})` : null);
  const strip = $derived(info.strip);
  const endLabel = (p: Party) =>
    p === 'presentation' && strip?.surface
      ? `${RESPONSIBILITIES.presentation.name} (${SURFACES[strip.surface]})`
      : RESPONSIBILITIES[p].name;
</script>

{#snippet partyLink(p: Party, label = RESPONSIBILITIES[p].name)}
  <button class="inspector-link" onclick={() => onSelect({ t: 'responsibility', party: p })}
    ><span class="swatch" style:--accent={accent(p)}></span>{label}</button
  >
{/snippet}

{#snippet item(it: Item)}
  {#if it.status}
    <span class="chip {it.status.toLowerCase()}">{it.text}</span>
  {:else if it.target}
    <button class="inspector-link" onclick={() => onSelect(it.target!)}>{it.text}</button>
  {:else}
    {it.text}
  {/if}
  {#if it.note}<span class="inspector-uses">{it.note}</span>{/if}
{/snippet}

<!-- Non-modal (spec §7): the story keeps stepping while it is open, and it follows the beat. -->
<aside class="inspector {side}" aria-labelledby="inspector-title">
  <div class="inspector-head" class:dashed={info.dashed} style:--accent={accent(info.party)}>
    <button class="inspector-close" aria-label="Close inspector" onclick={onClose}>✕</button>
    <p class="inspector-kind">
      {#if !info.by}<span class="swatch"></span>{/if}<span
        >{info.kind}{#if info.by}{` · ${info.kind === 'Surface' ? 'in' : 'by'}`}{/if}</span
      >{#if info.by}{@render partyLink(info.by, info.byLabel)}{/if}
    </p>
    <h2 id="inspector-title" tabindex="-1">{info.title}</h2>
    {#if info.note}<p class="inspector-note">{info.note}</p>{/if}
  </div>
  <div class="inspector-body">
    {#if strip}
      <p class="strip" class:dashed={info.dashed} style:--accent={accent(info.party)}>
        {@render partyLink(strip.from, endLabel(strip.from))}
        <span class="strip-line" aria-hidden="true"></span>
        <span class="sr-only">to</span>
        {@render partyLink(strip.to, endLabel(strip.to))}
      </p>
    {/if}
    {#each info.sections as s (s.heading)}
      <section class="look-{s.look}" style:--code={s.look === 'code' ? accent(info.party) : null}>
        <h3>{s.heading}</h3>
        {#if s.look === 'text'}
          {#each s.items as it, i (i)}<p>{@render item(it)}</p>{/each}
        {:else}
          <ul>
            {#each s.items as it, i (i)}
              <li style:--accent={accent(it.party)}>{@render item(it)}</li>
            {/each}
          </ul>
        {/if}
      </section>
    {/each}
  </div>
</aside>
