<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button, ConfirmDialog, Input, Label, Modal, Textarea } from '$lib/ui';
	import { t, formatDateTime } from '$lib/i18n';
	import { formatCurrency } from '$lib/utils';
	import { Mail, Printer } from '@lucide/svelte';
	import type { ActionData, PageData } from './$types';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const order    = $derived(data.order);
	const supplier = $derived(data.supplier);

	type OrderAction = 'confirm' | 'ship' | 'complete' | 'cancel';

	let pendingAction = $state<OrderAction | null>(null);

	const actionLabels: Record<OrderAction, string> = {
		confirm:  t().order.confirmAction,
		ship:     t().order.shipAction,
		complete: t().order.completeAction,
		cancel:   t().order.cancelAction
	};

	let confirmFormEl  = $state<HTMLFormElement | undefined>();
	let shipFormEl     = $state<HTMLFormElement | undefined>();
	let completeFormEl = $state<HTMLFormElement | undefined>();
	let cancelFormEl   = $state<HTMLFormElement | undefined>();

	const formEls: Record<OrderAction, () => HTMLFormElement | undefined> = {
		confirm:  () => confirmFormEl,
		ship:     () => shipFormEl,
		complete: () => completeFormEl,
		cancel:   () => cancelFormEl
	};

	const actionEnhance: SubmitFunction = () => async ({ update }) => {
		await update();
		pendingAction = null;
		await invalidateAll();
	};

	// Email dialog state
	let emailOpen    = $state(false);
	let emailSubject = $state('');
	let emailBody    = $state('');
	let emailSending = $state(false);

	function openEmailDialog() {
		emailSubject = `${t().order.detail} #${order.id.slice(0, 8).toUpperCase()}`;
		emailBody    = '';
		emailOpen    = true;
	}

	const emailEnhance: SubmitFunction = () => {
		emailSending = true;
		return async ({ update, result }) => {
			await update();
			emailSending = false;
			if (result.type === 'success') {
				emailOpen    = false;
				emailSubject = '';
				emailBody    = '';
			}
		};
	};
</script>

