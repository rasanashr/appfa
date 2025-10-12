<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  let name = '';
  let slug = '';

  async function handleSubmit() {
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, slug }),
    });

    if (response.ok) {
      window.location.reload();
    } else {
      const result = await response.json();
      alert(result.message);
    }
  }
</script>

<h1>Tags</h1>

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="name">Name</label>
    <input type="text" id="name" bind:value={name} />
  </div>
  <div>
    <label for="slug">Slug</label>
    <input type="text" id="slug" bind:value={slug} />
  </div>
  <button type="submit">Create Tag</button>
</form>

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Slug</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each data.tags as tag}
      <tr>
        <td>{tag.name}</td>
        <td>{tag.slug}</td>
        <td>
          <a href="/admin/tags/{tag.id}">Edit</a>
          <form action="/api/tags/{tag.id}" method="POST">
            <input type="hidden" name="_method" value="DELETE" />
            <button type="submit">Delete</button>
          </form>
        </td>
      </tr>
    {/each}
  </tbody>
</table>