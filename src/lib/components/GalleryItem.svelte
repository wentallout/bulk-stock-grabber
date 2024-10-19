<script lang="ts">
	import { onMount } from 'svelte';
	import Footer from './Footer.svelte';

	export let image;
	export let isSelected: boolean;
	export let onToggleSelection;

	function handleToggle() {
		onToggleSelection(image);
		isSelected = !isSelected;
		checkboxElement.checked = !checkboxElement.checked;
	}

	$: isSelected;

	let checkboxElement: HTMLInputElement;

	// Add this function to handle the title click
	function handleTitleClick(event: Event) {
		event.stopPropagation();
	}
</script>

<div class="gallery__item" class:selected={isSelected} on:click|stopPropagation={handleToggle}>
	<img class="gallery__image" src={image.urls.small} alt={image.alt_description} loading="lazy" />
	<div class="gallery__caption">
		<a
			href={image.links.html}
			target="_blank"
			rel="noopener noreferrer"
			class="gallery__title-link"
			on:click|stopPropagation={handleTitleClick}>
			<p class="gallery__title">{image.description || 'Untitled'}</p>
		</a>
		<p class="gallery__uploader">
			by <a
				class="gallery__uploader-link"
				href={`https://unsplash.com/@${image.user.username}`}
				target="_blank"
				rel="noopener noreferrer"
				on:click|stopPropagation>{image.user.name}</a>

			on
			<a
				href="https://unsplash.com/?utm_source=bulk-stock-grabber
&utm_medium=referral">
				Unsplash
			</a>
		</p>
	</div>
	<div class="gallery__overlay">
		<input
			bind:this={checkboxElement}
			bind:checked={isSelected}
			class="gallery__checkbox"
			type="checkbox" />
	</div>
</div>

<style>
	/* ... previous styles ... */

	.gallery__item {
		margin: 0 0 1rem 0;
		display: inline-block;
		width: 100%;
		break-inside: avoid;
		position: relative;
		border-radius: 4px;
		overflow: hidden;
		cursor: pointer;
	}

	.gallery__item.selected {
		outline: 2px solid blue;
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
		z-index: 10;
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
	}

	.gallery__checkbox {
		width: 20px;
		height: 20px;
		cursor: pointer;
	}

	.gallery__title-link {
		text-decoration: none;
		color: inherit;
	}

	.gallery__title-link:hover .gallery__title {
		text-decoration: underline;
	}
</style>
