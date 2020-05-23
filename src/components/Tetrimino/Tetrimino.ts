import templates from "./templates";

// export abstract class Tetrimino {
// 	abstract color: string;
// 	abstract variations: number[][][];
// 	abstract width: number;
// 	abstract createVariations(x: number, y: number, mock: boolean): number[][][];
// }

export default class Tetrimino {
	type: string;
	color: string;
	variations: number[][][];

	constructor(type: string) {
		this.type = type;
		this.color = "red";
		this.variations = [];
	}

	createVariations = (x: number, y: number, mock: boolean) => {
		const variations = (templates as any)[this.type].createVariant(x, y);

		if (!mock) {
			this.variations = variations;
		}

		return variations;
	};
}
