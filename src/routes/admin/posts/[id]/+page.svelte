<script lang="ts">
  import type { PageData } from './$types';
  import Editor from '@tinymce/tinymce-svelte';

  export let data: PageData;

  let post = data.post || {
    title: '',
    slug: '',
    body: '',
    categoryId: null,
    featuredImage: '',
    video: '',
    tags: [],
    postType: 'ARTICLE',
    seoTitle: '',
    seoDescription: '',
    schema: {},
  };

  async function handleSubmit() {
    const method = data.post ? 'PUT' : 'POST';
    const url = data.post ? `/api/posts/${data.post.id}` : '/api/posts';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    });

    if (response.ok) {
      window.location.href = '/admin/posts';
    } else {
      const result = await response.json();
      alert(result.message);
    }
  }
</script>

<h1>{data.post ? 'Edit Post' : 'New Post'}</h1>

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="title">Title</label>
    <input type="text" id="title" bind:value={post.title} />
  </div>
  <div>
    <label for="slug">Slug</label>
    <input type="text" id="slug" bind:value={post.slug} />
  </div>
  <div>
    <label for="body">Body</label>
    <Editor
      apiKey="no-api-key"
      bind:value={post.body}
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
    <label for="category">Category</label>
    <select id="category" bind:value={post.categoryId}>
      {#each data.categories as category}
        <option value={category.id}>{category.name}</option>
      {/each}
    </select>
  </div>
  <div>
    <label for="featuredImage">Featured Image</label>
    <input type="text" id="featuredImage" bind:value={post.featuredImage} />
  </div>
  <div>
    <label for="video">Video</label>
    <input type="text" id="video" bind:value={post.video} />
  </div>
  <div>
    <label for="postType">Post Type</label>
    <select id="postType" bind:value={post.postType}>
      <option value="ARTICLE">Article</option>
      <option value="NEWS">News</option>
    </select>
  </div>
  <div>
    <label for="seoTitle">SEO Title</label>
    <input type="text" id="seoTitle" bind:value={post.seoTitle} />
  </div>
  <div>
    <label for="seoDescription">SEO Description</label>
    <textarea id="seoDescription" bind:value={post.seoDescription}></textarea>
  </div>
  <button type="submit">{data.post ? 'Update' : 'Create'}</button>
</form>