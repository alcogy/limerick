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
		<form method="POST" use:enhance class="form">
			{#if form?.success}
				<div class="success-msg">{t().profile.savedSuccessfully}</div>
			{/if}
			{#if form?.error}
				<div class="form-error">{form.error}</div>
			{/if}

			<div class="field">
				<Label for="name" required>{t().profile.displayName}</Label>
				<Input id="name" name="name" value={data.user?.name ?? ''} required />
			</div>
			<div class="field">
				<Label>{t().auth.email}</Label>
				<Input value={data.user?.email ?? ''} disabled />
			</div>

			<hr class="divider" />
			<p class="section-label">{t().profile.changePassword} — {t().profile.changePasswordDesc}</p>

			<div class="field">
				<Label for="current_password">{t().profile.currentPassword}</Label>
				<Input id="current_password" name="current_password" type="password" autocomplete="current-password" />
			</div>
			<div class="field">
				<Label for="new_password">{t().auth.newPassword}</Label>
				<Input id="new_password" name="new_password" type="password" autocomplete="new-password" />
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
	.divider { border: none; border-top: 1px solid var(--color-border-light); }
	.section-label { font-size: 0.8125rem; color: var(--color-text-secondary); }
</style>
