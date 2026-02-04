import type { NodeType } from "./NodeType.js";
import push from "./push.js";
import render from "./render.js";
import toString from "./toString.js";
export default class Node {
	type: NodeType;
	text?: string | null;
	children: Node[];
	constructor(options: {
		type?: NodeType;
		text?: string;
		children?: Node[];
	}) {
		this.type = options.type ?? "text";
		this.text = options.text;
		this.children = options.children ?? [];
	}
	push(...children: Node[]): void {
		push(this, ...children);
	}
	toString(): string {
		return toString(this);
	}
	render(...file: string[]): string {
		return render(this, ...file);
	}
}
