import fs from "node:fs";
import path from "node:path";
import Tokens from "../parser/Tokens.js";
import type { Token } from "../parser/Token.js";
import type { Inline } from "../utils/Inline.js";
import escapes from "../utils/escapes.js";
import Markup from "./Markup.js";
import re from "./re.js";
import regexJoin from "./regexJoin.js";
/** @todo Use escaped text tokens instead of `this.input.replace(...)` */
export default (THIS: Markup, ...file: string[]): Tokens => {
	const re_escape = RegExp(
		`\\\\(${Object.keys(escapes)
			.map((i) => (["*"].includes(i) ? `\\${i}` : i))
			.join("|")})`,
	);
	let output = THIS.input.replace(
		RegExp(re_escape, "g"),
		(_, m) => escapes[m],
	);
	const tokens: Token[] = [];
	const all = regexJoin(
		Object.entries(re)
			.map(([_, v]) => {
				if (v instanceof RegExp) return v;
				else return Object.values(v);
			})
			.flat(),
	);
	while (all.test(output)) {
		let best = null;
		for (const r of Object.values(re["inline"])) {
			const match = output.match(r);
			if (!match) continue;
			else if (!best || match.index < best.match.index)
				best = { regex: r, match };
		}
		const match = best.match;
		const start = match.index;
		const end = start + match[0].length;
		const before = output.slice(0, start);
		const after = output.slice(end);
		const type = Object.keys(best.match.groups)[0].replace(
			/(.*?)_text/,
			(_, m) => m,
		) as Inline;
		if (before.length) tokens.push({ type: "text", text: before });
		const content = match[1];
		const contentTokens = new Markup(content).tokenise();
		tokens.push({ inline: type, type: "open" });
		tokens.push(...contentTokens);
		tokens.push({ inline: type, type: "close" });
		output = after;
	}
	tokens.push({ type: "text", text: output });
	if (file.length)
		fs.writeFileSync(
			path.join(...file),
			JSON.stringify(
				tokens
					.map((i) => {
						if (i.type === "text") return i.text;
						else return `[${[i.inline, i.type].join("_")}]`;
					})
					.filter(Boolean),
				null,
				"\t",
			),
		);
	return new Tokens(tokens);
};
