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

/**
 * Calculate invoice period dates based on a buyer's closing_day.
 * Returns the most recently completed period (period_from, period_to)
 * and a suggested due_date (30 days after period_to).
 *
 * closing_day 31 means end-of-month.
 */
export function calcInvoicePeriod(
	closingDay: number,
	referenceDate: Date = new Date()
): { period_from: string; period_to: string; due_date: string } {
	const ref = new Date(referenceDate);
	const day = closingDay >= 28 ? 0 : closingDay; // 0 = last day of month

	// period_to: the most recent closing date <= today
	const toDate = new Date(ref.getFullYear(), ref.getMonth(), day === 0 ? 0 : day);
	if (toDate > ref) {
		// closing date is in the future this month → use previous month's closing
		toDate.setMonth(toDate.getMonth() - 1);
		if (day === 0) toDate.setDate(new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0).getDate());
	} else if (day === 0) {
		// last day of current month
		toDate.setDate(new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate());
	}

	// period_from: day after the previous closing date
	const fromDate = new Date(toDate);
	fromDate.setMonth(fromDate.getMonth() - 1);
	if (day === 0) {
		fromDate.setDate(new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0).getDate());
	}
	fromDate.setDate(fromDate.getDate() + 1);

	const dueDate = new Date(toDate);
	dueDate.setDate(dueDate.getDate() + 30);

	const fmt = (d: Date) => d.toISOString().slice(0, 10);
	return { period_from: fmt(fromDate), period_to: fmt(toDate), due_date: fmt(dueDate) };
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
