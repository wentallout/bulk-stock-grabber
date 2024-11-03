<script lang="ts">
	let { progress = $bindable(0) } = $props();
</script>

<div class="progress-bar">
	<div class="progress" style="width: {progress}%;" />
</div>

<style>
	.progress-bar {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 20px;
		background-color: #e0e0e0;
		border-radius: 10px;
		overflow: hidden;
	}

	.progress {
		width: 0;
		height: 100%;
		background-color: var(--primary-500);
		transition: width 0.3s ease;
	}
</style>
