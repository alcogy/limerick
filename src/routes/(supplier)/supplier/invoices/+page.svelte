<script lang="ts">
	import { Button, ConfirmDialog, Input, Label, Modal, Pagination, Table } from '$lib/ui';
	import { enhance } from '$app/forms';
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { calcInvoicePeriod, formatCurrency, formatDate } from '$lib/utils';
	import { PAGE_SIZE_LIST } from '$lib/constants';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showGenerate = $state(false);
	let viewInvoice = $state<(typeof data.invoices)[0] | null>(null);
	let markPaidId = $state<string | null>(null);

	let markPaidFormEl = $state<HTMLFormElement | undefined>();

	let genPeriodFrom = $state(data.today);
	let genPeriodTo   = $state(data.today);
	let genDueDate    = $state(data.today);

	function onBuyerChange(e: Event) {
		const buyerId = (e.target as HTMLSelectElement).value;
		const buyer = data.buyers.find((b) => b.id === buyerId);
		if (!buyer) return;
		const { period_from, period_to, due_date } = calcInvoicePeriod(buyer.closing_day);
		genPeriodFrom = period_from;
		genPeriodTo   = period_to;
		genDueDate    = due_date;
	}

	const generateEnhance: SubmitFunction = () => async ({ result, update }) => {
		await update();
		if (result.type === 'success') showGenerate = false;
	};

	const markPaidEnhance: SubmitFunction = () => async ({ update }) => {
		await update();
		markPaidId = null;
		viewInvoice = null;
	};

	const INVOICE_STATUSES = ['', 'issued', 'paid', 'overdue'] as const;
</script>

