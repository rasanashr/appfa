<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<h1>Users</h1>

<a href="/admin/users/new">New User</a>

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each data.users as user}
      <tr>
        <td>{user.name}</td>
        <td>{user.email}</td>
        <td>{user.role}</td>
        <td>
          <a href="/admin/users/{user.id}">Edit</a>
          <form action="/api/users/{user.id}" method="POST">
            <input type="hidden" name="_method" value="DELETE" />
            <button type="submit">Delete</button>
          </form>
        </td>
      </tr>
    {/each}
  </tbody>
</table>