import push from "./push.js";
import render from "./render.js";
import toString from "./toString.js";
export default class Node {
    type;
    text;
    children;
    constructor(options) {
        this.type = options.type ?? "text";
        this.text = options.text;
        this.children = options.children ?? [];
    }
    push(...children) {
        push(this, ...children);
    }
    toString() {
        return toString(this);
    }
    render(...file) {
        return render(this, ...file);
    }
}
