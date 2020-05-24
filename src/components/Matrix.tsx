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
	showcaseMatrix: Array<Array<Number>>;
	holdMatrix: Array<Array<Number>>;
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
	currentMovementInterval: NodeJS.Timeout | null = null;

	currentVariation: number = 0;
	currentTetrimino: Tetrimino | null = null;
	holdTetrimino: Tetrimino | null = null;
	holdCount: number = 0;
	nextTetrimino: Tetrimino | null = null;

	constructor(props: Props) {
		super(props);
		this.stableMatrix = this.createMatrix(this.cols, this.rows);
		const fourXfourMatrix = this.createMatrix(4, 4);
		this.state = {
			matrix: this.stableMatrix,
			cleanRows: [],
			showcaseMatrix: fourXfourMatrix,
			holdMatrix: fourXfourMatrix,
		};
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
				case "c": {
					this.holdCurrentTetrimino();
					break;
				}
			}
		});

		this.selectRandomTetrimino(); // selecting the first tetrimino
	}

	createMatrix = (cols: number, rows: number): number[][] => {
		return [...new Array(rows)].map(() => [...new Array(cols)].map(() => 0));
	};

	lockTetrimino = () => {
		this.stableMatrix = deepCopy(this.state.matrix);

		this.currentTetrimino = null; // clearing the current tetrimino
		setTimeout(() => {
			this.startTetrimino();
			this.holdCount = 0;
		}, 100);
	};

	checkCollision = (): boolean => {
		if (!this.currentTetrimino) return false;

		let collision = false;

		const mockVariations = this.currentTetrimino.createVariations(this.x + this.moveX, this.y + this.moveY, false);

		for (let i = 0; i < this.currentTetrimino.variations.length; i++) {
			const c = this.currentTetrimino.variations[this.currentVariation][i];
			const cMoved = mockVariations[this.currentVariation][i];

			if (
				((c[0] <= this.rows - 1 && this.stableMatrix[c[0]][c[1]] > 0) || cMoved[0] > this.rows - 1) &&
				this.moveY === 1
			) {
				this.lockTetrimino();
				collision = true;
				break;
			}

			if (
				(cMoved[0] > this.rows - 1 || this.stableMatrix[cMoved[0]][cMoved[1]] > 0) &&
				this.currentMovementInterval !== null
			) {
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
		this.nextTetrimino = new Tetrimino(tetriminos[randomI]);
		this.nextTetrimino.createVariations(1, 1, false);

		const showcaseMatrix = this.createMatrix(4, 4);
		this.nextTetrimino.variations[0].forEach(c => {
			if (this.nextTetrimino) showcaseMatrix[c[0]][c[1]] = this.nextTetrimino.index;
		});
		this.setState({ showcaseMatrix });
	};

	holdCurrentTetrimino = () => {
		if (this.holdCount !== 0) return;
		this.holdCount++;
		if (!this.currentTetrimino) return;
		const hold = new Tetrimino(this.currentTetrimino.type);
		this.currentVariation = 4;
		this.rotateTetrimino();

		if (!this.holdTetrimino) this.startTetrimino();
		else this.startTetrimino(true);

		this.holdTetrimino = hold;
		this.holdTetrimino.createVariations(1, 1, false);

		const holdMatrix = this.createMatrix(4, 4);
		this.holdTetrimino.variations[0].forEach(c => {
			if (this.holdTetrimino) holdMatrix[c[0]][c[1]] = this.holdTetrimino.index;
		});
		this.setState({ holdMatrix });
	};

	startTetrimino = (fromHold?: boolean) => {
		if (!this.nextTetrimino) return;
		if (this.currentMovementInterval !== null) {
			clearInterval(this.currentMovementInterval);
		}

		this.y = 1;
		if (fromHold && this.holdTetrimino) this.currentTetrimino = this.holdTetrimino;
		// setting current tetrimino to holded tetrimino
		else {
			this.currentTetrimino = this.nextTetrimino; // setting current tetrimino to next tetrimino
			this.selectRandomTetrimino(); // setting the next tetrimino
		}
		this.currentTetrimino.createVariations(this.x, this.y, false);
		this.drawMatrix();

		// creating a interval for moving down down down
		this.currentMovementInterval = setInterval(() => {
			this.moveY = 1; // moving down
			this.drawMatrix();
		}, 1000);
	};

	render() {
		const { matrix, showcaseMatrix, holdMatrix } = this.state;

		return (
			<div className="mainArea">
				{/* <div className="matrix">
					{matrix.flat(Infinity).map((val, i) => (
						<div key={i}>{val}</div>
					))}
				</div> */}
				<div className="holdMatrix">
					<h3>Hold Tetrimino:</h3>
					{holdMatrix.flat(Infinity).map((val, i) => (
						<div className={`${val > 0 ? Templates.colorList[val as number] : ""}`} key={i} />
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
				<button onClick={() => this.startTetrimino()}>Start</button>
				<div className="showcaseMatrix">
					<h3>Next Tetrimino:</h3>
					{showcaseMatrix.flat(Infinity).map((val, i) => (
						<div className={`${val > 0 ? Templates.colorList[val as number] : ""}`} key={i} />
					))}
				</div>
			</div>
		);
	}
}

export default Matrix;
