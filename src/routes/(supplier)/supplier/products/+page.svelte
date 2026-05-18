<script lang="ts">
	import { Button, ConfirmDialog, Input, Label, Modal, Pagination, SearchBar, Table, Textarea } from '$lib/ui';
	import { enhance } from '$app/forms';
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { formatCurrency } from '$lib/utils';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreate = $state(false);
	let editItem = $state<(typeof data.products)[0] | null>(null);
	let deleteId = $state<string | null>(null);
	let searchValue = $state(data.search || '');

	let deleteFormEl = $state<HTMLFormElement | undefined>();

	const createEnhance: SubmitFunction = () => async ({ result, update }) => {
		await update();
		if (result.type === 'success') showCreate = false;
	};

	const updateEnhance: SubmitFunction = () => async ({ result, update }) => {
		await update();
		if (result.type === 'success') editItem = null;
	};

	const deleteEnhance: SubmitFunction = () => async ({ update }) => {
		await update();
		deleteId = null;
	};

	function handleSearch() {
		const p = new URLSearchParams();
		if (searchValue) p.set('search', searchValue);
		goto(`?${p}`);
	}

	const columns = [
		{ key: 'sku',        label: t().product.sku,        width: '120px' },
		{ key: 'name',       label: t().product.name },
		{ key: 'category',   label: t().product.category,   width: '120px' },
		{ key: 'base_price', label: t().product.basePrice,  width: '120px' },
		{ key: 'stock_qty',  label: t().product.stockQty,   width: '80px' },
		{ key: 'sort_order', label: t().product.sortOrder,  width: '60px' },
		{ key: 'is_active',  label: t().product.isActive,   width: '80px' }
	];
</script>

