import escapes from "../utils/escapes.js";
export default Object.fromEntries(Object.entries(escapes).map(([k, v]) => [v, k]));
