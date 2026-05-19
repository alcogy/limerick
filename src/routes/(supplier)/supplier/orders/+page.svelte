<script lang="ts">
	import { Button, ConfirmDialog, Modal, Pagination, Table } from '$lib/ui';
	import { enhance } from '$app/forms';
	import { t, formatDateTime } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { formatCurrency } from '$lib/utils';
	import { PAGE_SIZE_LIST } from '$lib/constants';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type OrderStatus = 'confirm' | 'ship' | 'complete' | 'cancel';

	let viewOrder = $state<(typeof data.orders)[0] | null>(null);
	let pendingAction = $state<{ id: string; action: OrderStatus } | null>(null);

	// One hidden form per action
	let confirmFormEl  = $state<HTMLFormElement | undefined>();
	let shipFormEl     = $state<HTMLFormElement | undefined>();
	let completeFormEl = $state<HTMLFormElement | undefined>();
	let cancelFormEl   = $state<HTMLFormElement | undefined>();

	const actionEnhance: SubmitFunction = () => async ({ update }) => {
		await update();
		pendingAction = null;
		viewOrder = null;
	};

	const formEls: Record<OrderStatus, () => HTMLFormElement | undefined> = {
		confirm:  () => confirmFormEl,
		ship:     () => shipFormEl,
		complete: () => completeFormEl,
		cancel:   () => cancelFormEl
	};

	const actionMessages: Record<OrderStatus, string> = {
		confirm:  t().order.confirmAction,
		ship:     t().order.shipAction,
		complete: t().order.completeAction,
		cancel:   t().order.cancelAction
	};

	const ORDER_STATUSES = ['', 'pending', 'confirmed', 'shipped', 'completed', 'cancelled'] as const;

	const columns = [
		{ key: 'id',         label: t().order.orderNumber, width: '160px' },
		{ key: 'buyer',      label: t().order.buyer },
		{ key: 'status',     label: t().order.status,      width: '100px' },
		{ key: 'total',      label: t().order.grandTotal,  width: '120px' },
		{ key: 'ordered_at', label: t().order.orderedAt,   width: '160px' }
	];
</script>

