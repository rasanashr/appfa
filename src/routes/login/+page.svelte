<script lang="ts">
  let email = '';
  let password = '';
  let message = '';

  async function handleSubmit() {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      window.location.href = '/';
    } else {
      message = data.message;
    }
  }
</script>

<h1>Login</h1>

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="email">Email</label>
    <input type="email" id="email" bind:value={email} />
  </div>
  <div>
    <label for="password">Password</label>
    <input type="password" id="password" bind:value={password} />
  </div>
  <button type="submit">Login</button>
</form>

{#if message}
  <p>{message}</p>
{/if}