<script>
	import Header from '../lib/components/Header.svelte';
	import '../styles/global.css';
	import Footer from '$lib/components/Footer.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<ToastContainer />
<Header />

<main>
	{@render children?.()}
</main>

<Footer />

<style>
	main {
		min-height: 100dvh;
	}
</style>
