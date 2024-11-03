<script lang="ts">
	import axios from 'axios';
	import JSZip from 'jszip';

	import GalleryItem from '$lib/components/GalleryItem.svelte';

	import { onMount } from 'svelte';
	import { UNSPLASH_ACCESS_KEY } from '$lib/constant';

	import PhMagnifyingGlass from '~icons/ph/magnifying-glass';

	import PhDownload from '~icons/ph/download';

	import PhCheckSquare from '~icons/ph/check-square';

	import PhX from '~icons/ph/x';

	let searchQuery = $state('');
	let images = $state([]);
	let selectedImages = $state([]);
	let loading = $state(false);
	let error = $state('');
	let currentPage = $state(1);
	let totalPages = $state(0);
	let itemsPerPage = 30;
	import saveAs from 'file-saver';
	import { toast } from '$lib/stores/toastStore.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';

	// Replace the existing selectAllState with a simple boolean
	let selectAll = $state(false);

	let downloadLoading = $state(false);
	let downloadProgress = $state(0);

	onMount(async () => {
		await fetchEditorialImages();
	});

	async function fetchEditorialImages() {
		loading = true;
		error = '';
		try {
			const response = await fetch(
				`https://api.unsplash.com/photos?page=${currentPage}&per_page=${itemsPerPage}`,
				{
					headers: {
						Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
					}
				}
			);
			if (!response.ok) throw new Error('Failed to fetch images');
			const data = await response.json();
			images = data;
		} catch (err) {
			console.error('Error fetching editorial images:', err);
			error = err.message || 'An error occurred while fetching images';
		} finally {
			loading = false;
		}
	}

	async function searchImages(page = 1) {
		if (!searchQuery.trim() || loading) return;

		loading = true;
		error = '';

		console.log('test items per page', itemsPerPage);
		try {
			const response = await axios.get(`https://api.unsplash.com/search/photos`, {
				params: {
					query: searchQuery,
					page: page,
					per_page: itemsPerPage, // This should be 60 as defined earlier
					client_id: UNSPLASH_ACCESS_KEY
				}
			});
			images = response.data.results;
			totalPages = Math.ceil(response.data.total / itemsPerPage);
			currentPage = page;

			// Initialize selectAllState for the new page if it doesn't exist
			if (!selectAll) {
				selectAll = false;
			}
		} catch (err) {
			console.error('Error fetching images:', err);
			error = 'An error occurred while fetching images. Please try again later.';
		}
		loading = false;
	}

	function toggleImageSelection(image) {
		selectedImages = selectedImages.some((img) => img.id === image.id)
			? selectedImages.filter((img) => img.id !== image.id)
			: [...selectedImages, image];
	}

	function generatePageNumbers() {
		const pageNumbers = [];
		const maxVisiblePages = 5;

		if (totalPages <= maxVisiblePages) {
			for (let i = 1; i <= totalPages; i++) {
				pageNumbers.push(i);
			}
		} else {
			if (currentPage <= 3) {
				for (let i = 1; i <= 4; i++) {
					pageNumbers.push(i);
				}
				pageNumbers.push('...');
				pageNumbers.push(totalPages);
			} else if (currentPage >= totalPages - 2) {
				pageNumbers.push(1);
				pageNumbers.push('...');
				for (let i = totalPages - 3; i <= totalPages; i++) {
					pageNumbers.push(i);
				}
			} else {
				pageNumbers.push(1);
				pageNumbers.push('...');
				for (let i = currentPage - 1; i <= currentPage + 1; i++) {
					pageNumbers.push(i);
				}
				pageNumbers.push('...');
				pageNumbers.push(totalPages);
			}
		}
		return pageNumbers;
	}

	async function downloadImages() {
		if (selectedImages.length === 0) {
			toast.push('Please select at least one image to download.');
			return;
		}

		downloadLoading = true;
		downloadProgress = 0;

		try {
			const zip = new JSZip();
			const totalImages = selectedImages.length;

			// Use Promise.all to handle all downloads concurrently while tracking progress
			await Promise.all(
				selectedImages.map(async (image, index) => {
					try {
						const response = await fetch(image.urls.full);
						const blob = await response.blob();
						zip.file(`${image.id}.jpg`, blob);

						// Update progress after each image is processed
						downloadProgress = Math.round(((index + 1) / totalImages) * 100);
					} catch (err) {
						console.error(`Error downloading image ${image.id}:`, err);
						throw err;
					}
				})
			);

			const content = await zip.generateAsync({
				type: 'blob',
				onUpdate: (metadata) => {
					// Update progress during zip generation
					if (metadata.percent) {
						downloadProgress = Math.round(metadata.percent);
					}
				}
			});
			saveAs(content, 'unsplash_images.zip');
			toast.push('Download completed!');
		} catch (err) {
			console.error('Error in downloadImages:', err);
			toast.push('An error occurred while downloading images. Please try again.');
		} finally {
			downloadLoading = false;
			downloadProgress = 0;
		}
	}

	function selectAllImages() {
		selectAll = !selectAll;
		if (selectAll) {
			selectedImages = [...images];
		} else {
			selectedImages = [];
		}
	}
