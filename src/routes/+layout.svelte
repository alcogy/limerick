<script lang="ts">
	import { browser } from '$app/environment';
	import favicon from '$lib/assets/favicon.svg';
	import { getTheme } from '$lib/theme.svelte';
	import { setLocale, type Locale } from '$lib/i18n';
	import '../app.scss';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	$effect(() => {
		setLocale(data.locale as Locale);
		if (browser) {
			document.documentElement.setAttribute('data-theme', getTheme());
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-root">
	{@render children()}
</div>

<style lang="scss">
	.app-root {
		min-height: 100vh;
		background-color: var(--color-bg);
		color: var(--color-text);
	}
</style>
