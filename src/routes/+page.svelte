<script>
	import { onMount } from 'svelte';
	import axios from 'axios';
	import JSZip from 'jszip';

	let searchQuery = '';
	let images = [];
	let selectedImages = [];
	let loading = false;
	let error = '';
	let apiKeyStatus = 'unchecked';

	const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

	async function checkApiKey() {
		if (!UNSPLASH_ACCESS_KEY) {
			apiKeyStatus = 'missing';
			error = 'Unsplash API key is not set. Please set the VITE_UNSPLASH_ACCESS_KEY environment variable.';
			return false;
		}

		try {
			const response = await axios.get('https://api.unsplash.com/photos/random', {
				params: { client_id: UNSPLASH_ACCESS_KEY }
			});
			if (response.status === 200) {
				apiKeyStatus = 'valid';
				return true;
			}
		} catch (err) {
			console.error('Error checking API key:', err);
			apiKeyStatus = 'invalid';
			error = 'Invalid Unsplash API key. Please check your VITE_UNSPLASH_ACCESS_KEY environment variable.';
			return false;
		}
	}

	async function searchImages() {
		if (!searchQuery.trim()) return;
		if (apiKeyStatus === 'unchecked') {
			const isValid = await checkApiKey();
			if (!isValid) return;
		}

		loading = true;
		error = '';
		try {
			const response = await axios.get(`https://api.unsplash.com/search/photos`, {
				params: {
					query: searchQuery,
					per_page: 30,
					client_id: UNSPLASH_ACCESS_KEY
				}
			});
			images = response.data.results;
		} catch (err) {
			console.error('Error fetching images:', err);
			error = 'An error occurred while fetching images. Please try again later.';
			images = [];
		}
		loading = false;
	}

	function toggleImageSelection(image) {
		const index = selectedImages.findIndex(img => img.id === image.id);
		if (index === -1) {
			selectedImages = [...selectedImages, image];
		} else {
			selectedImages = selectedImages.filter(img => img.id !== image.id);
		}
	}

	async function downloadImages() {
		if (selectedImages.length === 0) return;

		const zip = new JSZip();
		const imagePromises = selectedImages.map(async (image, index) => {
			try {
				const response = await axios.get(image.urls.full, { responseType: 'arraybuffer' });
				zip.file(`image-${index + 1}.jpg`, response.data);
			} catch (err) {
				console.error(`Error downloading image ${index + 1}:`, err);
				throw new Error(`Failed to download image ${index + 1}`);
			}
		});

		try {
			await Promise.all(imagePromises);
			const content = await zip.generateAsync({ type: 'blob' });
			const url = URL.createObjectURL(content);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'selected-images.zip';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (err) {
			console.error('Error downloading images:', err);
			error = 'An error occurred while downloading images. Please try again.';
		}
	}

	onMount(async () => {
		await checkApiKey();
	});
</script>

<svelte:head>
	<title>Stock Image Search</title>
	<meta name="description" content="Search and download stock images" />
</svelte:head>

<main>
	<h1>Stock Image Search</h1>
	{#if apiKeyStatus === 'valid'}
		<div class="search-container">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Enter keywords to search for images"
				on:keyup={(e) => e.key === 'Enter' && searchImages()}
			/>
			<button on:click={searchImages}>Search</button>
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		{#if loading}
			<p>Loading...</p>
		{:else if images.length > 0}
			<div class="masonry-grid">
				{#each images as image (image.id)}
					<div class="masonry-item" style="--aspect-ratio: {image.height / image.width};">
						<img src={image.urls.small} alt={image.alt_description} loading="lazy" />
						<div class="image-overlay">
							<input
								type="checkbox"
								checked={selectedImages.some(img => img.id === image.id)}
								on:change={() => toggleImageSelection(image)}
							/>
						</div>
					</div>
				{/each}
			</div>
		{:else if searchQuery && !error}
			<p>No images found. Try a different search term.</p>
		{/if}
	{:else}
		<p class="error">{error}</p>
	{/if}
</main>

{#if selectedImages.length > 0}
	<div class="download-button-container">
		<button on:click={downloadImages} class="download-button">
			Download Selected Images ({selectedImages.length})
		</button>
	</div>
{/if}

<style>
	main {
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
		padding-bottom: 60px;
	}

	h1 {
		text-align: center;
		color: var(--color-theme-1);
	}

	.search-container {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}

	input {
		width: 300px;
		padding: 0.5rem;
		font-size: 1rem;
	}

	button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		background-color: var(--color-theme-1);
		color: white;
		border: none;
		cursor: pointer;
	}

	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.masonry-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		grid-gap: 1rem;
		grid-auto-flow: dense;
	}

	.masonry-item {
		position: relative;
		overflow: hidden;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s ease;
	}

	.masonry-item::before {
		content: '';
		display: block;
		padding-bottom: calc(100% * var(--aspect-ratio));
	}

	.masonry-item img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.masonry-item:hover {
		transform: scale(1.02);
	}

	.image-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		padding: 0.5rem;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.masonry-item:hover .image-overlay {
		opacity: 1;
	}

	.image-overlay input[type="checkbox"] {
		width: 20px;
		height: 20px;
	}

	.error {
		color: red;
		text-align: center;
		margin-bottom: 1rem;
	}

	.download-button-container {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: rgba(255, 255, 255, 0.9);
		padding: 1rem;
		display: flex;
		justify-content: center;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
	}

	.download-button {
		background-color: var(--color-theme-1);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.download-button:hover {
		background-color: var(--color-theme-2);
	}
</style>