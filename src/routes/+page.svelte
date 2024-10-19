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
			error =
				'Unsplash API key is not set. Please set the VITE_UNSPLASH_ACCESS_KEY environment variable.';
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
			error =
				'Invalid Unsplash API key. Please check your VITE_UNSPLASH_ACCESS_KEY environment variable.';
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
			console.log(images);
		} catch (err) {
			console.error('Error fetching images:', err);
			error = 'An error occurred while fetching images. Please try again later.';
			images = [];
		}
		loading = false;
	}

	function toggleImageSelection(image) {
		const index = selectedImages.findIndex((img) => img.id === image.id);
		if (index === -1) {
			selectedImages = [...selectedImages, image];
		} else {
			selectedImages = selectedImages.filter((img) => img.id !== image.id);
		}
	}

	function selectAllImages() {
		if (selectedImages.length === images.length) {
			// If all images are already selected, deselect all
			selectedImages = [];
		} else {
			// Otherwise, select all images
			selectedImages = [...images];
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

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			for (let entry of entries) {
				const item = entry.target;
				const rowSpan = Math.ceil(item.querySelector('img').getBoundingClientRect().height / 10);
				item.style.gridRowEnd = `span ${rowSpan}`;
			}
		});

		document.querySelectorAll('.item').forEach((item) => {
			resizeObserver.observe(item);
		});

		return () => {
			resizeObserver.disconnect();
		};
	});

	onMount(async () => {
		await checkApiKey();
	});
</script>

<svelte:head>
	<title>Stock Image Search by Khoa</title>
	<meta name="description" content="Search and download stock images" />
</svelte:head>
<h1>Stock Image Search by Khoa @wentallout</h1>

<main>
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
			<div class="gallery">
				{#each images as image (image.id)}
					<figure class="gallery__item">
						<img class="gallery__image" src={image.urls.small} alt={image.alt_description} loading="lazy" />
						<figcaption class="gallery__caption">
							<p class="gallery__title">{image.description || 'Untitled'}</p>
							<p class="gallery__uploader">
								by <a class="gallery__uploader-link" href={`https://unsplash.com/@${image.user.username}`} target="_blank" rel="noopener noreferrer">{image.user.name}</a>
							</p>
						</figcaption>
						<div class="gallery__overlay">
							<input
								class="gallery__checkbox"
								type="checkbox"
								checked={selectedImages.some((img) => img.id === image.id)}
								on:change={() => toggleImageSelection(image)}
								/>
						</div>
					</figure>
				{/each}
			</div>
		{:else if searchQuery && !error}
			<p>No images found. Try a different search term.</p>
		{/if}
	{:else}
		<p class="error">{error}</p>
	{/if}
</main>

{#if images.length > 0}
	<div class="download-button-container">
		<button on:click={selectAllImages} class="select-all-button"> Select All Images </button>
		<button on:click={downloadImages} class="download-button">
			Download Selected Images ({selectedImages.length})
		</button>
	</div>
{/if}

<style>
	main {
		padding: 1rem;
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

	.masonry {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		grid-auto-rows: minmax(150px, auto);
		gap: 1rem;
	}

	.item {
		flex: 1 0 100%;
		margin-bottom: 1rem;

		position: relative;
		border-radius: 4px;
		overflow: hidden;

		transition: transform 0.3s ease;
	}

	.item img {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		display: block;
		width: 100%;
		height: auto;
		object-fit: cover;
	}

	.item:hover {
		transform: scale(1.05);
	}

	/* Responsive breakpoints */
	@media screen and (min-width: 400px) {
		.item {
			flex-basis: calc(50% - 0.5rem);
		}
	}

	@media screen and (min-width: 600px) {
		.item {
			flex-basis: calc(33.33% - 0.67rem);
		}
	}

	@media screen and (min-width: 800px) {
		.item {
			flex-basis: calc(25% - 0.75rem);
		}
	}

	@media screen and (min-width: 1000px) {
		.item {
			flex-basis: calc(20% - 0.8rem);
		}
	}

	.image-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;

		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		padding: 0.5rem;

		transition: opacity 0.3s ease;
	}

	.image-checkbox {
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
		gap: 1rem;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
	}

	.download-button,
	.select-all-button {
		background-color: var(--color-theme-1);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.download-button:hover,
	.select-all-button:hover {
		background-color: var(--color-theme-2);
	}

	figcaption {
		padding: 0.5rem;
		background-color: rgba(255, 255, 255, 0.8);
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		transition: opacity 0.3s ease;
	}

	.image-title {
		margin: 0;
		font-weight: bold;
		font-size: 0.9rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.image-uploader {
		margin: 0;
		font-size: 0.8rem;
	}

	.image-uploader a {
		color: var(--color-theme-1);
		text-decoration: none;
	}

	.image-uploader a:hover {
		text-decoration: underline;
	}

	figure:hover figcaption {
		opacity: 1;
	}

	.gallery {
		column-count: 5;
		column-gap: 1rem;
	}

	.gallery__item {
		margin: 0 0 1rem 0;
		display: inline-block;
		width: 100%;
		break-inside: avoid;
		position: relative;
		border-radius: 4px;
		overflow: hidden;
	}

	.gallery__image {
		width: 100%;
		height: auto;
		display: block;
	}

	.gallery__caption {
		padding: 0.5rem;
		background-color: rgba(255, 255, 255, 0.8);
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: 2;
	}

	.gallery__title {
		margin: 0;
		font-weight: bold;
		font-size: 0.9rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.gallery__uploader {
		margin: 0;
		font-size: 0.8rem;
	}

	.gallery__uploader-link {
		color: var(--color-theme-1);
		text-decoration: none;
		position: relative;
		z-index: 3;
	}

	.gallery__uploader-link:hover {
		text-decoration: underline;
	}

	.gallery__item:hover .gallery__caption {
		opacity: 1;
	}

	.gallery__overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		padding: 0.5rem;
		z-index: 1;
	}

	.gallery__checkbox {
		width: 20px;
		height: 20px;
		opacity: 0.7;
		transition: opacity 0.3s ease;
	}

	.gallery__checkbox:hover {
		opacity: 1;
	}

	@media screen and (max-width: 1200px) {
		.gallery {
			column-count: 4;
		}
	}

	@media screen and (max-width: 900px) {
		.gallery {
			column-count: 3;
		}
	}

	@media screen and (max-width: 600px) {
		.gallery {
			column-count: 2;
		}
	}
</style>
