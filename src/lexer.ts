import { regexJoin } from "./utils.js";
type Inline = "bold" | "italic" | "underline";
type HeaderRange = 1 | 2 | 3 | 4 | 5 | 6;
export type Token =
	| { type: "text"; text: string }
	| { type: `${Inline}_${"open" | "close"}` }
	| { type: `header_${"open" | "close"}`; level: number }
	| { type: "code"; language: string; text: string };
export function lex(i: string): Token[] {
	const tokens: Token[] = [];
	function pushText(text: string) {
		tokens.push({ type: "text", text });
		i = i.replace(text, "");
	}
	function pushOpenClose(
		text: string,
		type: Inline | "header",
		lvl?: HeaderRange,
	) {
		if (type == "header") {
			tokens.push({ type: "header_open", level: lvl });
			pushText(text);
			tokens.push({ type: "header_close", level: lvl });
		} else {
			tokens.push({ type: `${type}_open` });
			pushText(text);
			tokens.push({ type: `${type}_close` });
		}
	}
	const re:
		| Record<"code" | "header" | "command", RegExp>
		| Record<"inline", Record<"bold" | "italic" | "underline", RegExp>>
		| Record<"all", RegExp[]> = {
		code: /<-(?<escape>!?)(?<language>\w+)>\{(?<text>[\s\S]*?)\}/,
		inline: {
			bold: /\*(?!\s)(?<text>[^*\n]+?)(?<!\s)\*/,
			italic: /\/(?!\s)(?<text>[^\/\n]+?)(?<!\s)\//,
			underline: /_(?!\s)(?<text>[^_\n]+?)(?<!\s)_/,
		},
		header: /^!(?<level>[1-6])\{(?<text>[^\n]*?)\}$/m,
		command: /\/(?<cmd>(?:upp|low)er|cap)(?<arguments>(?:::.+?)+?);/,
	};
	re["all"] = regexJoin(
		...Object.values(re)
			.map((x: RegExp | Record<string, RegExp>) => {
				if (x instanceof RegExp) {
					return x;
				} else {
					return Object.values(x);
				}
			})
			.flat(),
	);
	let text = "";
	const inline = Object.keys(re["inline"]);
	while (re["all"].test(i)) {
		if (re["code"].test(i)) {
			text = i.match(re["code"]).groups["text"];
			tokens.push({
				type: "code",
				text: i.match(re["code"]).groups["text"],
				language: i.match(re["code"]).groups["language"],
			});
			pushText(i.slice(0, i.indexOf(text)));
		} else if (re["header"].test(i)) {
			text = i.match(re["header"]).groups["text"];
			pushText(i.slice(0, i.indexOf(text)));
			pushOpenClose(
				text,
				"header",
				parseInt(i.match(re["header"]).groups["level"]) as HeaderRange,
			);
			pushText(i.slice(0, i.indexOf(text)));
		} else if (regexJoin(...inline.map((i) => re["inline"][i])).test(i)) {
			inline.forEach((k: Inline) => {
				text = i.match(re["inline"][k]).groups["text"];
				pushText(i.slice(0, i.indexOf(text)));
				pushOpenClose(text, k);
			});
		}
		continue;
	}
	return tokens;
}