<svelte:head>
	<title>{t().invoice.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1 class="page-title">{t().invoice.title}</h1>
		<Button onclick={() => (showGenerate = true)}>{t().invoice.generate}</Button>
	</div>

	<div class="status-tabs">
		{#each INVOICE_STATUSES as s (s)}
			<button
				class="status-tab"
				class:active={data.statusFilter === s}
				onclick={() => {
					const p = new URLSearchParams();
					if (s) p.set('status', s);
					goto(`?${p}`);
				}}
			>
				{s ? t().invoice.statuses[s] : t().common.all}
			</button>
		{/each}
	</div>

	<Table columns={[
		{ key: 'invoice_number', label: t().invoice.invoiceNumber, width: '160px' },
		{ key: 'buyer',          label: t().invoice.buyer },
		{ key: 'period_to',      label: t().invoice.periodTo,      width: '120px' },
		{ key: 'total_amount',   label: t().invoice.totalAmount,   width: '120px' },
		{ key: 'status',         label: t().common.status,         width: '100px' },
		{ key: 'issued_at',      label: t().invoice.issuedAt,      width: '120px' }
	]} rows={data.invoices} onrowclick={(row) => (viewInvoice = row)}>
		{#snippet cell(col, row)}
			{#if col.key === 'buyer'}
				{row.buyer?.company_name ?? '—'}
			{:else if col.key === 'total_amount'}
				{formatCurrency(row.total_amount)}
			{:else if col.key === 'status'}
				<span class="badge badge-{row.status}">{t().invoice.statuses[row.status]}</span>
			{:else if col.key === 'period_to' || col.key === 'issued_at'}
				{formatDate((row as Record<string, unknown>)[col.key] as string)}
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

<!-- Generate modal -->
<Modal bind:open={showGenerate} title={t().invoice.generate}>
	<form method="POST" action="?/generate" use:enhance={generateEnhance} class="form">
		{#if form?.error}
			<div class="form-error">
				{form.error === 'noOrders' ? t().invoice.noOrders : form.error}
			</div>
		{/if}
		<p class="generate-desc">{t().invoice.generateDesc}</p>
		<div class="field">
			<Label for="buyer_id" required>{t().invoice.buyer}</Label>
			<select class="select" name="buyer_id" id="buyer_id" required onchange={onBuyerChange}>
				<option value="">—</option>
				{#each data.buyers as b (b.id)}
					<option value={b.id}>{b.company_name}</option>
				{/each}
			</select>
		</div>
		<div class="form-grid">
			<div class="field">
				<Label for="period_from" required>{t().invoice.periodFrom}</Label>
				<Input id="period_from" name="period_from" type="date" bind:value={genPeriodFrom} required />
			</div>
			<div class="field">
				<Label for="period_to" required>{t().invoice.periodTo}</Label>
				<Input id="period_to" name="period_to" type="date" bind:value={genPeriodTo} required />
			</div>
		</div>
		<div class="field">
			<Label for="due_date" required>{t().invoice.dueDate}</Label>
			<Input id="due_date" name="due_date" type="date" bind:value={genDueDate} required />
		</div>
		<div class="form-actions">
			<Button type="button" variant="secondary" onclick={() => (showGenerate = false)}>{t().common.cancel}</Button>
			<Button type="submit">{t().invoice.generate}</Button>
		</div>
	</form>
</Modal>

<!-- Invoice detail modal -->
{#if viewInvoice}
	<Modal open={!!viewInvoice} title="{t().invoice.detail}: {viewInvoice.invoice_number}" onclose={() => (viewInvoice = null)}>
		<div class="invoice-detail">
			<div class="detail-rows">
				<div class="detail-row"><span class="detail-label">{t().invoice.invoiceNumber}</span><span>{viewInvoice.invoice_number}</span></div>
				<div class="detail-row"><span class="detail-label">{t().invoice.buyer}</span><span>{viewInvoice.buyer?.company_name ?? '—'}</span></div>
				<div class="detail-row"><span class="detail-label">{t().invoice.periodFrom}</span><span>{formatDate(viewInvoice.period_from)}</span></div>
				<div class="detail-row"><span class="detail-label">{t().invoice.periodTo}</span><span>{formatDate(viewInvoice.period_to)}</span></div>
				<div class="detail-row"><span class="detail-label">{t().invoice.dueDate}</span><span>{formatDate(viewInvoice.due_date)}</span></div>
				<div class="detail-row">
					<span class="detail-label">{t().common.status}</span>
					<span class="badge badge-{viewInvoice.status}">{t().invoice.statuses[viewInvoice.status]}</span>
				</div>
			</div>
			<div class="amount-rows">
				<div class="amount-row"><span>{t().invoice.subtotal}</span><span>{formatCurrency(viewInvoice.subtotal)}</span></div>
				<div class="amount-row"><span>{t().invoice.taxAmount}</span><span>{formatCurrency(viewInvoice.tax_amount)}</span></div>
				<div class="amount-row total"><span>{t().invoice.totalAmount}</span><span>{formatCurrency(viewInvoice.total_amount)}</span></div>
			</div>
			<div class="invoice-actions">
				<a href="/supplier/invoices/{viewInvoice.id}" target="_blank" class="print-link">
					<Button variant="secondary">{t().common.printPdf}</Button>
				</a>
				{#if viewInvoice.status === 'issued' || viewInvoice.status === 'overdue'}
					<Button variant="primary" onclick={() => { markPaidId = viewInvoice!.id; }}>
						{t().invoice.markPaid}
					</Button>
				{/if}
			</div>
		</div>
	</Modal>
{/if}

<!-- Hidden markPaid form -->
<form method="POST" action="?/markPaid" use:enhance={markPaidEnhance} bind:this={markPaidFormEl} style="display:none">
	<input name="id" value={markPaidId ?? ''} />
</form>

<ConfirmDialog
	open={!!markPaidId}
	title={t().invoice.markPaid}
	message={t().invoice.markPaidConfirm}
	onconfirm={() => markPaidFormEl?.requestSubmit()}
	oncancel={() => (markPaidId = null)}
/>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); }
	.page-header { display: flex; align-items: center; justify-content: space-between; }
	.page-title { font-size: 1.5rem; font-weight: 700; }

	.status-tabs {
		display: flex;
		gap: 1px;
		background-color: var(--color-bg-sunken);
		padding: 2px;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-light);
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

	.form { display: flex; flex-direction: column; gap: var(--space-lg); }
	.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
	.field { display: flex; flex-direction: column; gap: var(--space-sm); }
	.select {
		height: 36px;
		padding: 0 var(--space-md);
		background-color: var(--color-input-bg);
		color: var(--color-text);
		border: 1px solid var(--color-input-border);
		border-radius: var(--radius-md);
		font-family: inherit;
		font-size: 0.8125rem;
	}
	.generate-desc { font-size: 0.8125rem; color: var(--color-text-secondary); }
	.form-error {
		padding: var(--space-sm) var(--space-md);
		background-color: var(--color-danger-light);
		color: var(--color-danger);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
	}
	.form-actions { display: flex; justify-content: flex-end; gap: var(--space-sm); }

	.invoice-detail { display: flex; flex-direction: column; gap: var(--space-xl); }
	.detail-rows { display: flex; flex-direction: column; gap: var(--space-sm); }
	.detail-row { display: flex; gap: var(--space-md); font-size: 0.875rem; }
	.detail-label { width: 120px; flex-shrink: 0; color: var(--color-text-secondary); }

	.amount-rows {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-md);
		background-color: var(--color-bg-sunken);
		border-radius: var(--radius-md);
	}

	.amount-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		&.total {
			font-size: 1rem;
			font-weight: 700;
			padding-top: var(--space-sm);
			border-top: 1px solid var(--color-border-light);
			margin-top: var(--space-xs);
		}
	}

	.invoice-actions { display: flex; justify-content: flex-end; gap: var(--space-sm); }
	.print-link { text-decoration: none; }
</style>