<svelte:head>
	<title>{t().order.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1 class="page-title">{t().order.title}</h1>
		<a href="/supplier/orders/export" class="export-link">
			<Button variant="secondary">{t().order.exportCsv}</Button>
		</a>
	</div>

	<div class="status-tabs">
		{#each ORDER_STATUSES as s (s)}
			<button
				class="status-tab"
				class:active={data.statusFilter === s}
				onclick={() => {
					const p = new URLSearchParams();
					if (s) p.set('status', s);
					goto(`?${p}`);
				}}
			>
				{s ? t().order.statuses[s] : t().common.all}
			</button>
		{/each}
	</div>

	<Table {columns} rows={data.orders} onrowclick={(row) => (viewOrder = row)}>
		{#snippet cell(col, row)}
			{#if col.key === 'id'}
				<code class="order-id">{row.id.slice(0, 8)}…</code>
			{:else if col.key === 'buyer'}
				{row.buyer?.company_name ?? '—'}
			{:else if col.key === 'status'}
				<span class="badge badge-{row.status}">{t().order.statuses[row.status]}</span>
			{:else if col.key === 'total'}
				{formatCurrency(row.total_amount + row.tax_amount)}
			{:else if col.key === 'ordered_at'}
				{formatDateTime(row.ordered_at)}
			{:else}
				{(row as Record<string, unknown>)[col.key] ?? ''}
			{/if}
		{/snippet}
	</Table>

	<Pagination
		currentPage={data.page}
		totalPages={data.totalPages}
		totalItems={data.total}
		itemsPerPage={PAGE_SIZE_LIST}
		onpagechange={(p) => {
			const params = new URLSearchParams(window.location.search);
			params.set('page', String(p));
			goto(`?${params}`);
		}}
	/>
</div>

<!-- Order detail modal -->
{#if viewOrder}
	<Modal open={!!viewOrder} title={t().order.detail} size="lg" onclose={() => (viewOrder = null)}>
		<div class="order-detail">
			<div class="detail-section">
				<div class="detail-row">
					<span class="detail-label">{t().order.buyer}</span>
					<span>{viewOrder.buyer?.company_name ?? '—'}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">{t().order.status}</span>
					<span class="badge badge-{viewOrder.status}">{t().order.statuses[viewOrder.status]}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">{t().order.orderedAt}</span>
					<span>{formatDateTime(viewOrder.ordered_at)}</span>
				</div>
				{#if viewOrder.notes}
					<div class="detail-row">
						<span class="detail-label">{t().order.notes}</span>
						<span>{viewOrder.notes}</span>
					</div>
				{/if}
			</div>

			<table class="items-table">
				<thead>
					<tr>
						<th>{t().product.name}</th>
						<th class="num">{t().cart.unitPrice}</th>
						<th class="num">{t().cart.quantity}</th>
						<th class="num">{t().cart.subtotal}</th>
					</tr>
				</thead>
				<tbody>
					{#each viewOrder.items as item (item.id)}
						<tr>
							<td>{item.name}</td>
							<td class="num">{formatCurrency(item.unit_price)}</td>
							<td class="num">{item.quantity}</td>
							<td class="num">{formatCurrency(item.subtotal)}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr><td colspan="3" class="num">{t().order.totalAmount}</td><td class="num">{formatCurrency(viewOrder.total_amount)}</td></tr>
					<tr><td colspan="3" class="num">{t().order.taxAmount}</td><td class="num">{formatCurrency(viewOrder.tax_amount)}</td></tr>
					<tr class="grand-total">
						<td colspan="3" class="num">{t().order.grandTotal}</td>
						<td class="num">{formatCurrency(viewOrder.total_amount + viewOrder.tax_amount)}</td>
					</tr>
				</tfoot>
			</table>

			<div class="order-actions">
				{#if viewOrder.status === 'pending'}
					<Button variant="primary" onclick={() => (pendingAction = { id: viewOrder!.id, action: 'confirm' })}>
						{t().order.confirm}
					</Button>
				{/if}
				{#if viewOrder.status === 'confirmed'}
					<Button variant="primary" onclick={() => (pendingAction = { id: viewOrder!.id, action: 'ship' })}>
						{t().order.ship}
					</Button>
				{/if}
				{#if viewOrder.status === 'shipped'}
					<Button variant="primary" onclick={() => (pendingAction = { id: viewOrder!.id, action: 'complete' })}>
						{t().order.complete}
					</Button>
				{/if}
				{#if viewOrder.status !== 'completed' && viewOrder.status !== 'cancelled'}
					<Button variant="danger" onclick={() => (pendingAction = { id: viewOrder!.id, action: 'cancel' })}>
						{t().order.cancel}
					</Button>
				{/if}
			</div>
		</div>
	</Modal>
{/if}

<!-- Hidden action forms -->
<form method="POST" action="?/confirm"  use:enhance={actionEnhance} bind:this={confirmFormEl}  style="display:none"><input name="id" value={pendingAction?.id ?? ''} /></form>
<form method="POST" action="?/ship"     use:enhance={actionEnhance} bind:this={shipFormEl}     style="display:none"><input name="id" value={pendingAction?.id ?? ''} /></form>
<form method="POST" action="?/complete" use:enhance={actionEnhance} bind:this={completeFormEl} style="display:none"><input name="id" value={pendingAction?.id ?? ''} /></form>
<form method="POST" action="?/cancel"   use:enhance={actionEnhance} bind:this={cancelFormEl}   style="display:none"><input name="id" value={pendingAction?.id ?? ''} /></form>

<ConfirmDialog
	open={!!pendingAction}
	title={t().order.confirm}
	message={pendingAction ? actionMessages[pendingAction.action] : ''}
	onconfirm={() => pendingAction && formEls[pendingAction.action]()?.requestSubmit()}
	oncancel={() => (pendingAction = null)}
/>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); }
	.page-header { display: flex; align-items: center; justify-content: space-between; }
	.page-title { font-size: 1.5rem; font-weight: 700; }
	.export-link { text-decoration: none; }

	.status-tabs {
		display: flex;
		gap: 1px;
		background-color: var(--color-bg-sunken);
		padding: 2px;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-light);
		flex-wrap: wrap;
		width: fit-content;
	}

	.status-tab {
		padding: 4px var(--space-md);
		border: none;
		background: none;
		border-radius: calc(var(--radius-md) - 2px);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		cursor: pointer;
		font-family: inherit;
		transition: all var(--transition-fast);
		&.active { background-color: var(--color-bg-elevated); color: var(--color-text); box-shadow: var(--shadow-sm); }
	}

	.order-id { font-size: 0.75rem; color: var(--color-text-tertiary); }

	.order-detail { display: flex; flex-direction: column; gap: var(--space-xl); }
	.detail-section { display: flex; flex-direction: column; gap: var(--space-sm); }
	.detail-row { display: flex; align-items: center; gap: var(--space-md); font-size: 0.875rem; }
	.detail-label { width: 120px; flex-shrink: 0; color: var(--color-text-secondary); }

	.items-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;

		th, td {
			padding: var(--space-sm) var(--space-md);
			border-bottom: 1px solid var(--color-border-light);
			text-align: left;
			&.num { text-align: right; }
		}

		th { font-weight: 600; color: var(--color-text-secondary); background-color: var(--color-bg-sunken); }
		tfoot td { font-weight: 500; }

		.grand-total td {
			font-weight: 700;
			font-size: 0.9375rem;
			border-top: 2px solid var(--color-border);
		}
	}

	.order-actions {
		display: flex;
		gap: var(--space-sm);
		justify-content: flex-end;
		padding-top: var(--space-md);
		border-top: 1px solid var(--color-border-light);
	}
</style>
