const t = {
	index: 1,
	createVariant: (x: number, y: number) => [
		[
			[y, x - 1],
			[y, x],
			[y - 1, x],
			[y, x + 1],
		],
		[
			[y - 1, x],
			[y, x],
			[y, x + 1],
			[y + 1, x],
		],
		[
			[y, x - 1],
			[y, x],
			[y + 1, x],
			[y, x + 1],
		],
		[
			[y - 1, x],
			[y, x],
			[y, x - 1],
			[y + 1, x],
		],
	],
};

const l = {
	index: 2,
	createVariant: (x: number, y: number) => [
		[
			[y, x + 1],
			[y, x],
			[y, x - 1],
			[y + 1, x - 1],
		],
		[
			[y + 1, x],
			[y, x],
			[y - 1, x],
			[y - 1, x - 1],
		],
		[
			[y, x - 1],
			[y, x],
			[y, x + 1],
			[y - 1, x + 1],
		],
		[
			[y - 1, x],
			[y, x],
			[y + 1, x],
			[y + 1, x + 1],
		],
	],
};

const j = {
	index: 3,
	createVariant: (x: number, y: number) => [
		[
			[y, x - 1],
			[y, x],
			[y, x + 1],
			[y + 1, x + 1],
		],
		[
			[y - 1, x],
			[y, x],
			[y + 1, x],
			[y + 1, x - 1],
		],
		[
			[y, x + 1],
			[y, x],
			[y, x - 1],
			[y - 1, x - 1],
		],
		[
			[y + 1, x],
			[y, x],
			[y - 1, x],
			[y - 1, x + 1],
		],
	],
};

const z = {
	index: 4,
	createVariant: (x: number, y: number) => [
		[
			[y, x + 1],
			[y, x],
			[y - 1, x],
			[y - 1, x - 1],
		],
		[
			[y + 1, x],
			[y, x],
			[y, x + 1],
			[y - 1, x + 1],
		],
		[
			[y, x - 1],
			[y, x],
			[y + 1, x],
			[y + 1, x + 1],
		],
		[
			[y - 1, x],
			[y, x],
			[y, x - 1],
			[y + 1, x - 1],
		],
	],
};
const s = {
	index: 5,
	createVariant: (x: number, y: number) => [
		[
			[y, x - 1],
			[y, x],
			[y - 1, x],
			[y - 1, x + 1],
		],
		[
			[y - 1, x],
			[y, x],
			[y, x + 1],
			[y + 1, x + 1],
		],
		[
			[y, x + 1],
			[y, x],
			[y + 1, x],
			[y + 1, x - 1],
		],
		[
			[y + 1, x],
			[y, x],
			[y, x - 1],
			[y - 1, x - 1],
		],
	],
};

const o = {
	index: 6,
	createVariant: (x: number, y: number) => [
		[
			[y, x],
			[y, x + 1],
			[y + 1, x],
			[y + 1, x + 1],
		],
		[
			[y, x],
			[y, x + 1],
			[y + 1, x],
			[y + 1, x + 1],
		],
		[
			[y, x],
			[y, x + 1],
			[y + 1, x],
			[y + 1, x + 1],
		],
		[
			[y, x],
			[y, x + 1],
			[y + 1, x],
			[y + 1, x + 1],
		],
	],
};
const i = {
	index: 7,
	createVariant: (x: number, y: number) => [
		[
			[y, x - 1],
			[y, x],
			[y, x + 1],
			[y, x + 2],
		],
		[
			[y - 1, x],
			[y, x],
			[y + 1, x],
			[y + 2, x],
		],
		[
			[y, x + 1],
			[y, x],
			[y, x - 1],
			[y, x - 2],
		],
		[
			[y + 1, x],
			[y, x],
			[y - 1, x],
			[y - 2, x],
		],
	],
};

const colorList = ["black", "purple", "blue", "orange", "green", "red", "yellow", "cyan"];

export default { t, j, l, z, s, o, i, colorList };
