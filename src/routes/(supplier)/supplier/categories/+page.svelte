<script lang="ts">
	import { Button, ConfirmDialog, Input, Label, Modal, Table } from '$lib/ui';
	import { enhance } from '$app/forms';
	import { t } from '$lib/i18n';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreate = $state(false);
	let editItem = $state<(typeof data.categories)[0] | null>(null);
	let deleteId = $state<string | null>(null);

	let deleteFormEl = $state<HTMLFormElement | undefined>();

	const createEnhance: SubmitFunction =
		() =>
		async ({ result, update }) => {
			await update();
			if (result.type === 'success') showCreate = false;
		};

	const updateEnhance: SubmitFunction =
		() =>
		async ({ result, update }) => {
			await update();
			if (result.type === 'success') editItem = null;
		};

	const deleteEnhance: SubmitFunction =
		() =>
		async ({ update }) => {
			await update();
			deleteId = null;
		};

	const columns = [
		{ key: 'name', label: t().category.name },
		{ key: 'sort_order', label: t().category.sortOrder, width: '100px' },
		{ key: 'product_count', label: t().category.productCount, width: '100px' }
	];
</script>

<svelte:head>
	<title>{t().category.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1 class="page-title">{t().category.title}</h1>
		<Button onclick={() => (showCreate = true)}>{t().category.new}</Button>
	</div>

	<Table {columns} rows={data.categories}>
		{#snippet actions(row)}
			<div class="row-actions">
				<Button size="sm" variant="secondary" onclick={() => (editItem = row)}
					>{t().common.edit}</Button
				>
				<Button size="sm" variant="danger" onclick={() => (deleteId = row.id)}
					>{t().common.delete}</Button
				>
			</div>
		{/snippet}
	</Table>
</div>

<!-- Create modal -->
<Modal bind:open={showCreate} title={t().category.new}>
	<form method="POST" action="?/create" use:enhance={createEnhance} class="form">
		{#if form?.error}<div class="form-error">{form.error}</div>{/if}
		<div class="field">
			<Label for="name" required>{t().category.name}</Label>
			<Input id="name" name="name" required />
		</div>
		<div class="field">
			<Label for="sort_order">{t().category.sortOrder}</Label>
			<Input id="sort_order" name="sort_order" type="number" value="0" />
		</div>
		<div class="form-actions">
			<Button type="button" variant="secondary" onclick={() => (showCreate = false)}
				>{t().common.cancel}</Button
			>
			<Button type="submit">{t().common.save}</Button>
		</div>
	</form>
</Modal>

<!-- Edit modal -->
{#if editItem}
	<Modal open={!!editItem} title={t().category.edit} onclose={() => (editItem = null)}>
		<form method="POST" action="?/update" use:enhance={updateEnhance} class="form">
			<input type="hidden" name="id" value={editItem.id} />
			{#if form?.error}<div class="form-error">{form.error}</div>{/if}
			<div class="field">
				<Label for="edit-name" required>{t().category.name}</Label>
				<Input id="edit-name" name="name" value={editItem.name} required />
			</div>
			<div class="field">
				<Label for="edit-sort">{t().category.sortOrder}</Label>
				<Input id="edit-sort" name="sort_order" type="number" value={editItem.sort_order} />
			</div>
			<div class="form-actions">
				<Button type="button" variant="secondary" onclick={() => (editItem = null)}
					>{t().common.cancel}</Button
				>
				<Button type="submit">{t().common.save}</Button>
			</div>
		</form>
	</Modal>
{/if}

<!-- Hidden delete form -->
<form
	method="POST"
	action="?/delete"
	use:enhance={deleteEnhance}
	bind:this={deleteFormEl}
	style="display:none"
>
	<input name="id" value={deleteId ?? ''} />
</form>

<ConfirmDialog
	open={!!deleteId}
	title={t().category.delete}
	message={t().category.deleteConfirm}
	onconfirm={() => deleteFormEl?.requestSubmit()}
	oncancel={() => (deleteId = null)}
/>

<style lang="scss">
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.form-error {
		padding: var(--space-sm) var(--space-md);
		background-color: var(--color-danger-light);
		color: var(--color-danger);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
	}
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
	}
	.row-actions {
		display: flex;
		gap: var(--space-xs);
		justify-content: flex-end;
	}
</style>
