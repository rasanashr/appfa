<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<h1>Posts</h1>

<a href="/admin/posts/new">New Post</a>

<table>
  <thead>
    <tr>
      <th>Title</th>
      <th>Author</th>
      <th>Category</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each data.posts as post}
      <tr>
        <td>{post.title}</td>
        <td>{post.author.name}</td>
        <td>{post.category.name}</td>
        <td>
          <a href="/admin/posts/{post.id}">Edit</a>
          <form action="/api/posts/{post.id}" method="POST">
            <input type="hidden" name="_method" value="DELETE" />
            <button type="submit">Delete</button>
          </form>
        </td>
      </tr>
    {/each}
  </tbody>
</table>