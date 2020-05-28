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
	points: number;
}

const initialState: State = {
	gameStatus: "menu",
	matrix: [],
	cleanRows: [],
	showcaseMatrix: [],
	holdMatrix: [],
	points: 0,
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
	tetriminoHint: number[][][] | null = null;
	createHint: boolean = true;
	holdTetrimino: Tetrimino | null = null;
	holdCount: number = 0;
	nextTetrimino: Tetrimino | null = null;
	isHardDrop: boolean = false;

	lineClearCount: number = 0;
	lineClearPerLevel: number = 15;
	level: number = 1;
	minusMsPerLevel: number = 60;
	gameFinished: boolean = false;

	constructor(props: Props) {
		super(props);
		this.state = initialState;
	}

	setupGame = () => {
		this.gameFinished = false;
		this.stableMatrix = this.createMatrix(this.cols, this.rows);
		const fourXfourMatrix = this.createMatrix(4, 4);
		this.setState({
			gameStatus: "",
			matrix: this.stableMatrix,
			cleanRows: [],
			showcaseMatrix: fourXfourMatrix,
			holdMatrix: fourXfourMatrix,
			points: 0,
		});
		this.currentTetrimino = null;
		this.nextTetrimino = null;
		this.selectRandomTetrimino(); // selecting the first tetrimino
	};

	componentDidMount() {
		window.addEventListener("keydown", (e: KeyboardEvent) => {
			// if (e.key === "esc") {
			// 	if (this.state.gameStatus === "playing") this.pauseGame();
			// 	else if (this.state.gameStatus === "paused") this.setState({ gameStatus: "playing" });
			// }
			if (this.state.gameStatus === "playing")
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
						this.rotateTetrimino(1);
						this.moveTetrimino(0, 0); // setting moveX,Y to 0 and resetting lockdowntimer if exists
						break;
					}
					case "x": {
						this.rotateTetrimino(-1);
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

		// this.createTetriminoHint();
		this.drawMatrix();
	};

	rotateTetrimino = (direction: number) => {
		let mockVarIndex =
			this.currentVariation + direction > 3
				? 0
				: this.currentVariation + direction < 0
				? 3
				: this.currentVariation + direction;
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

	createTetriminoHint = () => {
		if (!this.currentTetrimino) return;
		let possibleSteps = 0;
		for (let index = 1; index < this.rows; index++) {
			let stepPossible = true;
			this.currentTetrimino.createVariations(this.x, this.y + index, true)[this.currentVariation].forEach(c => {
				if (
					this.stableMatrix[c[0]] === undefined ||
					this.stableMatrix[c[0]][c[1]] === undefined ||
					this.stableMatrix[c[0]][c[1]] > 0
				)
					stepPossible = false;
			});
			if (!stepPossible) break;
			else {
				possibleSteps++;
			}
		}
		if (possibleSteps > 0) {
			const hintY = this.y + possibleSteps;
			this.tetriminoHint = this.currentTetrimino.createVariations(this.x, hintY, true);
		}
	};

	lockTetrimino = () => {
		this.lockdownActive = false;
		this.lockdownTimer = null;

		if (!this.checkCollision(false)) return;

		this.moveY = 0;
		const newMatrix = (deepCopy(this.state.matrix) as number[][]).map(row => row.map(x => (x === -1 ? 0 : x)));
		this.stableMatrix = newMatrix;

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
				this.lineClearCount += cleanRows.length;

				const l = Math.floor(this.lineClearCount / this.lineClearPerLevel);
				this.level = l === 0 ? 1 : l;

				const points = this.state.points + cleanRows.length * 100;

				this.setState({ matrix: this.stableMatrix, cleanRows: [], points });
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
			if (c[0] < this.rows - 1 && c[0] > 0 && c[1] < this.cols - 1 && c[0] > 0) {
				if (this.stableMatrix[c[0]][c[1]] > 0) {
					yGaps[i] = this.y - c[0];
					xGaps[i] = this.x - c[1];
				}
			}

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
				const yGap = -1;
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
				c[1] < 0 ||
				c[1] > this.cols - 1 ||
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
		this.createHint = true;
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
		}, 1000 - this.level * this.minusMsPerLevel);
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

		// drawing the tetrimino
		this.currentTetrimino.variations[this.currentVariation].forEach(c => {
			if (
				this.currentTetrimino &&
				this.stableMatrix[c[0]] !== undefined &&
				this.stableMatrix[c[0]][c[1]] !== undefined
			)
				newMatrix[c[0]][c[1]] = this.currentTetrimino.index;
		});

		// creating the hint
		if (this.createHint && !this.isHardDrop) this.createTetriminoHint();
		else this.tetriminoHint = null;

		// drawing the tetrimino hint
		if (this.tetriminoHint) {
			// checking if the real tetrimino is directly above hint
			// if above stop creating hint
			this.tetriminoHint[this.currentVariation].forEach(c => {
				if (c[0] - 1 >= 0 && newMatrix[c[0] - 1][c[1]] > 0) this.createHint = false;
			});
			if (this.createHint)
				this.tetriminoHint[this.currentVariation].forEach(c => {
					if (
						this.currentTetrimino &&
						this.stableMatrix[c[0]] !== undefined &&
						this.stableMatrix[c[0]][c[1]] !== undefined &&
						this.createHint
					)
						newMatrix[c[0]][c[1]] = -1;
				});
		}

		this.setState({ matrix: newMatrix });
		return 0;
	};

	startGame = () => {
		this.setupGame();
		this.setState({ gameStatus: "playing" });
		this.startTetrimino();
	};

	render() {
		const { matrix, showcaseMatrix, holdMatrix, points, gameStatus, cleanRows } = this.state;

		return (
			<div className="mainArea">
				{gameStatus === "playing" ? (
					<>
						<h2>Points: {points}</h2>
						<div className="holdMatrix">
							<h3>Hold</h3>
							{holdMatrix.flat(Infinity).map((val, i) => (
								<div className={`${val > 0 ? Templates.colorList[val as number] : ""}`} key={i} />
							))}
						</div>
					</>
				) : null}
				<div className="gameArea">
					<div className={`menu ${gameStatus === "playing" ? "hideThis" : ""}`}>
						{gameStatus === "menu" || gameStatus === "finished" ? (
							<>
								<div className="tetrisLogo">
									<h1>TETRIS</h1>
									<div className="emptyBox" />
								</div>
								{gameStatus === "finished" ? (
									<>
										<h1>Game Over!</h1>
										<h2>Points: {points}</h2>
										<h3>You've reached level {this.level}</h3>
									</>
								) : null}
								<button
									className="startButton"
									onClick={() => this.setState({ gameStatus: "starting" })}>
									{gameStatus === "finished" ? "Play Again" : "Play"}
								</button>
								<button className="howToPlay" onClick={() => this.setState({ gameStatus: "howTo" })}>
									How to play?
								</button>
							</>
						) : gameStatus === "starting" ? (
							<Timer onFinish={this.startGame} />
						) : gameStatus === "howTo" ? (
							<>
								<h1>How to play ?</h1>
								<ul className="howToDirections">
									<li>
										<div>
											<span className="key">←</span>
											<span className="key">→</span>
										</div>
										<p>Moves tetriminos left or right</p>
									</li>
									<li>
										<div>
											<span className="key space">SPACE</span>
										</div>
										<p>Hard drop</p>
									</li>
									<li>
										<div>
											<span className="key">↑</span>
										</div>
										<p>Rotates tetrimino clockwise</p>
									</li>
									<li>
										<div>
											<span className="key">x</span>
										</div>
										<p>Rotates tetrimino counter-clockwise</p>
									</li>
									<li>
										<div>
											<span className="key">c</span>
										</div>
										<p>Hold</p>
									</li>
									{/* <li>
										<div>
											<span className="key">esc</span>
										</div>
										<p>Pause</p>
									</li> */}
								</ul>
								<button className="howToPlay" onClick={() => this.setState({ gameStatus: "menu" })}>
									Back
								</button>
							</>
						) : null}
					</div>

					<div className="matrix">
						{matrix.flat(Infinity).map((val, i) => (
							<div
								className={`
								mino 
								${
									cleanRows.indexOf(Math.floor(i / 10)) > -1
										? "cleanAnimation"
										: val > 0
										? Templates.colorList[val as number]
										: val === -1 && this.currentTetrimino
										? `hint-${Templates.colorList[this.currentTetrimino.index]}`
										: ""
								}
							`}
								key={i}
							/>
						))}
					</div>
				</div>
				{gameStatus === "playing" ? (
					<div className="showcaseMatrix">
						<h3>Next</h3>
						{showcaseMatrix.flat(Infinity).map((val, i) => (
							<div className={`${val > 0 ? Templates.colorList[val as number] : ""}`} key={i} />
						))}
					</div>
				) : null}
			</div>
		);
	}
}

export default Matrix;
