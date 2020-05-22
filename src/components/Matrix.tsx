import React, { Component } from "react";
import "../sass/Matrix.scss";
import { tTetrimino, Tetrimino } from "./Tetrimino";

const deepCopy = (arr: Array<any>) => {
	let copy: typeof arr = [];
	arr.forEach(elem => {
		if (Array.isArray(elem)) {
			copy.push(deepCopy(elem));
		} else {
			copy.push(elem);
		}
	});
	return copy;
};

interface Props {}

interface State {
	matrix: Array<Array<Number>>;
}

class Matrix extends Component<Props, State> {
	cols = 10;
	rows = 20;
	x = 1;
	y = 0;
	stableMatrix: number[][] = [];
	currentTetrimino: Tetrimino | null = null;
	currentVariation: number = 0;
	currentMovementInterval: NodeJS.Timeout | null = null;

	constructor(props: Props) {
		super(props);
		this.stableMatrix = this.createMatrix();
		this.state = { matrix: this.stableMatrix };
	}

	componentDidMount() {
		window.addEventListener("keydown", (e: KeyboardEvent) => {
			switch (e.key) {
				case "ArrowRight": {
					this.x++;
					this.drawMatrix();
					break;
				}
				case "ArrowLeft": {
					this.x--;
					this.drawMatrix();
					break;
				}
				case "ArrowDown": {
					this.y++;
					this.drawMatrix();
					break;
				}
				case "ArrowUp": {
					this.currentVariation++;
					if (this.currentVariation > 3) this.currentVariation = 0;
					this.drawMatrix();
					break;
				}
			}
		});
	}

	createMatrix = (): number[][] => {
		return [...new Array(this.rows)].map(() => [...new Array(this.cols)].map(() => 0));
	};

	addTetrimino = (tetrimino: Tetrimino) => {
		let { matrix } = this.state;

		tetrimino.variations[0].forEach(c => {
			matrix[c[0]][c[1]] = 1;
		});
		this.setState({ matrix });
	};

	checkBorders = (): boolean => {
		let borderCrossed = false;

		if (this.currentTetrimino)
			for (const c of this.currentTetrimino.variations[this.currentVariation]) {
				if (c[0] > this.rows - 1 && this.currentMovementInterval !== null) {
					// if tetrimino hits bottom, stop the movement and overwrite the stable matrix
					clearInterval(this.currentMovementInterval);
					this.stableMatrix = deepCopy(this.state.matrix);

					this.currentTetrimino = null; // clearing the current tetrimino
					borderCrossed = true;
				}
				if (c[1] > this.cols - 1) {
					this.x--;
					borderCrossed = true;
				}
				if (c[1] < 0) {
					this.x++;
					borderCrossed = true;
				}
			}

		if (borderCrossed) return false;

		return true;
	};

	drawMatrix = () => {
		if (!this.currentTetrimino) return;

		this.currentTetrimino.createVariations(this.x, this.y);
		if (!this.checkBorders()) {
			console.log("cannot draw this");
			return;
		}

		const newMatrix = deepCopy(this.stableMatrix); // clearing the moving part

		let isThereCollision = false;

		this.currentTetrimino.variations[this.currentVariation].forEach(c => {
			if (newMatrix[c[0]][c[1]] === 1) isThereCollision = true;
			newMatrix[c[0]][c[1]] = 1;
		});

		if (isThereCollision) return;
		this.setState({ matrix: newMatrix });
	};

	moveDown = () => {
		this.y++;
	};

	startTetrimino = (tetrimino: Tetrimino) => {
		this.y = 0;
		this.currentTetrimino = tetrimino;
		this.currentTetrimino.createVariations(this.x, this.y);

		if (this.currentMovementInterval !== null) {
			clearInterval(this.currentMovementInterval);
		}

		this.currentMovementInterval = setInterval(() => {
			this.moveDown();
			this.drawMatrix();
		}, 1000);
	};

	render() {
		const { matrix } = this.state;
		return (
			<>
				<div className="matrix">
					{matrix.flat(Infinity).map((val, i) => (
						<div className={`mino ${val ? "filled" : ""}`} key={i} />
					))}
				</div>
				<button onClick={() => this.startTetrimino(new tTetrimino())}>Start</button>
			</>
		);
	}
}

export default Matrix;
