import React, { Component } from "react";
import "../sass/Matrix.scss";
import Tetrimino, { Templates } from "./Tetrimino/Tetrimino";

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
	cleanRows: number[];
}

class Matrix extends Component<Props, State> {
	cols = 10;
	rows = 20;
	x = 1;
	y = 0;
	moveX = 0;
	moveY = 0;
	stableMatrix: number[][] = [];
	currentTetrimino: Tetrimino | null = null;
	currentVariation: number = 0;
	currentMovementInterval: NodeJS.Timeout | null = null;

	constructor(props: Props) {
		super(props);
		this.stableMatrix = this.createMatrix();
		this.state = { matrix: this.stableMatrix, cleanRows: [] };
	}

	componentDidMount() {
		window.addEventListener("keydown", (e: KeyboardEvent) => {
			switch (e.key) {
				case "ArrowRight": {
					this.moveX = 1;
					this.moveY = 0;
					this.drawMatrix();
					break;
				}
				case "ArrowLeft": {
					this.moveX = -1;
					this.moveY = 0;
					this.drawMatrix();
					break;
				}
				case "ArrowDown": {
					this.moveX = 0;
					this.moveY = 1;
					this.drawMatrix();
					break;
				}
				case "ArrowUp": {
					this.rotateTetrimino();
					this.moveX = 0;
					this.moveY = 0;
					this.drawMatrix();
					break;
				}
				case " ": {
					this.hardDrop();
					break;
				}
			}
		});
	}

	createMatrix = (): number[][] => {
		return [...new Array(this.rows)].map(() => [...new Array(this.cols)].map(() => 0));
	};

	checkCollision = (): boolean => {
		if (!this.currentTetrimino) return false;

		let collision = false;

		const mockVariations = this.currentTetrimino.createVariations(this.x + this.moveX, this.y + this.moveY, false);

		for (let i = 0; i < this.currentTetrimino.variations.length; i++) {
			console.log(`move X: ${this.moveX} | Y: ${this.moveY}`);
			const c = this.currentTetrimino.variations[this.currentVariation][i];
			const cMoved = mockVariations[this.currentVariation][i];

			if (
				((c[0] <= this.rows - 1 && this.stableMatrix[c[0]][c[1]] > 0) || cMoved[0] > this.rows - 1) &&
				this.moveY === 1
			) {
				console.log("locked");
				this.stableMatrix = deepCopy(this.state.matrix);

				this.currentTetrimino = null; // clearing the current tetrimino
				setTimeout(this.startTetrimino, 100);
				collision = true;
				break;
			}

			if (
				(cMoved[0] > this.rows - 1 || this.stableMatrix[cMoved[0]][cMoved[1]] > 0) &&
				this.currentMovementInterval !== null
			) {
				console.log("collided");
				collision = true;
			}

			if (cMoved[1] > this.cols - 1 || cMoved[1] < 0) {
				collision = true;
			}

			if (collision) {
				this.moveX = 0;
				this.moveY = 0;
				break;
			}
		}

		if (collision) return false;

		return true;
	};

	lineClear = () => {
		let matrix = deepCopy(this.stableMatrix) as number[][];

		const cleanRows: number[] = [];
		matrix = matrix.filter((row, i) => {
			const isFull = row.some(x => x === 0);
			if (!isFull) cleanRows.push(i);
			return isFull;
		});

		if (cleanRows.length) {
			this.setState({ cleanRows });
			setTimeout(() => {
				const absentRows = cleanRows.length;
				[...new Array(absentRows)].forEach(() => matrix.unshift([...new Array(this.cols)].map(() => 0)));
				this.stableMatrix = deepCopy(matrix);
				this.setState({ matrix: this.stableMatrix, cleanRows: [] });
				this.drawMatrix();
			}, 300);
		}
	};

