<script lang="ts">
	import { Button, Card, ConfirmDialog, Modal, Pagination, Table } from '$lib/ui';
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { formatCurrency, formatDateTime } from '$lib/utils';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let viewOrder = $state<(typeof data.orders)[0] | null>(null);
	let pendingAction = $state<{ id: string; action: 'confirm' | 'ship' | 'complete' | 'cancel' } | null>(null);

	const actionMessages: Record<string, string> = {
		confirm: t().order.confirmAction,
		ship: t().order.shipAction,
		complete: t().order.completeAction,
		cancel: t().order.cancelAction
	};

	const ORDER_STATUSES = ['', 'pending', 'confirmed', 'shipped', 'completed', 'cancelled'];

	const columns = [
		{ key: 'id', label: t().order.orderNumber, width: '200px' },
		{ key: 'buyer', label: t().order.buyer },
		{ key: 'status', label: t().order.status, width: '100px' },
		{ key: 'total', label: t().order.grandTotal, width: '120px' },
		{ key: 'ordered_at', label: t().order.orderedAt, width: '160px' }
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

	<div class="filters">
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
					{s ? t().order.statuses[s as keyof typeof t.order.statuses] : t().common.all}
				</button>
			{/each}
		</div>
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
		itemsPerPage={30}
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
					<span class="detail-value">{viewOrder.buyer?.company_name ?? '—'}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">{t().order.status}</span>
					<span class="badge badge-{viewOrder.status}">{t().order.statuses[viewOrder.status]}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">{t().order.orderedAt}</span>
					<span class="detail-value">{formatDateTime(viewOrder.ordered_at)}</span>
				</div>
				{#if viewOrder.notes}
					<div class="detail-row">
						<span class="detail-label">{t().order.notes}</span>
						<span class="detail-value">{viewOrder.notes}</span>
					</div>
				{/if}
			</div>

			<div class="items-section">
				<h3 class="items-title">{t().order.items}</h3>
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
						<tr>
							<td colspan="3" class="num total-label">{t().order.totalAmount}</td>
							<td class="num">{formatCurrency(viewOrder.total_amount)}</td>
						</tr>
						<tr>
							<td colspan="3" class="num total-label">{t().order.taxAmount}</td>
							<td class="num">{formatCurrency(viewOrder.tax_amount)}</td>
						</tr>
						<tr class="grand-total">
							<td colspan="3" class="num total-label">{t().order.grandTotal}</td>
							<td class="num">{formatCurrency(viewOrder.total_amount + viewOrder.tax_amount)}</td>
						</tr>
					</tfoot>
				</table>
			</div>

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

<ConfirmDialog
	open={!!pendingAction}
	title={t().order.confirm}
	message={pendingAction ? actionMessages[pendingAction.action] : ''}
	onconfirm={() => {
		if (!pendingAction) return;
		const f = document.createElement('form');
		f.method = 'POST';
		f.action = `?/${pendingAction.action}`;
		const i = document.createElement('input');
		i.name = 'id'; i.value = pendingAction.id;
		f.appendChild(i); document.body.appendChild(f); f.submit();
	}}
	oncancel={() => (pendingAction = null)}
/>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); }
	.page-header { display: flex; align-items: center; justify-content: space-between; }
	.page-title { font-size: 1.5rem; font-weight: 700; }
	.export-link { text-decoration: none; }

	.filters { display: flex; align-items: center; gap: var(--space-md); }

	.status-tabs {
		display: flex;
		gap: 1px;
		background-color: var(--color-bg-sunken);
		padding: 2px;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-light);
		flex-wrap: wrap;
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

		&.active {
			background-color: var(--color-bg-elevated);
			color: var(--color-text);
			box-shadow: var(--shadow-sm);
		}
	}

	.order-id { font-size: 0.75rem; color: var(--color-text-tertiary); }

	.order-detail { display: flex; flex-direction: column; gap: var(--space-xl); }

	.detail-section { display: flex; flex-direction: column; gap: var(--space-sm); }

	.detail-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		font-size: 0.875rem;
	}

	.detail-label {
		width: 120px;
		flex-shrink: 0;
		color: var(--color-text-secondary);
	}

	.items-section { display: flex; flex-direction: column; gap: var(--space-sm); }
	.items-title { font-size: 0.875rem; font-weight: 600; }

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

		.total-label { color: var(--color-text-secondary); }
	}

	.order-actions {
		display: flex;
		gap: var(--space-sm);
		justify-content: flex-end;
		padding-top: var(--space-md);
		border-top: 1px solid var(--color-border-light);
	}
</style>
