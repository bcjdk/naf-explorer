<script lang="ts">
  import { fitScale, STAGE } from './layout.ts';

  let innerWidth = $state(1440);
  let innerHeight = $state(900);
  const scale = $derived(fitScale(innerWidth, innerHeight));
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div class="viewport">
  <div
    class="stage"
    style:width="{STAGE.w}px"
    style:height="{STAGE.h}px"
    style:transform="translate(-50%, -50%) scale({scale})"
  >
    <h1>How Network Automation Works</h1>
  </div>
</div>
