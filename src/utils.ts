export function escapeHtml(i: string): string {
	let o: string = "";
	for (const c of i) {
		switch (c) {
			case "<":
				o += "&lt;";
				break;
			case ">":
				o += "&gt;";
				break;
			default:
				o += c;
		}
	}
	return o;
}
export function regexJoin(...a: RegExp[]):RegExp {
	const flags: string[] = [];
	return RegExp(
		a
			.map((i) => {
				return `${i}`
					.replace(/([a-z]+)$/, (_, m: string) => {
						for (const c of m) {
							flags.push(c);
						}
						return "";
					})
					.replace(/^\/|\/$/g, "");
			})
			.join("|"),
		[...new Set(flags)].sort().join(""),
	);
}
