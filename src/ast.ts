interface BaseNode {
	type: string;
	children?: Node[];
}
export interface TextNode extends BaseNode {
	type: "text";
	value: string;
}
export interface BoldNode extends BaseNode {
	type: "bold";
	children: Node[];
}
export interface ItalicNode extends BaseNode {
	type: "italic";
	children: Node[];
}
export interface UnderlineNode extends BaseNode {
	type: "underline";
	children: Node[];
}
export interface HeaderNode extends BaseNode {
	type: "header";
	level: number;
	children: Node[];
}
export interface CodeNode extends BaseNode {
	type: "code";
	language?: string;
	raw: string;
}
export type Node =
	| TextNode
	| BoldNode
	| ItalicNode
	| UnderlineNode
	| HeaderNode
	| CodeNode;
