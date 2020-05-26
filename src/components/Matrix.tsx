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

	gameFinished: boolean = false;

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

	checkFinished = () => {
		const isFinished = this.stableMatrix[0].some(x => x > 0);
		if (isFinished) {
			if (this.currentMovementInterval) clearInterval(this.currentMovementInterval);
			this.gameFinished = true;
			console.log("game over");
		}
	};

	checkCollision = (): boolean => {
		if (!this.currentTetrimino) return false;

		let collision = false;

		const mockVariations = this.currentTetrimino.createVariations(this.x + this.moveX, this.y + this.moveY, true);

		for (let i = 0; i < this.currentTetrimino.variations.length; i++) {
			const c = this.currentTetrimino.variations[this.currentVariation][i];
			const cMoved = mockVariations[this.currentVariation][i];

			if (this.moveY === 1) {
				if (c[0] + 1 <= this.rows - 1 && c[0] + 1 >= 0) {
					if (this.stableMatrix[c[0] + 1][c[1]] > 0 && this.stableMatrix[cMoved[0]][cMoved[1]] > 0) {
						this.lockTetrimino();
						collision = true;
						this.moveY = 0;
						break;
					}
				} else if (cMoved[0] > this.rows - 1) {
					this.lockTetrimino();
					collision = true;
					this.moveY = 0;
					break;
				}
			}

			if (Math.abs(this.moveX) === 1 && cMoved[0] <= this.rows - 1 && cMoved[0] >= 0) {
				if (cMoved[1] < 0 || cMoved[1] > this.cols - 1 || this.stableMatrix[cMoved[0]][cMoved[1]] > 0) {
					collision = true;
					this.moveX = 0;
					break;
				}
			}
		}

		return collision;
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

	adjustPosition = (mockVariationIndex: number) => {
		// adjusts the needed gaps for the given variationIndex
		// this method tests if the position os possible for the current tetrimino
		// if possible does the needed changes and adjusts the gaps for tetrimino to fit
		// else return void
		let mockPassed = true;
		if (!this.currentTetrimino) return;
		let mockVariations: number[][][] = this.currentTetrimino.createVariations(this.x, this.y, true);
		let xGaps: number[] = [0, 0, 0, 0];
		let yGaps: number[] = [0, 0, 0, 0];

		// creating gaps for rotating, if needed
		for (let i = 0; i < mockVariations[mockVariationIndex].length; i++) {
			const c = mockVariations[mockVariationIndex][i];
			if (c[1] > this.cols - 1) {
				const xGap = Math.abs(c[1] - this.cols + 1);
				xGaps[i] = -xGap;
			} else if (c[1] < 0) {
				const xGap = Math.abs(c[1]);
				xGaps[i] = xGap;
			}
			if (c[0] < 0) {
				const yGap = Math.abs(c[0]);
				yGaps[i] = yGap;
			} else if (c[0] > this.rows - 1) {
				const yGap = 0; // not creating a gap to avoid players avoid lockdown
				yGaps[i] = yGap;
			}
		}

		// recreating variations by adding the gaps to X
		mockVariations = this.currentTetrimino.createVariations(
			this.x + xGaps.reduce((a, b) => a + b),
			this.y + yGaps.reduce((a, b) => a + b),
			true
		);
		// if any rotated mino collides with a 1, rotate is not possible
		mockVariations[mockVariationIndex].forEach(c => {
			if (
				c[0] > this.rows - 1 ||
				(this.stableMatrix[c[0]][c[1]] !== undefined && this.stableMatrix[c[0]][c[1]] > 0)
			)
				mockPassed = false;
		});

		if (!mockPassed) return;
		this.currentVariation = mockVariationIndex;

		// adding gaps to both axises
		this.x += xGaps.reduce((a, b) => a + b);
		this.y += yGaps.reduce((a, b) => a + b);
	};

	rotateTetrimino = () => {
		let mockVarIndex = this.currentVariation + 1 > 3 ? 0 : this.currentVariation + 1;
		this.adjustPosition(mockVarIndex);
	};

	hardDrop = () => {
		this.moveY = 1;
		[...new Array(this.rows)].forEach(() => {
			if (this.drawMatrix() === 1) {
				return;
			} else this.moveY = 1;
		});
		// below is a different approach which is also good
		// if (!this.currentTetrimino) return;
		// let possibleSteps = 0;
		// for (let index = 1; index < this.rows; index++) {
		// 	let stepPossible = true;
		// 	this.currentTetrimino.createVariations(this.x, this.y + index, true)[this.currentVariation].forEach(c => {
		// 		if (
		// 			this.stableMatrix[c[0]] === undefined ||
		// 			this.stableMatrix[c[0]][c[1]] === undefined ||
		// 			this.stableMatrix[c[0]][c[1]] > 0
		// 		)
		// 			stepPossible = false;
		// 	});
		// 	if (!stepPossible) break;
		// 	else {
		// 		possibleSteps++;
		// 	}
		// }
		// if (possibleSteps > 0) {
		// 	this.y += possibleSteps;
		// 	// this.currentTetrimino.createVariations(this.x, this.y);
		// 	this.drawMatrix();
		// 	this.lockTetrimino();
		// }
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

		this.adjustPosition(this.currentVariation);
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

	adjustStartPosition = () => {
		if (!this.currentTetrimino) return;

		this.y = 0;
		let overflow: number[] | null[] = [null, null];
		this.currentTetrimino.createVariations(this.x, 0, true)[this.currentVariation].forEach(c => {
			if (overflow[0] !== c[0] && c[0] < 0) {
				this.y++;
				overflow[0] = c[0];
			}
			if (overflow[1] !== c[1]) {
				if (c[1] < 0) this.x++;
				else if (c[1] > this.cols - 1) this.x--;
				overflow[1] = c[1];
			}
		});

		this.currentTetrimino.createVariations(this.x, this.y, true)[this.currentVariation].forEach(c => {
			if (this.stableMatrix[c[0]][c[1]] > 0) {
				this.y = -1;
			}
		});
	};

	startTetrimino = (fromHold?: boolean) => {
		if (!this.nextTetrimino) return;
		if (this.currentMovementInterval !== null) {
			clearInterval(this.currentMovementInterval);
		}
		console.log("starting tetrimino", Date.now());
		if (fromHold !== undefined && this.holdTetrimino) this.currentTetrimino = this.holdTetrimino;
		// setting current tetrimino to holded tetrimino
		else {
			this.currentTetrimino = this.nextTetrimino; // setting current tetrimino to next tetrimino
			this.selectRandomTetrimino(); // setting the next tetrimino
		}

		this.adjustStartPosition();

		this.drawMatrix();

		// creating a interval for moving down down down
		this.currentMovementInterval = setInterval(() => {
			this.moveY = 1; // moving down
			this.drawMatrix();
		}, 1000);
	};

	addMovement = () => {
		this.x += this.moveX;
		this.y += this.moveY;
		this.moveX = 0;
		this.moveY = 0;
	};

	drawMatrix = (): number => {
		if (!this.currentTetrimino || this.gameFinished) return -1;
		this.currentTetrimino.createVariations(this.x, this.y);

		if (this.checkCollision()) {
			// if there is collision
			this.lineClear();
			// check if that game is over
			this.checkFinished();
			return 1;
		}

		this.addMovement();

		this.currentTetrimino.createVariations(this.x, this.y);

		const newMatrix = deepCopy(this.stableMatrix) as number[][]; // clearing the moving part

		this.currentTetrimino.variations[this.currentVariation].forEach(c => {
			if (
				this.currentTetrimino &&
				this.stableMatrix[c[0]] !== undefined &&
				this.stableMatrix[c[0]][c[1]] !== undefined
			)
				newMatrix[c[0]][c[1]] = this.currentTetrimino.index;
		});

		this.setState({ matrix: newMatrix });
		return 0;
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
				<button
					onClick={() => {
						if (this.currentMovementInterval) clearInterval(this.currentMovementInterval);
						this.gameFinished = true;
					}}>
					Stop
				</button>
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
