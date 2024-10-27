<!-- ToastContainer.svelte -->
<script>
	import { fade, fly } from 'svelte/transition';

	import { toastStore } from '$lib/stores/toastStore.svelte';

	let { options = {} } = $props();
	let toasts = $state([]);

	$effect(() => {
		const unsubscribe = toastStore.subscribe((value) => {
			toasts = value;
		});

		return unsubscribe;
	});

	function removeToast(id) {
		toastStore.remove(id);
	}
</script>

<div class="toast-container">
	{#each toasts as toast (toast.id)}
		<div
			class="toast-item"
			class:pausable={toast.pausable}
			onmouseenter={() => toast.pause()}
			onmouseleave={() => toast.resume()}
			in:fly={{ x: 256, ...toast.intro }}
			out:fade>
			<div class="toast-content">
				{#if typeof toast.msg === 'string'}
					<div class="toast-message">{toast.msg}</div>
				{:else if toast.component}
					<svelte:component
						this={toast.component.src}
						{...toast.component.props}
						toastId={toast.id} />
				{/if}
				{#if toast.dismissable !== false}
					<button class="toast-close" onclick={() => removeToast(toast.id)}>✕</button>
				{/if}
			</div>
			{#if toast.duration !== Infinity}
				<div class="toast-progress" style:width="{toast.progress}%" />
			{/if}
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: var(--toastContainerTop, 1.5rem);
		right: var(--toastContainerRight, 2rem);
		bottom: var(--toastContainerBottom, auto);
		left: var(--toastContainerLeft, auto);
		z-index: var(--toastContainerZIndex, 9999);
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.toast-item {
		width: var(--toastWidth, 16rem);
		min-height: var(--toastMinHeight, 3.5rem);
		margin: var(--toastMargin, 0 0 0.5rem 0);
		background: var(--toastBackground, rgba(66, 66, 66, 0.9));
		color: var(--toastColor, #fff);
		box-shadow: var(
			--toastBoxShadow,
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06)
		);
		border: var(--toastBorder, none);
		border-radius: var(--toastBorderRadius, 0.125rem);
		position: relative;
		overflow: hidden;
	}

	.toast-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--toastPadding, 0.75rem 0.5rem);
	}

	.toast-close {
		background: none;
		border: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.toast-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		height: var(--toastBarHeight, 6px);
		background: var(--toastBarBackground, rgba(33, 150, 243, 0.75));
	}
</style>