<svelte:head>
	<title>{t().product.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1 class="page-title">{t().product.title}</h1>
		<Button onclick={() => (showCreate = true)}>{t().product.new}</Button>
	</div>

	<div class="filters">
		<SearchBar bind:value={searchValue} onsearch={handleSearch} />
		<select
			class="select-filter"
			value={data.categoryFilter}
			onchange={(e) => {
				const p = new URLSearchParams(window.location.search);
				if (e.currentTarget.value) p.set('category', e.currentTarget.value);
				else p.delete('category');
				goto(`?${p}`);
			}}
		>
			<option value="">{t().common.all}</option>
			{#each data.categories as cat (cat.id)}
				<option value={cat.id}>{cat.name}</option>
			{/each}
		</select>
	</div>

	<Table {columns} rows={data.products}>
		{#snippet cell(col, row)}
			{#if col.key === 'category'}
				{row.category?.name ?? '—'}
			{:else if col.key === 'base_price'}
				{formatCurrency(row.base_price)}
			{:else if col.key === 'is_active'}
				<span class="badge badge-{row.is_active ? 'active' : 'inactive'}">
					{row.is_active ? t().common.active : t().common.inactive}
				</span>
			{:else}
				{(row as Record<string, unknown>)[col.key] ?? ''}
			{/if}
		{/snippet}
		{#snippet actions(row)}
			<div class="row-actions">
				<Button size="sm" variant="secondary" onclick={() => (editItem = row)}>{t().common.edit}</Button>
				<Button size="sm" variant="danger"    onclick={() => (deleteId = row.id)}>{t().common.delete}</Button>
			</div>
		{/snippet}
	</Table>

	<Pagination
		currentPage={data.page}
		totalPages={data.totalPages}
		totalItems={data.total}
		itemsPerPage={30}
		onpagechange={(p) => {
			const params = new URLSearchParams(window.location.search);
			params.set('page', String(p));
			goto(`?${params}`);
		}}
	/>
</div>

<!-- Create modal -->
<Modal bind:open={showCreate} title={t().product.new} size="lg">
	<form method="POST" action="?/create" use:enhance={createEnhance} class="form">
		{#if form?.error}<div class="form-error">{form.error}</div>{/if}
		<div class="form-grid">
			<div class="field">
				<Label for="sku" required>{t().product.sku}</Label>
				<Input id="sku" name="sku" placeholder={t().product.skuPlaceholder} required />
			</div>
			<div class="field">
				<Label for="category_id">{t().product.category}</Label>
				<select class="select" name="category_id" id="category_id">
					<option value="">—</option>
					{#each data.categories as cat (cat.id)}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>
			</div>
		</div>
		<div class="field">
			<Label for="name" required>{t().product.name}</Label>
			<Input id="name" name="name" placeholder={t().product.namePlaceholder} required />
		</div>
		<div class="field">
			<Label for="description">{t().product.description}</Label>
			<Textarea id="description" name="description" rows={3} />
		</div>
		<div class="form-grid">
			<div class="field">
				<Label for="base_price" required>{t().product.basePrice}</Label>
				<Input id="base_price" name="base_price" type="number" value="0" min="0" required />
			</div>
			<div class="field">
				<Label for="tax_rate">{t().product.taxRate}</Label>
				<Input id="tax_rate" name="tax_rate" type="number" value="0.10" step="0.01" min="0" max="1" />
			</div>
			<div class="field">
				<Label for="unit">{t().product.unit}</Label>
				<Input id="unit" name="unit" value="ea" />
			</div>
			<div class="field">
				<Label for="min_order_qty">{t().product.minOrderQty}</Label>
				<Input id="min_order_qty" name="min_order_qty" type="number" value="1" min="1" />
			</div>
			<div class="field">
				<Label for="stock_qty">{t().product.stockQty}</Label>
				<Input id="stock_qty" name="stock_qty" type="number" value="0" min="0" />
			</div>
			<div class="field">
				<Label for="sort_order">{t().product.sortOrder}</Label>
				<Input id="sort_order" name="sort_order" type="number" value="0" min="0" />
			</div>
			<div class="field field-checkbox">
				<label class="checkbox-label">
					<input type="checkbox" name="is_active" value="true" checked />
					{t().product.isActive}
				</label>
			</div>
		</div>
		<div class="form-actions">
			<Button type="button" variant="secondary" onclick={() => (showCreate = false)}>{t().common.cancel}</Button>
			<Button type="submit">{t().common.save}</Button>
		</div>
	</form>
</Modal>

<!-- Edit modal -->
{#if editItem}
	<Modal open={!!editItem} title={t().product.edit} size="lg" onclose={() => (editItem = null)}>
		<form method="POST" action="?/update" use:enhance={updateEnhance} class="form">
			<input type="hidden" name="id" value={editItem.id} />
			{#if form?.error}<div class="form-error">{form.error}</div>{/if}
			<div class="form-grid">
				<div class="field">
					<Label>{t().product.sku}</Label>
					<Input value={editItem.sku} disabled />
				</div>
				<div class="field">
					<Label for="edit-cat">{t().product.category}</Label>
					<select class="select" name="category_id" id="edit-cat">
						<option value="">—</option>
						{#each data.categories as cat (cat.id)}
							<option value={cat.id} selected={cat.id === editItem.category_id}>{cat.name}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="field">
				<Label for="edit-name" required>{t().product.name}</Label>
				<Input id="edit-name" name="name" value={editItem.name} required />
			</div>
			<div class="field">
				<Label for="edit-desc">{t().product.description}</Label>
				<Textarea id="edit-desc" name="description" rows={3} value={editItem.description ?? ''} />
			</div>
			<div class="form-grid">
				<div class="field">
					<Label for="edit-price" required>{t().product.basePrice}</Label>
					<Input id="edit-price" name="base_price" type="number" value={editItem.base_price} min="0" required />
				</div>
				<div class="field">
					<Label for="edit-tax">{t().product.taxRate}</Label>
					<Input id="edit-tax" name="tax_rate" type="number" value={editItem.tax_rate} step="0.01" />
				</div>
				<div class="field">
					<Label for="edit-unit">{t().product.unit}</Label>
					<Input id="edit-unit" name="unit" value={editItem.unit} />
				</div>
				<div class="field">
					<Label for="edit-moq">{t().product.minOrderQty}</Label>
					<Input id="edit-moq" name="min_order_qty" type="number" value={editItem.min_order_qty} min="1" />
				</div>
				<div class="field">
					<Label for="edit-stock">{t().product.stockQty}</Label>
					<Input id="edit-stock" name="stock_qty" type="number" value={editItem.stock_qty} min="0" />
				</div>
				<div class="field">
					<Label for="edit-sort">{t().product.sortOrder}</Label>
					<Input id="edit-sort" name="sort_order" type="number" value={editItem.sort_order} min="0" />
				</div>
				<div class="field field-checkbox">
					<label class="checkbox-label">
						<input type="checkbox" name="is_active" value="true" checked={editItem.is_active} />
						{t().product.isActive}
					</label>
				</div>
			</div>
			<!-- Image upload (separate from main form) -->
			<div class="field">
				<Label>{t().product.image}</Label>
				{#if editItem.image_key}
					<div class="image-preview">
						<img src="/api/storage/{editItem.image_key}" alt={editItem.name} />
						<Button size="sm" variant="danger" onclick={async () => {
							await fetch(`/api/products/${editItem!.id}/image`, { method: 'DELETE' });
							editItem = { ...editItem!, image_key: null };
						}}>{t().common.delete}</Button>
					</div>
				{/if}
				<input
					type="file"
					accept="image/jpeg,image/png,image/webp,image/gif"
					class="file-input"
					onchange={async (e) => {
						const file = (e.currentTarget as HTMLInputElement).files?.[0];
						if (!file) return;
						const fd = new FormData();
						fd.append('image', file);
						const res = await fetch(`/api/products/${editItem!.id}/image`, { method: 'POST', body: fd });
						if (res.ok) {
							const { key } = await res.json() as { key: string };
							editItem = { ...editItem!, image_key: key };
						}
					}}
				/>
			</div>

			<div class="form-actions">
				<Button type="button" variant="secondary" onclick={() => (editItem = null)}>{t().common.cancel}</Button>
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
	title={t().product.delete}
	message={t().product.deleteConfirm}
	onconfirm={() => deleteFormEl?.requestSubmit()}
	oncancel={() => (deleteId = null)}
/>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); }
	.page-header { display: flex; align-items: center; justify-content: space-between; }
	.page-title { font-size: 1.5rem; font-weight: 700; }

	.filters { display: flex; align-items: center; gap: var(--space-md); flex-wrap: wrap; }

	.select-filter, .select {
		height: 36px;
		padding: 0 var(--space-md);
		background-color: var(--color-input-bg);
		color: var(--color-text);
		border: 1px solid var(--color-input-border);
		border-radius: var(--radius-md);
		font-family: inherit;
		font-size: 0.8125rem;
	}

	.form { display: flex; flex-direction: column; gap: var(--space-lg); }
	.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--space-md); }
	.field { display: flex; flex-direction: column; gap: var(--space-sm); }
	.field-checkbox { justify-content: flex-end; }
	.checkbox-label { display: flex; align-items: center; gap: var(--space-sm); font-size: 0.8125rem; cursor: pointer; }

	.form-error {
		padding: var(--space-sm) var(--space-md);
		background-color: var(--color-danger-light);
		color: var(--color-danger);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
	}
	.form-actions { display: flex; justify-content: flex-end; gap: var(--space-sm); }
	.row-actions { display: flex; gap: var(--space-xs); justify-content: flex-end; }

	.image-preview {
		display: flex;
		align-items: center;
		gap: var(--space-md);

		img {
			width: 64px;
			height: 64px;
			object-fit: cover;
			border-radius: var(--radius-md);
			border: 1px solid var(--color-border-light);
		}
	}

	.file-input {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}
</style>
