<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  let category = data.category;

  async function handleSubmit() {
    const response = await fetch(`/api/categories/${category.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(category),
    });

    if (response.ok) {
      window.location.href = '/admin/categories';
    } else {
      const result = await response.json();
      alert(result.message);
    }
  }
</script>

<h1>Edit Category</h1>

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="name">Name</label>
    <input type="text" id="name" bind:value={category.name} />
  </div>
  <div>
    <label for="slug">Slug</label>
    <input type="text" id="slug" bind:value={category.slug} />
  </div>
  <button type="submit">Update</button>
</form>