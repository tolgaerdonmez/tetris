export abstract class Tetrimino {
	abstract color: string;
	abstract variations: number[][][];
	abstract width: number;
	abstract createVariations(x: number, y: number): void;
}

export class tTetrimino extends Tetrimino {
	color: string;
	variations: number[][][];
	width: number = 3;
	constructor() {
		super();
		this.color = "red";
		this.variations = [];
	}

	createVariations = (x: number, y: number) => {
		this.variations = [
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
		];
	};
}
