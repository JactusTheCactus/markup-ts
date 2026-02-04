export default Object.entries({
    "*": "star",
    "/": "slash",
    _: "underscore",
}).reduce((acc, [k, v]) => {
    acc[k] = `\0${v.toUpperCase()}\0`;
    return acc;
}, {});
