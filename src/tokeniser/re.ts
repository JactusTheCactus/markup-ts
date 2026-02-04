import type { Inline } from "../utils/Inline.js";
import type { InlineSymbol } from "../utils/InlineSymbol.js";
import genInline from "./genInline.js";
export default {
	inline: Object.fromEntries(
		Object.entries({
			bold: "*",
			italic: "/",
			underline: "_",
		}).map(([k, v]: [Inline, InlineSymbol]) => [k, genInline(v, k)]),
	),
};