</script>

{#if downloadLoading}
	<ProgressBar progress={downloadProgress} />
{/if}

<div class="search-container pad">
	<div class="search__title">
		<p>Free images. Download in bulk.</p>
	</div>
	<div class="input-container">
		<input
			class="search__input"
			type="text"
			bind:value={searchQuery}
			placeholder="Search photos and illustrations"
			onkeyup={(e) => e.key === 'Enter' && searchImages()} />
		<button onclick={() => searchImages()}>
			<PhMagnifyingGlass width="24" height="24" />
		</button>
	</div>
</div>

{#if error}
	<p class="error">{error}</p>
{/if}

{#if images.length > 0}
	<div class="pad fixed-menu">
		{#if totalPages > 0}
			<div class="pagination">
				{#each generatePageNumbers() as pageNumber}
					{#if pageNumber === '...'}
						<span class="ellipsis">...</span>
					{:else}
						<button
							class="page-number"
							class:active={pageNumber === currentPage}
							onclick={() => searchImages(pageNumber)}>
							{pageNumber}
						</button>
					{/if}
				{/each}
			</div>
		{/if}
		{#if selectedImages.length > 0}
			<div class="download-buttons">
				<button onclick={selectAllImages} class="btn select-all-button">
					{#if selectAll}
						<PhCheckSquare width="24" height="24" />
					{:else}
						<PhX width="24" height="24" />
					{/if}
					{selectAll ? 'Deselect All' : 'Select All Images'}
				</button>

				<button
					onclick={downloadImages}
					disabled={downloadLoading}
					class="btn download-button btn--primary">
					<PhDownload width="24" height="24" />
					{downloadLoading
						? 'Downloading...'
						: `Download Selected Images (${selectedImages.length})`}
				</button>
			</div>
		{/if}
	</div>
{/if}

<div class="gallery pad">
	{#if loading}
		<div class="loading">Loading images...</div>
	{/if}
	{#each images as image (image.id)}
		<GalleryItem
			{image}
			isSelected={selectAll || selectedImages.some((img) => img.id === image.id)}
			onToggleSelection={toggleImageSelection} />
	{/each}
</div>

<style>
	.input-container {
		display: flex;
		flex-direction: row;
	}

	.search__title {
		display: flex;
		flex-direction: row;
		font-weight: 600;
		font-size: var(--step-3);
		margin-bottom: var(--space-xs);
	}

	.download-buttons {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;

		& > * {
			flex-grow: 1;
		}
	}

	.search-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		margin-bottom: var(--space-s);
		width: 100%;
		height: 30dvh;
		background: url('/images/sj-1.jpg') no-repeat bottom center;
		background-size: cover;
		border-radius: 1rem;
		padding: var(--space-s) var(--space-m);

		& input {
			padding: 1rem;
		}
	}

	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.error {
		color: red;
		text-align: center;
		margin-bottom: 1rem;
	}

	.fixed-menu {
		position: fixed;
		z-index: 9999;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		background-color: rgba(0, 0, 0, 0.8);
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--space-s);
		color: white;
		margin: 0;
		width: 100%;
	}

	.fixed-menu:has(.download-buttons) {
		padding: var(--space-xs) var(--space-s);
	}

	.select-all-button {
		background-color: transparent;
		border: 1px solid white;
		color: white;
	}

	.gallery {
		column-count: 5;
		column-gap: 1rem;
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

	.loading {
		position: fixed;
		top: 0;
		left: 0;
		background-color: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 10px 20px;
		border-radius: 20px;
		z-index: 1000;
	}

	.pagination {
		display: flex;
		justify-content: center;
		margin-top: 1rem;
		gap: 0.5rem;
	}

	.page-number {
		padding: 0.5rem 1rem;
		border: 1px solid #ccc;
		cursor: pointer;
		color: black;
		background-color: white;
	}

	.page-number.active {
		background-color: black;
		color: white;
	}

	.ellipsis {
		padding: 0.5rem;
	}

	.loading {
		text-align: center;
		padding: 1rem;
		font-style: italic;
	}

	.download-button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}

	.error {
		color: red;
		text-align: center;
		margin-top: 1rem;
	}

	.search__input {
		width: 100%;
	}
</style>
