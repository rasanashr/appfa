<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }
</script>

<h1>Welcome to the CMS</h1>

{#if data.user}
  <p>Welcome, {data.user.email}</p>
  <button on:click={handleLogout}>Logout</button>
{:else}
  <p>You are not logged in.</p>
  <a href="/login">Login</a>
  <a href="/register">Register</a>
{/if}