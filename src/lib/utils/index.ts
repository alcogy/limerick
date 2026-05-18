export function formatDate(dateString: string | null | undefined): string {
	if (!dateString) return '—';
	return new Date(dateString).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

export function formatDateTime(dateString: string | null | undefined): string {
	if (!dateString) return '—';
	return new Date(dateString).toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatCurrency(amount: number | null | undefined, currency = 'JPY'): string {
	if (amount === null || amount === undefined) return '—';
	return new Intl.NumberFormat('ja-JP', { style: 'currency', currency }).format(amount);
}

export function formatNumber(n: number | null | undefined): string {
	if (n === null || n === undefined) return '—';
	return new Intl.NumberFormat('en-US').format(n);
}

export function calcTaxIncluded(price: number, taxRate: number): number {
	return Math.floor(price * (1 + taxRate));
}

export function now(): string {
	return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export function todayISO(): string {
	return new Date().toISOString().slice(0, 10);
}

export function paginate<T>(items: T[], page: number, perPage: number) {
	const total = items.length;
	const totalPages = Math.ceil(total / perPage);
	const start = (page - 1) * perPage;
	return {
		items: items.slice(start, start + perPage),
		total,
		totalPages,
		page,
		perPage
	};
}

export function buildCsvRow(fields: (string | number | null | undefined)[]): string {
	return fields
		.map((f) => {
			const s = String(f ?? '');
			return s.includes(',') || s.includes('"') || s.includes('\n')
				? `"${s.replace(/"/g, '""')}"`
				: s;
		})
		.join(',');
}
