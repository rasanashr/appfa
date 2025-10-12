<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  let file: File;
  let altText = '';

  async function handleSubmit() {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', altText);

    const response = await fetch('/api/media', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      window.location.reload();
    } else {
      const result = await response.json();
      alert(result.message);
    }
  }
</script>

<h1>Media Library</h1>

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="file">File</label>
    <input type="file" id="file" on:change={(e) => (file = e.target.files[0])} />
  </div>
  <div>
    <label for="altText">Alt Text</label>
    <input type="text" id="altText" bind:value={altText} />
  </div>
  <button type="submit">Upload</button>
</form>

<div class="media-grid">
  {#each data.media as item}
    <div class="media-item">
      {#if item.type === 'IMAGE'}
        <img src={item.url} alt={item.altText} />
      {:else}
        <video src={item.url} controls />
      {/if}
      <p>{item.altText}</p>
    </div>
  {/each}
</div>

<style>
  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  .media-item img,
  .media-item video {
    width: 100%;
    height: auto;
  }
</style>