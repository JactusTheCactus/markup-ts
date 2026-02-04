import genInline from "./genInline.js";
export default {
    inline: Object.fromEntries(Object.entries({
        bold: "*",
        italic: "/",
        underline: "_",
    }).map(([k, v]) => [k, genInline(v, k)])),
};
