<script lang="ts">
	import { createBubbler } from 'svelte/legacy';

	const bubble = createBubbler();

	import { fade } from 'svelte/transition';

	interface Props {
		id: any;
		image: any;
		isSelected: boolean;
		onToggleSelection: any;
	}

	let { id, image, isSelected = $bindable(false), onToggleSelection }: Props = $props();
	let checkboxElement: HTMLInputElement | undefined = $state();

	function handleToggle() {
		onToggleSelection(image);
	}

	$effect(() => {
		if (checkboxElement) {
			checkboxElement.checked = isSelected;
		}
	});
</script>

<div
	{id}
	transition:fade={{ duration: 300 }}
	class="gallery__item"
	class:selected={isSelected}
	onclick={handleToggle}>
	<img
		class="gallery__image"
		src={image.urls.small}
		alt={image.alt_description || 'Unsplash Image'}
		loading="lazy" />
	<div class="gallery__caption">
		<a
			href={image.links.html}
			target="_blank"
			rel="noopener noreferrer"
			class="gallery__title-link">
			<p class="gallery__title">{image.description || 'Untitled'}</p>
		</a>
		<p class="gallery__uploader">
			by <a
				class="gallery__uploader-link"
				href={image.user.links.html}
				target="_blank"
				rel="noopener noreferrer"
				onclick={bubble('click')}>{image.user.name}</a>
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
		outline: 2px solid var(--primary-500);

		& .gallery__image {
			scale: 1.1;
			filter: brightness(0.5) sepia(1.5);
			transition: all 0.3s ease;
		}
	}

	.gallery__image {
		width: 100%;
		height: auto;
		display: block;
	}

	.gallery__caption {
		padding: var(--space-xs);
		background-color: rgba(0, 0, 0, 0.7);
		color: white;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: 10;
		font-size: var(--space-xs);
	}

	.gallery__title {
		margin: 0;
		font-weight: bold;

		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.gallery__uploader {
		margin: 0;
		display: 0;
	}

	.gallery__uploader-link {
		text-decoration: none;
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
