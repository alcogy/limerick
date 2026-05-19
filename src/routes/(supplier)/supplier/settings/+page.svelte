<script lang="ts">
	import { Button, Input } from '$lib/ui';
	import { enhance } from '$app/forms';
	import { Building2, Globe, Hash } from '@lucide/svelte';
	import { t, getLocale, setLocale, LOCALES, type Locale } from '$lib/i18n';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let companyName    = $state(data.companyName);
	let companyAddress = $state(data.companyAddress);
	let companyTel     = $state(data.companyTel);

	let skuPrefix = $state(data.skuPrefix);
	let skuDigits = $state(data.skuDigits);
	let skuSeq    = $state(data.skuSeq);

	const skuPreview = $derived(
		`${skuPrefix || 'PROD'}-${String(parseInt(skuSeq || '0') + 1).padStart(Math.max(1, parseInt(skuDigits || '4')), '0')}`
	);

	const saveEnhance: SubmitFunction = () => async ({ update }) => { await update(); };
</script>

<svelte:head>
	<title>{t().settings.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<h1 class="page-title">{t().settings.title}</h1>

	<section class="settings-section">
		<h2><Building2 size={16} /> {t().settings.companyInfo}</h2>
		<div class="settings-card">
			<form method="POST" action="?/saveCompany" use:enhance={saveEnhance} class="sku-form">
				{#if form?.success && form?.action === 'saveCompany'}
					<div class="save-ok">Saved.</div>
				{/if}
				<p class="sku-desc">{t().settings.companyInfoDesc}</p>

				<div class="setting-row border-b">
					<div class="setting-info">
						<div class="setting-label">{t().settings.companyName}</div>
					</div>
					<div class="setting-control">
						<Input name="company_name" bind:value={companyName} placeholder="Acme Corp." style="width:240px" />
					</div>
				</div>

				<div class="setting-row border-b">
					<div class="setting-info">
						<div class="setting-label">{t().settings.companyAddress}</div>
					</div>
					<div class="setting-control">
						<Input name="company_address" bind:value={companyAddress} placeholder="123 Main St, City" style="width:300px" />
					</div>
				</div>

				<div class="setting-row border-b">
					<div class="setting-info">
						<div class="setting-label">{t().settings.companyTel}</div>
					</div>
					<div class="setting-control">
						<Input name="company_tel" bind:value={companyTel} placeholder="+1-555-0100" style="width:200px" />
					</div>
				</div>

				<div class="save-row">
					<Button type="submit">{t().settings.save}</Button>
				</div>
			</form>
		</div>
	</section>

	<section class="settings-section">
		<h2><Globe size={16} /> {t().settings.language}</h2>
		<div class="settings-card">
			<div class="setting-row">
				<div class="setting-info">
					<div class="setting-label">{t().settings.language}</div>
					<div class="setting-desc">{t().settings.languageDesc}</div>
				</div>
				<div class="setting-control">
					<div class="locale-buttons">
						{#each LOCALES as locale (locale.value)}
							<button type="button" class="locale-btn" class:active={getLocale() === locale.value}
								onclick={() => setLocale(locale.value as Locale)}>
								{locale.nativeLabel}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="settings-section">
		<h2><Hash size={16} /> {t().settings.skuRule}</h2>
		<div class="settings-card">
			<form method="POST" action="?/saveSku" use:enhance={saveEnhance} class="sku-form">
				{#if form?.success && form?.action === 'saveSku'}
					<div class="save-ok">Saved.</div>
				{/if}
				<p class="sku-desc">{t().settings.skuRuleDesc}</p>

				<div class="setting-row border-b">
					<div class="setting-info">
						<div class="setting-label">{t().settings.skuPrefix}</div>
					</div>
					<div class="setting-control">
						<Input name="sku_prefix" bind:value={skuPrefix}
							placeholder={t().settings.skuPrefixPlaceholder} style="width:120px" />
					</div>
				</div>

				<div class="setting-row border-b">
					<div class="setting-info">
						<div class="setting-label">{t().settings.skuDigits}</div>
						<div class="setting-desc">{t().settings.skuDigitsNote}</div>
					</div>
					<div class="setting-control">
						<Input name="sku_digits" type="number" bind:value={skuDigits} min="1" max="8" style="width:80px" />
					</div>
				</div>

				<div class="setting-row border-b">
					<div class="setting-info">
						<div class="setting-label">{t().settings.skuSeq}</div>
						<div class="setting-desc">{t().settings.skuSeqNote}</div>
					</div>
					<div class="setting-control">
						<Input name="sku_seq" type="number" bind:value={skuSeq} min="0" style="width:100px" />
					</div>
				</div>

				<div class="setting-row border-b">
					<div class="setting-info">
						<div class="setting-label">{t().settings.skuPreview}</div>
					</div>
					<div class="setting-control">
						<code class="sku-preview">{skuPreview}</code>
					</div>
				</div>

				<div class="save-row">
					<Button type="submit">{t().settings.save}</Button>
				</div>
			</form>
		</div>
	</section>
</div>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-2xl); max-width: 720px; }
	.page-title { font-size: 1.5rem; font-weight: 700; }

	.settings-section {
		display: flex; flex-direction: column; gap: var(--space-md);
		h2 { display: flex; align-items: center; gap: var(--space-sm); font-size: 1rem; font-weight: 600; }
	}

	.settings-card {
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.setting-row {
		display: flex; align-items: center; justify-content: space-between;
		gap: var(--space-md); padding: var(--space-lg);
		&.border-b { border-bottom: 1px solid var(--color-border-light); }
	}

	.setting-info { flex: 1; }
	.setting-label { font-weight: 500; font-size: 0.875rem; }
	.setting-desc { font-size: 0.8125rem; color: var(--color-text-secondary); margin-top: 2px; }
	.setting-control { display: flex; align-items: center; gap: var(--space-sm); }

	.locale-buttons {
		display: flex; gap: 2px;
		background-color: var(--color-bg-sunken);
		padding: 3px; border-radius: var(--radius-md);
	}

	.locale-btn {
		display: flex; align-items: center; padding: var(--space-xs) var(--space-xl);
		border: none; background: none; border-radius: calc(var(--radius-md) - 2px);
		font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary);
		cursor: pointer; transition: all var(--transition-fast); font-family: inherit;
		&.active { background-color: var(--color-bg-elevated); color: var(--color-text); box-shadow: var(--shadow-sm); }
		&:hover:not(.active) { color: var(--color-text); }
	}

	.sku-form { display: flex; flex-direction: column; }
	.sku-desc { padding: var(--space-lg); font-size: 0.8125rem; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border-light); }

	.sku-preview {
		font-family: var(--font-mono); font-size: 0.875rem;
		padding: var(--space-xs) var(--space-md);
		background-color: var(--color-bg-sunken); border-radius: var(--radius-sm);
		color: var(--color-primary); font-weight: 600;
	}

	.save-row {
		display: flex; justify-content: flex-end;
		padding: var(--space-lg); border-top: 1px solid var(--color-border-light);
	}

	.save-ok {
		padding: var(--space-sm) var(--space-lg);
		background-color: var(--color-success-light); color: var(--color-success);
		font-size: 0.8125rem; border-bottom: 1px solid var(--color-border-light);
	}
</style>
