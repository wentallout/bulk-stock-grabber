<script>
	import PhGithubLogo from '~icons/ph/github-logo';
	import PhXLogo from '~icons/ph/x-logo';
</script>

<nav class="header pad">
	<div class="header__logo">StockGrabber</div>

	<div class="header__social">
		<a href="https://github.com/wentallout/bulk-stock-grabber">
			<PhGithubLogo width="24" height="24" />
		</a>

		<a href="https://x.com/wentallout">
			<PhXLogo width="24" height="24" />
		</a>
	</div>
</nav>

<style>
	.header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		padding: var(--space-xs) 0;
	}

	.header__logo {
		color: white;
	}

	.header__social {
		display: flex;
		flex-direction: row;
		gap: var(--space-xs);

		a {
			color: white;
			aspect-ratio: 1 / 1;
			width: 24px;
			height: 24px;
		}
	}
</style>
