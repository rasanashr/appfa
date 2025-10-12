<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  let tag = data.tag;

  async function handleSubmit() {
    const response = await fetch(`/api/tags/${tag.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tag),
    });

    if (response.ok) {
      window.location.href = '/admin/tags';
    } else {
      const result = await response.json();
      alert(result.message);
    }
  }
</script>

<h1>Edit Tag</h1>

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="name">Name</label>
    <input type="text" id="name" bind:value={tag.name} />
  </div>
  <div>
    <label for="slug">Slug</label>
    <input type="text" id="slug" bind:value={tag.slug} />
  </div>
  <button type="submit">Update</button>
</form>