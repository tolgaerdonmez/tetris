import React, { Component } from "react";
import "../sass/Matrix.scss";
import Tetrimino, { Templates } from "./Tetrimino/Tetrimino";
import Timer from "./Timer";

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
	gameStatus: string;
}

const initialState: State = {
	gameStatus: "",
	matrix: [],
	cleanRows: [],
	showcaseMatrix: [],
	holdMatrix: [],
};

class Matrix extends Component<Props, State> {
	cols = 10;
	rows = 20;
	x = 5;
	y = 0;
	moveX = 0;
	moveY = 0;
	stableMatrix: number[][] = [];
	currentMovementInterval: NodeJS.Timeout | null = null;
	lockdownTimer: NodeJS.Timeout | null = null;
	lockdownActive: boolean = false;

	currentVariation: number = 0;
	currentTetrimino: Tetrimino | null = null;
	holdTetrimino: Tetrimino | null = null;
	holdCount: number = 0;
	nextTetrimino: Tetrimino | null = null;
	isHardDrop: boolean = false;

	gameFinished: boolean = false;

	constructor(props: Props) {
		super(props);
		this.state = initialState;
	}

	setupGame = () => {
		this.stableMatrix = this.createMatrix(this.cols, this.rows);
		const fourXfourMatrix = this.createMatrix(4, 4);
		this.setState({
			gameStatus: "",
			matrix: this.stableMatrix,
			cleanRows: [],
			showcaseMatrix: fourXfourMatrix,
			holdMatrix: fourXfourMatrix,
		});

		this.selectRandomTetrimino(); // selecting the first tetrimino
	};

