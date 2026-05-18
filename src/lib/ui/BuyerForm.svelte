<script lang="ts">
	import { Button, Input, Label, Textarea } from '$lib/ui';
	import { enhance } from '$app/forms';
	import { t } from '$lib/i18n';
	import type { SubmitFunction } from '@sveltejs/kit';

	interface PriceGroup { id: string; name: string }
	interface Buyer {
		id: string;
		company_name: string;
		name: string;
		email: string;
		price_group_id: string | null;
		closing_day: number;
		phone: string | null;
		address: string | null;
		payment_terms: string | null;
		notes: string | null;
	}

	interface Props {
		priceGroups: PriceGroup[];
		buyer?: Buyer | null;
		error?: string | null;
		onclose: () => void;
	}

	let { priceGroups, buyer = null, error, onclose }: Props = $props();

	const isEdit = $derived(!!buyer);
	const action = $derived(isEdit ? '?/update' : '?/create');

	const submitEnhance: SubmitFunction = () => async ({ result, update }) => {
		await update();
		if (result.type === 'success') onclose();
	};
</script>

<form method="POST" {action} use:enhance={submitEnhance} class="form">
	{#if isEdit}
		<input type="hidden" name="id" value={buyer!.id} />
	{/if}

	{#if error}
		<div class="form-error">{error}</div>
	{/if}

	<div class="form-grid">
		<div class="field">
			<Label for="bf-company" required>{t().buyer.companyName}</Label>
			<Input id="bf-company" name="company_name" value={buyer?.company_name ?? ''} required />
		</div>
		<div class="field">
			<Label for="bf-name" required>{t().buyer.contactName}</Label>
			<Input id="bf-name" name="name" value={buyer?.name ?? ''} required />
		</div>
	</div>

	<div class="field">
		<Label for="bf-email" required={!isEdit}>{t().buyer.email}</Label>
		{#if isEdit}
			<Input id="bf-email" value={buyer!.email} disabled />
		{:else}
			<Input id="bf-email" name="email" type="email" required />
		{/if}
	</div>

	<div class="form-grid">
		<div class="field">
			<Label for="bf-pg">{t().buyer.priceGroup}</Label>
			<select class="select" name="price_group_id" id="bf-pg">
				<option value="">—</option>
				{#each priceGroups as g (g.id)}
					<option value={g.id} selected={g.id === buyer?.price_group_id}>{g.name}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<Label for="bf-cd">{t().buyer.closingDay}</Label>
			<Input id="bf-cd" name="closing_day" type="number" value={buyer?.closing_day ?? 20} min="1" max="31" />
			<p class="field-note">{t().buyer.closingDayNote}</p>
		</div>
	</div>

	<div class="field">
		<Label for="bf-phone">{t().buyer.phone}</Label>
		<Input id="bf-phone" name="phone" type="tel" value={buyer?.phone ?? ''} />
	</div>

	<div class="field">
		<Label for="bf-address">{t().buyer.address}</Label>
		<Textarea id="bf-address" name="address" rows={2} value={buyer?.address ?? ''} />
	</div>

	<div class="field">
		<Label for="bf-pt">{t().buyer.paymentTerms}</Label>
		<Input id="bf-pt" name="payment_terms" value={buyer?.payment_terms ?? ''} />
	</div>

	<div class="field">
		<Label for="bf-notes">{t().buyer.notes}</Label>
		<Textarea id="bf-notes" name="notes" rows={2} value={buyer?.notes ?? ''} />
	</div>

	<div class="form-actions">
		<Button type="button" variant="secondary" onclick={onclose}>{t().common.cancel}</Button>
		<Button type="submit">{t().common.save}</Button>
	</div>
</form>

<style lang="scss">
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

	.field-note {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
	}

	.form-error {
		padding: var(--space-sm) var(--space-md);
		background-color: var(--color-danger-light);
		color: var(--color-danger);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
	}

	.form-actions { display: flex; justify-content: flex-end; gap: var(--space-sm); }
</style>
