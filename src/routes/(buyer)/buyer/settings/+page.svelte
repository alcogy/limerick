<script lang="ts">
	import { Globe, Moon, Monitor, Palette, Sun } from '@lucide/svelte';
	import { t, getLocale, setLocale, LOCALES, type Locale } from '$lib/i18n';
	import { getTheme, setTheme } from '$lib/theme.svelte';
</script>

<svelte:head>
	<title>{t().settings.title} — {t().app.name}</title>
</svelte:head>

<div class="page">
	<h1 class="page-title">{t().settings.title}</h1>

	<section class="settings-section">
		<h2><Palette size={16} /> {t().settings.appearance}</h2>
		<div class="settings-card">
			<div class="setting-row">
				<div class="setting-info">
					<div class="setting-label">{t().settings.theme}</div>
					<div class="setting-desc">{t().settings.themeDesc}</div>
				</div>
				<div class="setting-control">
					<div class="locale-buttons">
						<button
							type="button"
							class="locale-btn"
							class:active={getTheme() === 'light'}
							onclick={() => setTheme('light')}
						>
							<Sun size={14} />
							{t().settings.themeLight}
						</button>
						<button
							type="button"
							class="locale-btn"
							class:active={getTheme() === 'dark'}
							onclick={() => setTheme('dark')}
						>
							<Moon size={14} />
							{t().settings.themeDark}
						</button>
						<button
							type="button"
							class="locale-btn"
							class:active={getTheme() === 'system'}
							onclick={() => setTheme('system')}
						>
							<Monitor size={14} />
							{t().settings.themeSystem}
						</button>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="settings-section">
		<h2><Globe size={16} /> {t().settings.language}</h2>
		<div class="settings-card">
			<div class="setting-row">
				<div class="setting-info">
					<div class="setting-label">{t().settings.language}</div>
					<div class="setting-desc">{t().settings.languageDesc}</div>
				</div>
				<div class="setting-control">
					<div class="locale-buttons">
						{#each LOCALES as locale (locale.value)}
							<button
								type="button"
								class="locale-btn"
								class:active={getLocale() === locale.value}
								onclick={() => setLocale(locale.value as Locale)}
							>
								{locale.nativeLabel}
							</button>
						{/each}
					</div>
				</div>
			</div>
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
		font-size: 1.5rem;
		font-weight: 700;
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);

		h2 {
			display: flex;
			align-items: center;
			gap: var(--space-sm);
			font-size: 1rem;
			font-weight: 600;
		}
	}

	.settings-card {
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-lg);
	}

	.setting-info {
		flex: 1;
	}
	.setting-label {
		font-weight: 500;
		font-size: 0.875rem;
	}
	.setting-desc {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		margin-top: 2px;
	}
	.setting-control {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.locale-buttons {
		display: flex;
		gap: 2px;
		background-color: var(--color-bg-sunken);
		padding: 3px;
		border-radius: var(--radius-md);
	}

	.locale-btn {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-xl);
		border: none;
		background: none;
		border-radius: calc(var(--radius-md) - 2px);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-fast);
		font-family: inherit;

		&.active {
			background-color: var(--color-bg-elevated);
			color: var(--color-text);
			box-shadow: var(--shadow-sm);
		}

		&:hover:not(.active) {
			color: var(--color-text);
		}
	}
</style>
