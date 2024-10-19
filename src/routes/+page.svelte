<script lang="ts">
	import axios from 'axios';

	import GalleryItem from '$lib/components/GalleryItem.svelte';

	let searchQuery = '';
	let images = [];
	let selectedImages = [];
	let loading = false;
	let error = '';
	let currentPage = 1;
	let totalPages = 0;
	let itemsPerPage = 30;

	import { UNSPLASH_ACCESS_KEY } from '$lib/constant';

	let selectAllState = {};

	function selectAllImages() {
		selectAllState[currentPage] = !selectAllState[currentPage];

		let allCheckboxes = document.querySelectorAll('.gallery__checkbox');

		allCheckboxes.forEach((checkbox, index) => {
			(checkbox as HTMLInputElement).checked = selectAllState[currentPage];
			if (selectAllState[currentPage]) {
				if (!selectedImages.some((img) => img.id === images[index].id)) {
					selectedImages = [...selectedImages, images[index]];
				}
			} else {
				selectedImages = selectedImages.filter((img) => img.id !== images[index].id);
			}
		});
	}

	async function searchImages(page = 1) {
		if (!searchQuery.trim() || loading) return;

		loading = true;
		error = '';
		try {
			const response = await axios.get(`https://api.unsplash.com/search/photos`, {
				params: {
					query: searchQuery,
					page: page,
					per_page: itemsPerPage,
					client_id: UNSPLASH_ACCESS_KEY
				}
			});
			images = response.data.results;
			totalPages = Math.ceil(response.data.total / itemsPerPage);
			currentPage = page;

			// Initialize selectAllState for the new page if it doesn't exist
			if (!selectAllState.hasOwnProperty(currentPage)) {
				selectAllState[currentPage] = false;
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
			alert('Please select at least one image to download.');
			return;
		}

		loading = true;
		error = '';

		try {
			// Request permission to access the file system
			const dirHandle = await window.showDirectoryPicker();

			for (const image of selectedImages) {
				try {
					// Fetch the image
					const response = await fetch(image.urls.regular);
					const blob = await response.blob();

					// Create a new file in the selected directory
					const fileHandle = await dirHandle.getFileHandle(`${image.id}.jpg`, { create: true });
					const writable = await fileHandle.createWritable();
					await writable.write(blob);
					await writable.close();
				} catch (error) {
					console.error(`Failed to download image ${image.id}:`, error);
				}
			}

			alert('Download completed');
		} catch (err) {
			console.error('Error in downloadImages:', err);
			error = err.message || 'An error occurred while downloading images. Please try again.';
		} finally {
			loading = false;
		}
	}

	function isImageSelected(image) {
		return selectedImages.some((img) => img.id === image.id);
	}
</script>

<h1>Stock Images Grabber</h1>

<div class="search-container">
	<input
		type="text"
		bind:value={searchQuery}
		placeholder="Enter keywords to search for images"
		on:keyup={(e) => e.key === 'Enter' && searchImages()} />
	<button on:click={() => searchImages()}>Search</button>
</div>

{#if error}
	<p class="error">{error}</p>
{/if}

{#if images.length > 0}
	<div class="download-button-container">
		{#if totalPages > 0}
			<div class="pagination">
				{#each generatePageNumbers() as pageNumber}
					{#if pageNumber === '...'}
						<span class="ellipsis">...</span>
					{:else}
						<button
							class="page-number"
							class:active={pageNumber === currentPage}
							on:click={() => searchImages(pageNumber)}>
							{pageNumber}
						</button>
					{/if}
				{/each}
			</div>
		{/if}

		<div class="download-buttons">
			<button on:click={selectAllImages} class="select-all-button">
				{selectAllState[currentPage] ? 'Deselect All' : 'Select All'}
			</button>
			<button on:click={downloadImages} class="download-button" disabled={loading}>
				{loading ? 'Downloading...' : `Download Selected Images (${selectedImages.length})`}
			</button>
		</div>
	</div>
{/if}

<div class="gallery">
	{#each images as image (image.id)}
		<GalleryItem
			{image}
			isSelected={isImageSelected(image)}
			onToggleSelection={toggleImageSelection} />
	{/each}
</div>

{#if loading}
	<div class="loading">Loading images...</div>
{/if}

<style>
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
		z-index: 9999;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: rgba(255, 255, 255, 0.9);
		padding: 1rem;
		display: flex;
		flex-direction: column;
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
		background-color: #f0f0f0;
		transition: aspect-ratio 0.3s ease;
	}

	.gallery__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
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
		pointer-events: none;
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

	.loading,
	.no-more {
		text-align: center;
		padding: 1rem;
		font-style: italic;
		color: #666;
	}

	.search-container {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.search-container input {
		padding: 0.5rem;
		font-size: 1rem;
		width: 300px;
	}

	.search-container button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		background-color: var(--color-theme-1);
		color: white;
		border: none;
		cursor: pointer;
	}

	.loading {
		position: fixed;
		bottom: 20px;
		right: 20px;
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
		background-color: var(--color-theme-1);
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
</style>
