<script lang="ts">
	import { Button, Input, Label, Card } from '$lib/ui';
	import { t } from '$lib/i18n';
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>{t().nav.profile} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<h1 class="page-title">{t().nav.profile}</h1>

	<Card title={t().nav.profile}>
		<div class="info-section">
			<div class="info-row">
				<span class="info-label">{t().auth.email}</span>
				<span class="info-value">{data.user?.email ?? ''}</span>
			</div>
			<div class="info-row">
				<span class="info-label">{t().buyer.contactName}</span>
				<span class="info-value">{data.user?.name ?? ''}</span>
			</div>
		</div>
	</Card>

	<Card title={t().auth.newPassword}>
		<form method="POST" use:enhance class="form">
			{#if form?.success}
				<div class="success-msg">{t().common.save} — OK</div>
			{/if}
			{#if form?.error}
				<div class="form-error">{form.error}</div>
			{/if}

			<div class="field">
				<Label for="current_password">{t().auth.password}</Label>
				<Input
					id="current_password"
					name="current_password"
					type="password"
					autocomplete="current-password"
					required
				/>
			</div>
			<div class="field">
				<Label for="new_password">{t().auth.newPassword}</Label>
				<Input
					id="new_password"
					name="new_password"
					type="password"
					autocomplete="new-password"
					required
				/>
			</div>
			<div class="field">
				<Label for="confirm_password">{t().auth.confirmPassword}</Label>
				<Input
					id="confirm_password"
					name="confirm_password"
					type="password"
					autocomplete="new-password"
					required
				/>
			</div>

			<div class="form-actions">
				<Button type="submit">{t().common.save}</Button>
			</div>
		</form>
	</Card>
</div>

<style lang="scss">
	.page { display: flex; flex-direction: column; gap: var(--space-xl); max-width: 480px; }
	.page-title { font-size: 1.5rem; font-weight: 700; }

	.info-section { display: flex; flex-direction: column; gap: var(--space-md); }

	.info-row {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
		font-size: 0.875rem;
	}

	.info-label {
		width: 100px;
		flex-shrink: 0;
		color: var(--color-text-secondary);
	}

	.info-value { font-weight: 500; }

	.form { display: flex; flex-direction: column; gap: var(--space-lg); }
	.field { display: flex; flex-direction: column; gap: var(--space-sm); }

	.form-error {
		padding: var(--space-sm) var(--space-md);
		background-color: var(--color-danger-light);
		color: var(--color-danger);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
	}

	.success-msg {
		padding: var(--space-sm) var(--space-md);
		background-color: var(--color-success-light);
		color: var(--color-success);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
	}

	.form-actions { display: flex; justify-content: flex-end; }
</style>