	componentDidMount() {
		window.addEventListener("keydown", (e: KeyboardEvent) => {
			switch (e.key) {
				case "ArrowRight": {
					this.moveTetrimino(1, 0);
					break;
				}
				case "ArrowLeft": {
					this.moveTetrimino(-1, 0);
					break;
				}
				case "ArrowDown": {
					this.moveTetrimino(0, 1);
					break;
				}
				case "ArrowUp": {
					this.rotateTetrimino();
					this.moveTetrimino(0, 0); // setting moveX,Y to 0 and resetting lockdowntimer if exists
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
	}

	createMatrix = (cols: number, rows: number): number[][] => {
		return [...new Array(rows)].map(() => [...new Array(cols)].map(() => 0));
	};

	moveTetrimino = (x: number, y: number) => {
		if (this.lockdownActive) this.resetLockdown();

		this.moveX = x;
		this.moveY = y;
		this.drawMatrix();
	};

	rotateTetrimino = () => {
		let mockVarIndex = this.currentVariation + 1 > 3 ? 0 : this.currentVariation + 1;
		this.adjustPosition(mockVarIndex);
	};

	hardDrop = () => {
		this.isHardDrop = true;
		this.moveY = 1;
		[...new Array(this.rows)].forEach(() => {
			if (this.drawMatrix() !== 0) return;
			else this.moveY = 1;
		});
		this.isHardDrop = false;
	};

	lockTetrimino = () => {
		this.lockdownActive = false;
		this.lockdownTimer = null;

		if (!this.checkCollision(false)) return;

		this.moveY = 0;
		this.stableMatrix = deepCopy(this.state.matrix);

		this.currentTetrimino = null; // clearing the current tetrimino
		setTimeout(() => {
			this.startTetrimino();
			this.holdCount = 0;
		}, 100);

		// if there is collision
		this.lineClear();
		// check if that game is over
		this.checkFinished();
	};

	resetLockdown = () => {
		if (!this.lockdownTimer) return;
		// if there is a lockdown timer, clears it then restarts
		clearTimeout(this.lockdownTimer);
		this.startLockdown();
		if (!this.lockdownActive) clearTimeout(this.lockdownTimer);
	};

	startLockdown = () => {
		if (this.isHardDrop) this.lockTetrimino();
		else {
			this.lockdownActive = true;
			this.lockdownTimer = setTimeout(this.lockTetrimino, 500);
		}
	};

	checkFinished = () => {
		const isFinished = this.stableMatrix[0].some(x => x > 0);
		if (isFinished) {
			if (this.currentMovementInterval) clearInterval(this.currentMovementInterval);
			this.gameFinished = true;
			this.setState({ gameStatus: "finished" });
		}
	};

	checkCollision = (lock: boolean = true): boolean => {
		if (!this.currentTetrimino) return false;

		let collision = false;

		const mockVariations = this.currentTetrimino.createVariations(this.x + this.moveX, this.y + this.moveY, true);

		for (let i = 0; i < this.currentTetrimino.variations.length; i++) {
			const c = this.currentTetrimino.variations[this.currentVariation][i];
			const cMoved = mockVariations[this.currentVariation][i];

			if (this.moveY === 1) {
				if (c[0] + 1 <= this.rows - 1 && c[0] + 1 >= 0) {
					if (this.stableMatrix[c[0] + 1][c[1]] > 0 && this.stableMatrix[cMoved[0]][cMoved[1]] > 0) {
						if (lock) this.startLockdown();
						collision = true;
						break;
					}
				} else if (cMoved[0] > this.rows - 1) {
					if (lock) this.startLockdown();
					collision = true;
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

	adjustPosition = (mockVariationIndex: number): boolean => {
		// adjusts the needed gaps for the given variationIndex
		// this method tests if the position os possible for the current tetrimino
		// if possible does the needed changes and adjusts the gaps for tetrimino to fit
		// else returns true on success
		let mockPassed = true;
		if (!this.currentTetrimino) return false;
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

		if (!mockPassed) return false;
		this.currentVariation = mockVariationIndex;

		// adding gaps to both axises
		this.x += xGaps.reduce((a, b) => a + b);
		this.y += yGaps.reduce((a, b) => a + b);

		return true;
	};

	selectRandomTetrimino = () => {
		const tetriminos = ["t", "j", "l", "z", "s", "o", "i"];
		let randomI = 0;
		while (true) {
			randomI = Math.floor(Math.random() * tetriminos.length);
			if (!this.currentTetrimino) break;
			if (tetriminos[randomI] !== this.currentTetrimino.type) break;
		}
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
		if (this.currentMovementInterval) clearInterval(this.currentMovementInterval);
		if (!this.nextTetrimino) return;

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

		if (this.checkCollision()) return 1;

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

	startGame = () => {
		this.setupGame();
		this.setState({ gameStatus: "playing" });
		this.startTetrimino();
	};

	render() {
		const { matrix, showcaseMatrix, holdMatrix } = this.state;

		return (
			<div className="mainArea">
				<div className="holdMatrix">
					<h3>Hold Box</h3>
					{holdMatrix.flat(Infinity).map((val, i) => (
						<div className={`${val > 0 ? Templates.colorList[val as number] : ""}`} key={i} />
					))}
				</div>
				<div className="gameArea">
					<div className={`menu ${this.state.gameStatus === "playing" ? "hideThis" : ""}`}>
						{this.state.gameStatus === "" || this.state.gameStatus === "finished" ? (
							<>
								<div className="tetrisLogo">
									<h1>TETRIS</h1>
									<div className="emptyBox" />
								</div>
								{this.state.gameStatus === "finished" ? <h1>Game Over!</h1> : null}
								<button
									className="startButton"
									onClick={() => this.setState({ gameStatus: "starting" })}>
									{this.state.gameStatus === "finished" ? "Play Again" : "Play"}
								</button>
							</>
						) : this.state.gameStatus === "starting" ? (
							<Timer onFinish={this.startGame} />
						) : null}
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
				</div>
				<div className="showcaseMatrix">
					<h3>Next</h3>
					{showcaseMatrix.flat(Infinity).map((val, i) => (
						<div className={`${val > 0 ? Templates.colorList[val as number] : ""}`} key={i} />
					))}
				</div>
			</div>
		);
	}
}

export default Matrix;
