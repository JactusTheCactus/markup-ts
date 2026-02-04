import escapes from "../utils/escapes.js";
import type { InlineSymbol } from "../utils/InlineSymbol.js";
export default Object.fromEntries(
	Object.entries(escapes).map(([k, v]: [InlineSymbol, string]) => [v, k]),
);
