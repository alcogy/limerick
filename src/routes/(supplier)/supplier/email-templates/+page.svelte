<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { Button, Input, Label, Textarea } from '$lib/ui';
	import { t } from '$lib/i18n';
	import { Mail } from '@lucide/svelte';
	import { TEMPLATE_VARIABLES, TEMPLATE_DEFAULTS } from '$lib/services/template.service';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let invSubject = $state(untrack(() => data.templates.invitation.subject));
	let invBody    = $state(untrack(() => data.templates.invitation.body));
	let ordSubject = $state(untrack(() => data.templates.order_message.subject));
	let ordBody    = $state(untrack(() => data.templates.order_message.body));

	const saveEnhance: SubmitFunction = () => async ({ update }) => { await update(); };

	function resetTemplate(id: 'invitation' | 'order_message') {
		const defaults = TEMPLATE_DEFAULTS[id];
		if (id === 'invitation') {
			invSubject = defaults.subject;
			invBody    = defaults.body;
		} else {
			ordSubject = defaults.subject;
			ordBody    = defaults.body;
		}
	}
</script>

<svelte:head>
	<title>{t().emailTemplate.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<h1 class="page-title"><Mail size={20} /> {t().emailTemplate.title}</h1>
	<p class="page-desc">{t().emailTemplate.desc}</p>

	<!-- Buyer Invitation -->
	<section class="tpl-section">
		<div class="tpl-header">
			<div>
				<h2>{t().emailTemplate.invitation}</h2>
				<p class="tpl-desc">{t().emailTemplate.invitationDesc}</p>
			</div>
		</div>
		<div class="tpl-card">
			<form method="POST" action="?/save" use:enhance={saveEnhance} class="tpl-form">
				<input type="hidden" name="id" value="invitation" />

				{#if form?.success && form?.savedId === 'invitation'}
					<div class="save-ok">{t().emailTemplate.saved}</div>
				{/if}

				<div class="vars-row">
					<span class="vars-label">{t().emailTemplate.variables}:</span>
					{#each TEMPLATE_VARIABLES.invitation as v (v)}
						<code class="var-chip">{`{{${v}}}`}</code>
					{/each}
				</div>

				<div class="field">
					<Label for="inv-subject">{t().emailTemplate.subject}</Label>
					<Input id="inv-subject" name="subject" bind:value={invSubject} />
				</div>

				<div class="field">
					<Label for="inv-body">{t().emailTemplate.body}</Label>
					<Textarea id="inv-body" name="body" bind:value={invBody} rows={10} />
				</div>

				<div class="form-actions">
					<Button type="button" variant="ghost" onclick={() => resetTemplate('invitation')}>
						{t().emailTemplate.resetDefault}
					</Button>
					<Button type="submit">{t().common.save}</Button>
				</div>
			</form>
		</div>
	</section>

	<!-- Order Message -->
	<section class="tpl-section">
		<div class="tpl-header">
			<div>
				<h2>{t().emailTemplate.orderMessage}</h2>
				<p class="tpl-desc">{t().emailTemplate.orderMessageDesc}</p>
			</div>
		</div>
		<div class="tpl-card">
			<form method="POST" action="?/save" use:enhance={saveEnhance} class="tpl-form">
				<input type="hidden" name="id" value="order_message" />

				{#if form?.success && form?.savedId === 'order_message'}
					<div class="save-ok">{t().emailTemplate.saved}</div>
				{/if}

				<div class="vars-row">
					<span class="vars-label">{t().emailTemplate.variables}:</span>
					{#each TEMPLATE_VARIABLES.order_message as v (v)}
						<code class="var-chip">{`{{${v}}}`}</code>
					{/each}
				</div>

				<div class="field">
					<Label for="ord-subject">{t().emailTemplate.subject}</Label>
					<Input id="ord-subject" name="subject" bind:value={ordSubject} />
				</div>

				<div class="field">
					<Label for="ord-body">{t().emailTemplate.body}</Label>
					<Textarea id="ord-body" name="body" bind:value={ordBody} rows={8} />
				</div>

				<div class="form-actions">
					<Button type="button" variant="ghost" onclick={() => resetTemplate('order_message')}>
						{t().emailTemplate.resetDefault}
					</Button>
					<Button type="submit">{t().common.save}</Button>
				</div>
			</form>
		</div>
	</section>
</div>

<style lang="scss">
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-2xl);
		max-width: 720px;
	}

	.page-title {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: 1.5rem;
		font-weight: 700;
	}

	.page-desc {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin-top: calc(-1 * var(--space-xl));
	}

	.tpl-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.tpl-header {
		h2 { font-size: 1rem; font-weight: 600; }
	}

	.tpl-desc {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		margin-top: 2px;
	}

	.tpl-card {
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.tpl-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		padding: var(--space-lg);
	}

	.vars-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-md);
		background-color: var(--color-bg-sunken);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
	}

	.vars-label {
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.var-chip {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 2px 6px;
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-primary);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--color-border-light);
	}

	.save-ok {
		padding: var(--space-sm) var(--space-md);
		background-color: var(--color-success-light);
		color: var(--color-success);
		font-size: 0.8125rem;
		border-radius: var(--radius-sm);
	}
</style>
