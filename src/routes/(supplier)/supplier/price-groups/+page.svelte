<script lang="ts">
	import { Button, ConfirmDialog, Input, Label, Modal, Table, Textarea } from '$lib/ui';
	import { enhance } from '$app/forms';
	import { t } from '$lib/i18n';
	import { formatCurrency } from '$lib/utils';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreate = $state(false);
	let editItem = $state<(typeof data.groups)[0] | null>(null);
	let deleteId = $state<string | null>(null);
	let pricingGroup = $state<(typeof data.groups)[0] | null>(null);
	let groupPrices: Record<string, string> = $state({});

	let deleteFormEl = $state<HTMLFormElement | undefined>();

	const createEnhance: SubmitFunction = () => async ({ result, update }) => {
		await update();
		if (result.type === 'success') showCreate = false;
	};

	const updateEnhance: SubmitFunction = () => async ({ result, update }) => {
		await update();
		if (result.type === 'success') editItem = null;
	};

	const pricesEnhance: SubmitFunction = () => async ({ result, update }) => {
		await update();
		if (result.type === 'success') pricingGroup = null;
	};

	const deleteEnhance: SubmitFunction = () => async ({ update }) => {
		await update();
		deleteId = null;
	};

	function openPricing(group: (typeof data.groups)[0]) {
		pricingGroup = group;
		const existing = data.priceMap[group.id] ?? {};
		groupPrices = Object.fromEntries(
			Object.entries(existing).map(([k, v]) => [k, String(v)])
		);
	}

	const columns = [
		{ key: 'name',        label: t().priceGroup.name },
		{ key: 'description', label: t().priceGroup.description },
		{ key: 'buyer_count', label: t().priceGroup.buyerCount, width: '80px' }
	];
</script>

<svelte:head>
	<title>{t().priceGroup.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1 class="page-title">{t().priceGroup.title}</h1>
		<Button onclick={() => (showCreate = true)}>{t().priceGroup.new}</Button>
	</div>

	<Table {columns} rows={data.groups}>
		{#snippet actions(row)}
			<div class="row-actions">
				<Button size="sm" variant="ghost"      onclick={() => openPricing(row)}>{t().priceGroup.setPrices}</Button>
				<Button size="sm" variant="secondary"  onclick={() => (editItem = row)}>{t().common.edit}</Button>
				<Button size="sm" variant="danger"     onclick={() => (deleteId = row.id)}>{t().common.delete}</Button>
			</div>
		{/snippet}
	</Table>
</div>

<!-- Create modal -->
<Modal bind:open={showCreate} title={t().priceGroup.new}>
	<form method="POST" action="?/create" use:enhance={createEnhance} class="form">
		{#if form?.error}<div class="form-error">{form.error}</div>{/if}
		<div class="field">
			<Label for="name" required>{t().priceGroup.name}</Label>
			<Input id="name" name="name" required />
		</div>
		<div class="field">
			<Label for="desc">{t().priceGroup.description}</Label>
			<Textarea id="desc" name="description" rows={2} />
		</div>
		<div class="form-actions">
			<Button type="button" variant="secondary" onclick={() => (showCreate = false)}>{t().common.cancel}</Button>
			<Button type="submit">{t().common.save}</Button>
		</div>
	</form>
</Modal>

<!-- Edit modal -->
{#if editItem}
	<Modal open={!!editItem} title={t().priceGroup.edit} onclose={() => (editItem = null)}>
		<form method="POST" action="?/update" use:enhance={updateEnhance} class="form">
			<input type="hidden" name="id" value={editItem.id} />
			{#if form?.error}<div class="form-error">{form.error}</div>{/if}
			<div class="field">
				<Label for="edit-name" required>{t().priceGroup.name}</Label>
				<Input id="edit-name" name="name" value={editItem.name} required />
			</div>
			<div class="field">
				<Label for="edit-desc">{t().priceGroup.description}</Label>
				<Textarea id="edit-desc" name="description" rows={2} value={editItem.description ?? ''} />
			</div>
			<div class="form-actions">
				<Button type="button" variant="secondary" onclick={() => (editItem = null)}>{t().common.cancel}</Button>
				<Button type="submit">{t().common.save}</Button>
			</div>
		</form>
	</Modal>
{/if}

<!-- Pricing modal -->
{#if pricingGroup}
	<Modal open={!!pricingGroup} title="{t().priceGroup.setPrices}: {pricingGroup.name}" size="lg" onclose={() => (pricingGroup = null)}>
		<form method="POST" action="?/setPrices" use:enhance={pricesEnhance} class="form">
			<input type="hidden" name="group_id" value={pricingGroup.id} />
			{#if form?.error}<div class="form-error">{form.error}</div>{/if}
			<p class="pricing-help">{t().priceGroup.basePrice} — {t().priceGroup.noOverride}</p>
			<div class="pricing-list">
				{#each data.products as product (product.id)}
					<div class="pricing-row">
						<div class="pricing-product">
							<span class="pricing-name">{product.name}</span>
							<span class="pricing-sku">{product.sku}</span>
						</div>
						<div class="pricing-base">{formatCurrency(product.base_price)}</div>
						<Input
							type="number"
							name="price_{product.id}"
							value={groupPrices[product.id] ?? ''}
							placeholder={t().priceGroup.noOverride}
							min="0"
						/>
					</div>
				{/each}
			</div>
			<div class="form-actions">
				<Button type="button" variant="secondary" onclick={() => (pricingGroup = null)}>{t().common.cancel}</Button>
				<Button type="submit">{t().common.save}</Button>
			</div>
		</form>
	</Modal>
{/if}

<!-- Hidden delete form -->
<form method="POST" action="?/delete" use:enhance={deleteEnhance} bind:this={deleteFormEl} style="display:none">
	<input name="id" value={deleteId ?? ''} />
</form>

<ConfirmDialog
	open={!!deleteId}
	title={t().priceGroup.delete}
	message={t().priceGroup.deleteConfirm}
	onconfirm={() => deleteFormEl?.requestSubmit()}
	oncancel={() => (deleteId = null)}
/>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); }
	.page-header { display: flex; align-items: center; justify-content: space-between; }
	.page-title { font-size: 1.5rem; font-weight: 700; }
	.form { display: flex; flex-direction: column; gap: var(--space-lg); }
	.field { display: flex; flex-direction: column; gap: var(--space-sm); }
	.form-error {
		padding: var(--space-sm) var(--space-md);
		background-color: var(--color-danger-light);
		color: var(--color-danger);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
	}
	.form-actions { display: flex; justify-content: flex-end; gap: var(--space-sm); }
	.row-actions { display: flex; gap: var(--space-xs); justify-content: flex-end; }

	.pricing-help { font-size: 0.8125rem; color: var(--color-text-secondary); }

	.pricing-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: 400px;
		overflow-y: auto;
		padding-right: var(--space-xs);
	}

	.pricing-row {
		display: grid;
		grid-template-columns: 1fr auto 160px;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--color-border-light);
		&:last-child { border-bottom: none; }
	}

	.pricing-product { display: flex; flex-direction: column; gap: 2px; }
	.pricing-name { font-size: 0.875rem; font-weight: 500; }
	.pricing-sku { font-size: 0.75rem; color: var(--color-text-tertiary); }
	.pricing-base { font-size: 0.8125rem; color: var(--color-text-secondary); white-space: nowrap; }
</style>