<svelte:head>
	<title>{t().order.supplierTitle} #{order.id.slice(0, 8).toUpperCase()} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<!-- ===== SCREEN HEADER ===== -->
	<div class="page-header no-print">
		<a href="/supplier/orders" class="back-link">← {t().order.supplierTitle}</a>
		<div class="header-actions">
			<Button variant="secondary" onclick={openEmailDialog}>
				<Mail size={15} /> {t().order.sendEmail}
			</Button>
			<Button variant="secondary" onclick={() => window.print()}>
				<Printer size={15} /> {t().common.printPdf}
			</Button>
		</div>
	</div>

	<!-- ===== TITLE ROW ===== -->
	<div class="title-row no-print">
		<div class="title-left">
			<h1 class="page-title">{t().order.detail}</h1>
			<code class="order-id">#{order.id.slice(0, 8).toUpperCase()}</code>
			<span class="badge badge-{order.status}">{t().order.statuses[order.status]}</span>
		</div>
		<div class="title-actions">
			{#if order.status === 'pending'}
				<Button variant="primary" onclick={() => (pendingAction = 'confirm')}>{t().order.confirm}</Button>
			{/if}
			{#if order.status === 'confirmed'}
				<Button variant="primary" onclick={() => (pendingAction = 'ship')}>{t().order.ship}</Button>
			{/if}
			{#if order.status === 'shipped'}
				<Button variant="primary" onclick={() => (pendingAction = 'complete')}>{t().order.complete}</Button>
			{/if}
			{#if order.status !== 'completed' && order.status !== 'cancelled'}
				<Button variant="danger" onclick={() => (pendingAction = 'cancel')}>{t().order.cancel}</Button>
			{/if}
		</div>
	</div>

	<!-- ===== INFO GRID ===== -->
	<div class="info-grid no-print">
		<!-- Buyer card -->
		<div class="info-card">
			<div class="card-title">{t().order.buyer}</div>
			<div class="buyer-name">{order.buyer?.company_name ?? '—'}</div>
			{#if order.buyer?.user?.name}
				<div class="card-row">{order.buyer.user.name}</div>
			{/if}
			{#if order.buyer?.user?.email}
				<div class="card-row muted">{order.buyer.user.email}</div>
			{/if}
			{#if order.buyer?.zip || order.buyer?.address}
				<div class="card-row muted">{order.buyer.zip ?? ''} {order.buyer.address ?? ''}</div>
			{/if}
			{#if order.buyer?.phone}
				<div class="card-row muted">{order.buyer.phone}</div>
			{/if}
		</div>

		<!-- Timeline card -->
		<div class="info-card">
			<div class="card-title">{t().order.status}</div>
			<div class="timeline">
				<div class="tl-row">
					<span class="tl-label">{t().order.orderedAt}</span>
					<span>{formatDateTime(order.ordered_at)}</span>
				</div>
				{#if order.confirmed_at}
					<div class="tl-row">
						<span class="tl-label">{t().order.confirmedAt}</span>
						<span>{formatDateTime(order.confirmed_at)}</span>
					</div>
				{/if}
				{#if order.shipped_at}
					<div class="tl-row">
						<span class="tl-label">{t().order.shippedAt}</span>
						<span>{formatDateTime(order.shipped_at)}</span>
					</div>
				{/if}
				{#if order.completed_at}
					<div class="tl-row">
						<span class="tl-label">{t().order.completedAt}</span>
						<span>{formatDateTime(order.completed_at)}</span>
					</div>
				{/if}
				{#if order.cancelled_at}
					<div class="tl-row cancelled">
						<span class="tl-label">{t().order.cancelledAt}</span>
						<span>{formatDateTime(order.cancelled_at)}</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- ===== ITEMS TABLE ===== -->
	<div class="items-section">
		<div class="section-title no-print">{t().order.items}</div>
		<table class="items-table">
			<thead>
				<tr>
					<th class="sku-col">{t().product.sku}</th>
					<th>{t().product.name}</th>
					<th class="num">{t().cart.unitPrice}</th>
					<th class="num tax-col">Tax</th>
					<th class="num">{t().cart.quantity}</th>
					<th class="num">{t().cart.subtotal}</th>
				</tr>
			</thead>
			<tbody>
				{#each order.items as item (item.id)}
					<tr>
						<td class="sku-cell">{item.sku}</td>
						<td>{item.name}</td>
						<td class="num">{formatCurrency(item.unit_price)}</td>
						<td class="num tax-col">{(item.tax_rate * 100).toFixed(0)}%</td>
						<td class="num">{item.quantity}</td>
						<td class="num">{formatCurrency(item.subtotal)}</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<td colspan="5" class="num">{t().order.totalAmount}</td>
					<td class="num">{formatCurrency(order.total_amount)}</td>
				</tr>
				<tr>
					<td colspan="5" class="num">{t().order.taxAmount}</td>
					<td class="num">{formatCurrency(order.tax_amount)}</td>
				</tr>
				<tr class="grand-row">
					<td colspan="5" class="num">{t().order.grandTotal}</td>
					<td class="num">{formatCurrency(order.total_amount + order.tax_amount)}</td>
				</tr>
			</tfoot>
		</table>
	</div>

	<!-- ===== NOTES ===== -->
	{#if order.notes}
		<div class="notes-section">
			<div class="notes-label">{t().order.notes}</div>
			<div class="notes-body">{order.notes}</div>
		</div>
	{/if}
</div>

<!-- ===== PRINT SHEET (hidden on screen) ===== -->
<div class="print-only order-sheet">
	<div class="inv-header">
		<div class="inv-left">
			<h1 class="inv-title">{t().order.printTitle}</h1>
			<div class="inv-id">#{order.id.slice(0, 8).toUpperCase()}</div>
			<div class="badge badge-{order.status}">{t().order.statuses[order.status]}</div>
			<div class="buyer-block">
				<div class="buyer-block-name">{order.buyer?.company_name}</div>
				{#if order.buyer?.user?.name}<div class="buyer-block-sub">{order.buyer.user.name}</div>{/if}
				{#if order.buyer?.zip}<div class="buyer-block-sub">{order.buyer.zip}</div>{/if}
				{#if order.buyer?.address}<div class="buyer-block-sub">{order.buyer.address}</div>{/if}
			</div>
		</div>
		<div class="inv-right">
			{#if supplier.name}
				<div class="supplier-block">
					<div class="supplier-name">{supplier.name}</div>
					{#if supplier.zip}<div class="supplier-sub">{supplier.zip}</div>{/if}
					{#if supplier.address}<div class="supplier-sub">{supplier.address}</div>{/if}
					{#if supplier.tel}<div class="supplier-sub">{supplier.tel}</div>{/if}
					{#if supplier.taxNo}<div class="supplier-tax">{supplier.taxNo}</div>{/if}
				</div>
			{/if}
			<div class="inv-meta">
				<div class="meta-row"><span>{t().order.orderedAt}</span><span>{formatDateTime(order.ordered_at)}</span></div>
			</div>
		</div>
	</div>

	<table class="inv-table">
		<thead>
			<tr>
				<th>{t().product.sku}</th>
				<th>{t().product.name}</th>
				<th class="num">{t().cart.unitPrice}</th>
				<th class="num">Tax</th>
				<th class="num">{t().cart.quantity}</th>
				<th class="num">{t().cart.subtotal}</th>
			</tr>
		</thead>
		<tbody>
			{#each order.items as item (item.id)}
				<tr>
					<td class="sku-cell">{item.sku}</td>
					<td>{item.name}</td>
					<td class="num">{formatCurrency(item.unit_price)}</td>
					<td class="num">{(item.tax_rate * 100).toFixed(0)}%</td>
					<td class="num">{item.quantity}</td>
					<td class="num">{formatCurrency(item.subtotal)}</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr><td colspan="5" class="num">{t().order.totalAmount}</td><td class="num">{formatCurrency(order.total_amount)}</td></tr>
			<tr><td colspan="5" class="num">{t().order.taxAmount}</td><td class="num">{formatCurrency(order.tax_amount)}</td></tr>
			<tr class="grand-row"><td colspan="5" class="num">{t().order.grandTotal}</td><td class="num">{formatCurrency(order.total_amount + order.tax_amount)}</td></tr>
		</tfoot>
	</table>

	{#if order.notes}
		<div class="notes-section">
			<div class="notes-label">{t().order.notes}</div>
			<div class="notes-body">{order.notes}</div>
		</div>
	{/if}
</div>

<!-- Hidden action forms -->
<form method="POST" action="?/confirm"  use:enhance={actionEnhance} bind:this={confirmFormEl}  style="display:none"><input name="id" value={order.id} /></form>
<form method="POST" action="?/ship"     use:enhance={actionEnhance} bind:this={shipFormEl}     style="display:none"><input name="id" value={order.id} /></form>
<form method="POST" action="?/complete" use:enhance={actionEnhance} bind:this={completeFormEl} style="display:none"><input name="id" value={order.id} /></form>
<form method="POST" action="?/cancel"   use:enhance={actionEnhance} bind:this={cancelFormEl}   style="display:none"><input name="id" value={order.id} /></form>

<ConfirmDialog
	open={!!pendingAction}
	title={pendingAction ? t().order[pendingAction] : ''}
	message={pendingAction ? actionLabels[pendingAction] : ''}
	onconfirm={() => pendingAction && formEls[pendingAction]()?.requestSubmit()}
	oncancel={() => (pendingAction = null)}
/>

<!-- Email dialog -->
<Modal open={emailOpen} title={t().order.sendEmail} onclose={() => (emailOpen = false)}>
	<form method="POST" action="?/email" use:enhance={emailEnhance} class="email-form">
		<input type="hidden" name="id" value={order.id} />

		<div class="email-field">
			<Label for="email-subject">{t().order.emailSubject}</Label>
			<Input
				id="email-subject"
				name="subject"
				bind:value={emailSubject}
				required
				disabled={emailSending}
			/>
		</div>

		<div class="email-field">
			<Label for="email-body">{t().order.emailBody}</Label>
			<Textarea
				id="email-body"
				name="body"
				bind:value={emailBody}
				rows={8}
				required
				disabled={emailSending}
			/>
		</div>

		{#if form?.emailError}
			<p class="email-error">{form.emailError}</p>
		{/if}

		<div class="email-actions">
			<Button type="button" variant="secondary" onclick={() => (emailOpen = false)} disabled={emailSending}>
				{t().common.cancel}
			</Button>
			<Button type="submit" variant="primary" disabled={emailSending}>
				{emailSending ? '…' : t().order.sendEmail}
			</Button>
		</div>
	</form>
</Modal>

<style lang="scss">
	/* ---- Screen layout ---- */
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
		max-width: 900px;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
	}

	.header-actions {
		display: flex;
		gap: var(--space-sm);
	}

	.back-link {
		font-size: 0.875rem;
		color: var(--color-primary);
		text-decoration: none;
		&:hover { text-decoration: underline; }
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		flex-wrap: wrap;
	}

	.title-left {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		flex-wrap: wrap;
	}

	.page-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
	}

	.order-id {
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
		font-family: var(--font-mono);
	}

	.title-actions {
		display: flex;
		gap: var(--space-sm);
		flex-shrink: 0;
	}

	/* ---- Info grid ---- */
	.info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-lg);

		@media (max-width: 640px) {
			grid-template-columns: 1fr;
		}
	}

	.info-card {
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.card-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-xs);
	}

	.buyer-name {
		font-size: 1rem;
		font-weight: 600;
	}

	.card-row {
		font-size: 0.875rem;
		&.muted { color: var(--color-text-secondary); }
	}

	/* ---- Timeline ---- */
	.timeline {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.tl-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		gap: var(--space-md);
		&.cancelled { color: var(--color-danger, #dc2626); }
	}

	.tl-label {
		color: var(--color-text-secondary);
		flex-shrink: 0;
	}

	/* ---- Items section ---- */
	.items-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.items-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		overflow: hidden;

		th, td {
			padding: var(--space-sm) var(--space-md);
			border-bottom: 1px solid var(--color-border-light);
			text-align: left;
			&.num { text-align: right; }
		}

		th {
			font-weight: 600;
			color: var(--color-text-secondary);
			background-color: var(--color-bg-sunken);
			font-size: 0.8125rem;
		}

		tbody tr:last-child td { border-bottom: none; }

		.sku-cell {
			font-family: var(--font-mono);
			font-size: 0.8125rem;
			color: var(--color-text-tertiary);
		}

		.tax-col { color: var(--color-text-secondary); }

		tfoot td {
			font-weight: 500;
			border-bottom: 1px solid var(--color-border-light);
		}

		.grand-row td {
			font-size: 0.9375rem;
			font-weight: 700;
			border-top: 2px solid var(--color-border);
		}
	}

	/* ---- Notes ---- */
	.notes-section {
		padding: var(--space-lg);
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
	}

	.notes-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-xs);
	}

	.notes-body { font-size: 0.875rem; white-space: pre-wrap; }

	/* ---- Email dialog ---- */
	:global(.email-form) {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	:global(.email-field) {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	:global(.email-error) {
		font-size: 0.8125rem;
		color: var(--color-danger);
	}

	:global(.email-actions) {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--color-border-light);
	}

	/* ---- Print ---- */
	.print-only { display: none; }

	@media print {
		.no-print { display: none !important; }
		.page { display: none !important; }
		.print-only { display: block !important; }

		.order-sheet {
			padding: 0;
			display: flex;
			flex-direction: column;
			gap: 24px;
		}

		.inv-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
		.inv-left { display: flex; flex-direction: column; gap: 6px; }
		.inv-title { font-size: 1.25rem; font-weight: 700; margin: 0; }
		.inv-id { font-size: 0.8125rem; color: #71717a; font-family: monospace; }
		.buyer-block { display: flex; flex-direction: column; gap: 2px; padding-top: 8px; }
		.buyer-block-name { font-size: 0.9375rem; font-weight: 600; }
		.buyer-block-sub { font-size: 0.8125rem; color: #52525b; }

		.inv-right { display: flex; flex-direction: column; gap: 12px; align-items: flex-end; text-align: right; }
		.supplier-block { display: flex; flex-direction: column; gap: 2px; }
		.supplier-name { font-size: 0.9375rem; font-weight: 600; }
		.supplier-sub { font-size: 0.8125rem; color: #52525b; }
		.supplier-tax { font-size: 0.75rem; font-family: monospace; color: #52525b; margin-top: 2px; }
		.inv-meta { display: flex; flex-direction: column; gap: 4px; }
		.meta-row { display: flex; gap: 16px; font-size: 0.875rem; }
		.meta-row span:first-child { color: #52525b; }

		.inv-table {
			width: 100%;
			border-collapse: collapse;
			font-size: 0.875rem;

			th, td {
				padding: 6px 10px;
				border-bottom: 1px solid #e4e4e7;
				text-align: left;
				&.num { text-align: right; }
			}

			th { font-weight: 600; color: #52525b; background-color: #f4f4f5; }
			.sku-cell { font-family: monospace; font-size: 0.8125rem; color: #71717a; }
			tfoot td { font-weight: 500; }
			.grand-row td { font-size: 1rem; font-weight: 700; border-top: 2px solid #d4d4d8; }
		}
	}
</style>
