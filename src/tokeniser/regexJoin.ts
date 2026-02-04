export default (regexes: RegExp[]): RegExp =>
	new RegExp(
		regexes.map((r) => r.source).join("|"),
		[...new Set(regexes.flatMap((r) => [...r.flags]))]
			.filter((i) => !["g", "y"].includes(i))
			.sort()
			.join(""),
	);
