<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  let name = '';
  let slug = '';

  async function handleSubmit() {
    const response = await fetch('/api/categories', {
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

<h1>Categories</h1>

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="name">Name</label>
    <input type="text" id="name" bind:value={name} />
  </div>
  <div>
    <label for="slug">Slug</label>
    <input type="text" id="slug" bind:value={slug} />
  </div>
  <button type="submit">Create Category</button>
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
    {#each data.categories as category}
      <tr>
        <td>{category.name}</td>
        <td>{category.slug}</td>
        <td>
          <a href="/admin/categories/{category.id}">Edit</a>
          <form action="/api/categories/{category.id}" method="POST">
            <input type="hidden" name="_method" value="DELETE" />
            <button type="submit">Delete</button>
          </form>
        </td>
      </tr>
    {/each}
  </tbody>
</table>