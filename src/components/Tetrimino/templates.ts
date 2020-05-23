const t = {
	color: "red",
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

export default { t };
