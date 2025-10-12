<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<h1>Pages</h1>

<a href="/admin/pages/new">New Page</a>

<table>
  <thead>
    <tr>
      <th>Title</th>
      <th>Author</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each data.pages as page}
      <tr>
        <td>{page.title}</td>
        <td>{page.author.name}</td>
        <td>
          <a href="/admin/pages/{page.id}">Edit</a>
          <form action="/api/pages/{page.id}" method="POST">
            <input type="hidden" name="_method" value="DELETE" />
            <button type="submit">Delete</button>
          </form>
        </td>
      </tr>
    {/each}
  </tbody>
</table>