	rotateTetrimino = () => {
		let mockPassed = true;
		let mockVarIndex = this.currentVariation + 1 > 3 ? 0 : this.currentVariation + 1;

		if (!this.currentTetrimino) return;

		let mockVariations: number[][][] = this.currentTetrimino.createVariations(this.x, this.y, true);
		let gaps: number[] = [0, 0, 0, 0];

		// creating gaps for rotating, if needed
		for (let i = 0; i < mockVariations[mockVarIndex].length; i++) {
			const c = mockVariations[mockVarIndex][i];
			if (c[1] > this.cols - 1) {
				const xGap = Math.abs(c[1] - this.cols + 1);
				gaps[i] = -xGap;
			} else if (c[1] < 0) {
				const xGap = Math.abs(c[1]);
				gaps[i] = xGap;
			}
		}

		// recreating variations by adding the gaps to X
		mockVariations = this.currentTetrimino.createVariations(this.x + gaps.reduce((a, b) => a + b), this.y, true);
		// if any rotated mino collides with a 1, rotate is not possible
		mockVariations[mockVarIndex].forEach(c => {
			if (this.stableMatrix[c[0]][c[1]] > 0) mockPassed = false;
		});

		if (!mockPassed) return;
		else this.currentVariation = mockVarIndex;

		this.currentTetrimino.variations[this.currentVariation].forEach(c => {
			if (c[1] > this.cols - 1) {
				const xGap = Math.abs(c[1] - this.cols + 1);
				this.x -= xGap;
			} else if (c[1] < 0) {
				const xGap = Math.abs(c[1]);
				this.x += xGap;
			}
		});
	};

	hardDrop = () => {
		[...new Array(this.rows)].forEach(() => {
			this.moveY = 1;
			this.drawMatrix();
		});
	};

	addMovement = () => {
		this.x += this.moveX;
		this.y += this.moveY;
		this.moveX = 0;
		this.moveY = 0;
	};

	drawMatrix = () => {
		if (!this.currentTetrimino) return;
		this.currentTetrimino.createVariations(this.x, this.y, false);

		console.log("drawing matrix");
		if (!this.checkCollision()) {
			// if there is collision
			this.lineClear();
			return;
		}

		this.addMovement();

		this.currentTetrimino.createVariations(this.x, this.y, false);

		const newMatrix = deepCopy(this.stableMatrix) as number[][]; // clearing the moving part

		this.currentTetrimino.variations[this.currentVariation].forEach(c => {
			if (this.currentTetrimino) newMatrix[c[0]][c[1]] = this.currentTetrimino.index;
		});

		this.setState({ matrix: newMatrix });
	};

	selectRandomTetrimino = () => {
		const tetriminos = ["t", "j", "l", "z", "s", "o", "i"];
		const randomI = Math.floor(Math.random() * tetriminos.length);

		return new Tetrimino(tetriminos[randomI]);
	};

	startTetrimino = () => {
		if (this.currentMovementInterval !== null) {
			clearInterval(this.currentMovementInterval);
		}

		this.y = 1;
		this.currentTetrimino = this.selectRandomTetrimino();
		this.currentTetrimino.createVariations(this.x, this.y, false);
		this.drawMatrix();

		// creating a interval for moving down down down
		this.currentMovementInterval = setInterval(() => {
			this.moveY = 1; // moving down
			this.drawMatrix();
		}, 1000);
	};

	render() {
		const { matrix } = this.state;
		return (
			<>
				<div className="matrix">
					{matrix.flat(Infinity).map((val, i) => (
						<div key={i}>{val}</div>
					))}
				</div>
				<div className="matrix">
					{matrix.flat(Infinity).map((val, i) => (
						<div
							className={`
								mino 
								${
									this.state.cleanRows.indexOf(Math.floor(i / 10)) > -1
										? "cleanAnimation"
										: val > 0
										? Templates.colorList[val as number]
										: ""
								}
							`}
							key={i}
						/>
					))}
				</div>
				<button onClick={this.startTetrimino}>Start</button>
			</>
		);
	}
}

export default Matrix;
