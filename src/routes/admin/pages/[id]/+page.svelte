<script lang="ts">
  import type { PageData } from './$types';
  import Editor from '@tinymce/tinymce-svelte';

  export let data: PageData;

  let page = data.page || {
    title: '',
    slug: '',
    body: '',
    featuredImage: '',
    seoTitle: '',
    seoDescription: '',
    schema: {},
  };

  async function handleSubmit() {
    const method = data.page ? 'PUT' : 'POST';
    const url = data.page ? `/api/pages/${data.page.id}` : '/api/pages';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(page),
    });

    if (response.ok) {
      window.location.href = '/admin/pages';
    } else {
      const result = await response.json();
      alert(result.message);
    }
  }
</script>

<h1>{data.page ? 'Edit Page' : 'New Page'}</h1>

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="title">Title</label>
    <input type="text" id="title" bind:value={page.title} />
  </div>
  <div>
    <label for="slug">Slug</label>
    <input type="text" id="slug" bind:value={page.slug} />
  </div>
  <div>
    <label for="body">Body</label>
    <Editor
      apiKey="no-api-key"
      bind:value={page.body}
      init={{
        height: 500,
        menubar: false,
        plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table paste code help wordcount',
        ],
        toolbar:
          'undo redo | formatselect | bold italic backcolor | \
          alignleft aligncenter alignright alignjustify | \
          bullist numlist outdent indent | removeformat | help',
      }}
    />
  </div>
  <div>
    <label for="featuredImage">Featured Image</label>
    <input type="text" id="featuredImage" bind:value={page.featuredImage} />
  </div>
  <div>
    <label for="seoTitle">SEO Title</label>
    <input type="text" id="seoTitle" bind:value={page.seoTitle} />
  </div>
  <div>
    <label for="seoDescription">SEO Description</label>
    <textarea id="seoDescription" bind:value={page.seoDescription}></textarea>
  </div>
  <button type="submit">{data.page ? 'Update' : 'Create'}</button>
</form>