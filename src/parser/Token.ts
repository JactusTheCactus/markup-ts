import type { Inline } from "../utils/Inline.js";
export type Token =
	| { type: "text"; text: string }
	| { type: "open" | "close"; inline: Inline };
