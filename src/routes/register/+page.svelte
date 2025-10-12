<script lang="ts">
  let name = '';
  let email = '';
  let password = '';
  let message = '';

  async function handleSubmit() {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      window.location.href = '/login';
    } else {
      message = data.message;
    }
  }
</script>

<h1>Register</h1>

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="name">Name</label>
    <input type="text" id="name" bind:value={name} />
  </div>
  <div>
    <label for="email">Email</label>
    <input type="email" id="email" bind:value={email} />
  </div>
  <div>
    <label for="password">Password</label>
    <input type="password" id="password" bind:value={password} />
  </div>
  <button type="submit">Register</button>
</form>

{#if message}
  <p>{message}</p>
{/if}