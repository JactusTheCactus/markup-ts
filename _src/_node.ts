import type { Inline } from "./main.js";
import { unEscape } from "./main.js";
type NodeType = "root" | "text" | Inline;
class Node {
	type: NodeType;
	text: string;
	children: Node[];
	constructor(options?: {
		type?: NodeType;
		text?: string;
		children?: Node[];
	}) {
		this.type = options?.type ?? "text";
		this.text = options?.text ?? "";
		this.children = options?.children ?? [];
	}
	[Symbol.iterator]() {
		return this.children[Symbol.iterator]();
	}
	[Symbol.toPrimitive](hook: "string") {
		switch (hook) {
			case "string": {
				function filter(node: Node) {
					type NodeObj = {
						type: NodeType;
						text?: string;
						children: NodeObj[];
					};
					const n: NodeObj = JSON.parse(JSON.stringify(node));
					Object.entries(n).forEach(([k, v]) => {
						if (!v?.length) {
							delete n[k];
						}
					});
					if (n.children) {
						n.children = n.children.map(filter).filter(Boolean);
					}
					switch (n.type) {
						case "text":
							if (n.text) {
								return n;
							} else {
								return null;
							}
						default:
							return n;
					}
				}
				return JSON.stringify(filter(this), null, 4);
			}
		}
	}
	get [Symbol.toStringTag]() {
		return "Node";
	}
	push(...children: Node[]) {
		children.forEach((child) => {
			this.children.push(child);
		});
	}
	reduce(): string {
		switch (this?.type) {
			case "root":
			case "bold":
			case "italic":
			case "underline": {
				const text = this.children.map((i) => i.reduce()).join("");
				switch (this.type) {
					case "root":
						return text;
					default: {
						const tag = this.type.at(0);
						return `<${tag}>${text}</${tag}>`;
					}
				}
			}
			case "text":
				return unEscape(this.text);
		}
	}
}
