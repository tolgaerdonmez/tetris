import templates from "./templates";

export default class Tetrimino {
	type: string;
	variations: number[][][];
	index: number;

	constructor(type: string) {
		this.type = type;
		this.index = (templates as any)[this.type].index;
		this.variations = [];
	}

	createVariations = (x: number, y: number, mock?: boolean): number[][][] => {
		const variations = (templates as any)[this.type].createVariant(x, y) as number[][][];

		if (!mock) {
			this.variations = variations;
		}

		return variations;
	};
}

export const Templates = { ...templates };
