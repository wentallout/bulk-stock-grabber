<script>
	import Header from '../lib/components/Header.svelte';
	import '../app.css';
	import Footer from '$lib/components/Footer.svelte';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<Header />

<main>
	{@render children?.()}
</main>

<Footer />

<style>
	main {
		min-height: 100dvh;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
