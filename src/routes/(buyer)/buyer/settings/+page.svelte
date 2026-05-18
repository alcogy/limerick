<script lang="ts">
	import { Card, LanguageSwitcher } from '$lib/ui';
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>{t().nav.settings} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<h1 class="page-title">{t().nav.settings}</h1>

	<Card title={t().settings.language}>
		<div class="setting-row">
			<div class="setting-info">
				<p class="setting-label">{t().settings.language}</p>
				<p class="setting-desc">{t().settings.languageDesc}</p>
			</div>
			<LanguageSwitcher />
		</div>
	</Card>
</div>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); max-width: 600px; }
	.page-title { font-size: 1.5rem; font-weight: 700; }

	.setting-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-xl);
		flex-wrap: wrap;
	}

	.setting-info { display: flex; flex-direction: column; gap: var(--space-xs); }
	.setting-label { font-size: 0.9375rem; font-weight: 600; }
	.setting-desc { font-size: 0.8125rem; color: var(--color-text-secondary); }
</style>
