<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  let user = data.user || {
    name: '',
    email: '',
    password: '',
    role: 'USER',
  };
</script>

<h1>{data.user ? 'Edit User' : 'New User'}</h1>

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="name">Name</label>
    <input type="text" id="name" bind:value={user.name} />
  </div>
  <div>
    <label for="email">Email</label>
    <input type="email" id="email" bind:value={user.email} />
  </div>
  <div>
    <label for="password">Password</label>
    <input type="password" id="password" bind:value={user.password} placeholder="Leave blank to keep current password" />
  </div>
  <div>
    <label for="role">Role</label>
    <select id="role" bind:value={user.role}>
      <option value="USER">User</option>
      <option value="EDITOR">Editor</option>
      <option value="AUTHOR">Author</option>
      <option value="ADMIN">Admin</option>
    </select>
  </div>
  <button type="submit">{data.user ? 'Update' : 'Create'}</button>
</form>

<script>
  async function handleSubmit() {
    const method = user.id ? 'PUT' : 'POST';
    const url = user.id ? `/api/users/${user.id}` : '/api/users';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    if (response.ok) {
      window.location.href = '/admin/users';
    } else {
      const result = await response.json();
      alert(result.message);
    }
  }
</script>