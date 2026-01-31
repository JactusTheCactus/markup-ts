export function escapeHtml(i) {
    let o = "";
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
export function regexJoin(...a) {
    const flags = [];
    return RegExp(a
        .map((i) => {
        return `${i}`
            .replace(/([a-z]+)$/, (_, m) => {
            for (const c of m) {
                flags.push(c);
            }
            return "";
        })
            .replace(/^\/|\/$/g, "");
    })
        .join("|"), [...new Set(flags)].sort().join(""));
}
