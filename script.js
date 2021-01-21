// get canvas
const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
// size of square
const grid = 32;
// an array with sequences of figures, at the start - empty
var tetrominoSequence = [];

// with the help of a two-dimensional array we monitor what is in each cell of the playing field
// the size of the field is 10 by 20, and several lines are still outside the visible area
var playfield = [];

// fill the array with empty cells
for (let row = -2; row < 20; row++) {
	playfield[row] = [];
	for (let col = 0; col < 10; col++) {
		playfield[row][col] = 0;
	}
}

// form of each figure
const tetrominos = {
	I: [
		[0, 0, 0, 0],
		[1, 1, 1, 1],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	],
	J: [
		[1, 0, 0],
		[1, 1, 1],
		[0, 0, 0],
	],
	L: [
		[0, 0, 1],
		[1, 1, 1],
		[0, 0, 0],
	],
	O: [
		[1, 1],
		[1, 1],
	],
	S: [
		[0, 1, 1],
		[1, 1, 0],
		[0, 0, 0],
	],
	Z: [
		[1, 1, 0],
		[0, 1, 1],
		[0, 0, 0],
	],
	T: [
		[0, 1, 0],
		[1, 1, 1],
		[0, 0, 0],
	],
};

// color of each figure
const colors = {
	I: "cyan",
	O: "yellow",
	T: "purple",
	S: "green",
	Z: "red",
	J: "blue",
	L: "orange",
};

// counter
let count = 0;
// current figure in game
let tetromino = getNextTetromino();
// we follow the frames of the animation, so that if anything - to stop the game
let rAF = null;
// the flag of the end of the game, at the start - inactive
let gameOver = false;

// The function returns a random number in a given range
// https://stackoverflow.com/a/1527820/2124254
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// сcreate a sequence of figures that will appear in the game
function generateSequence() {
	// figures
	const sequence = ["I", "J", "L", "O", "S", "T", "Z"];
	while (sequence.length) {
		//  randomly find any of them
		const rand = getRandomInt(0, sequence.length - 1);
		const name = sequence.splice(rand, 1)[0];
		// put the selected shape into the game array with sequences
		tetrominoSequence.push(name);
	}
}

// we get the following figure
function getNextTetromino() {
	// if there is no next one, we generate
	if (tetrominoSequence.length === 0) {
		generateSequence();
	}
	// take the first shape from the array
	const name = tetrominoSequence.pop();
	// immediately create the matrix with which we draw the shape
	const matrix = tetrominos[name];
	// I and O start from the middle, the rest - slightly to the left
	const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
	// I starts at line 21 (offset -1) and everyone else starts at line 22 (offset -2)
	const row = name === "I" ? -1 : -2;

	// this is what the function returns
	return {
		name: name, // figure name (L, O, etc.)
		matrix: matrix, // matrix with figure
		row: row, // current line (shapes start behind the visible area of the canvas)
		col: col, // current column
	};
}

// rotate the matrix 90 degrees
// https://codereview.stackexchange.com/a/186834
function rotate(matrix) {
	const N = matrix.length - 1;
	const result = matrix.map((row, i) =>
		row.map((val, j) => matrix[N - j][i])
	);
	// at the input is the matrix, and at the output we also give the matrix
	return result;
}

// we check after the appearance or rotation, whether the matrix (figure)
// can be in this place of the field or it will crawl out of its borders
function isValidMove(matrix, cellRow, cellCol) {
	// check all rows and columns
	for (let row = 0; row < matrix.length; row++) {
		for (let col = 0; col < matrix[row].length; col++) {
			if (
				matrix[row][col] &&
				// if it goes out of the field ...
				(cellCol + col < 0 ||
					cellCol + col >= playfield[0].length ||
					cellRow + row >= playfield.length ||
					// ... or intersects with other shapes
					playfield[cellRow + row][cellCol + col])
			) {
				// then we return that no, it will not work
				return false;
			}
		}
	}
	// and if we have reached this point and have not finished earlier, then everything is fine
	return true;
}

// when the figure finally fell into place
function placeTetromino() {
	// process all rows and columns in the playing field
	for (let row = 0; row < tetromino.matrix.length; row++) {
		for (let col = 0; col < tetromino.matrix[row].length; col++) {
			if (tetromino.matrix[row][col]) {
				// if the edge of the piece after installation crawls out of the field, then the game is over
				if (tetromino.row + row < 0) {
					return showGameOver();
				} // if everything is in order, then we write our figure into the array of the playing field
				playfield[tetromino.row + row][tetromino.col + col] =
					tetromino.name;
			}
		}
	} // check that the filled rows are cleared from bottom to top
	for (let row = playfield.length - 1; row >= 0; ) {
		// if the row is full
		if (playfield[row].every((cell) => !!cell)) {
			// we clear it and lower everything down one cell
			for (let r = row; r >= 0; r--) {
				for (let c = 0; c < playfield[r].length; c++) {
					playfield[r][c] = playfield[r - 1][c];
				}
			}
		} else {
			// go to the next row
			row--;
		}
	} // we get the following figure
	tetromino = getNextTetromino();
}

// show the inscription Game Over
function showGameOver() {
	// stop all animation of the game
	cancelAnimationFrame(rAF);
	// set the end flag
	gameOver = true;
	// draw a black rectangle in the middle of the field
	context.fillStyle = "black";
	context.globalAlpha = 0.75;
	context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
	// write the inscription in white monospaced font in the center
	context.globalAlpha = 1;
	context.fillStyle = "white";
	context.font = "36px monospace";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2);
}

// monitor keystrokes
document.addEventListener("keydown", function (e) {
	// if the game is over, exit immediately
	if (gameOver) return;
	// left and right arrows
	if (
		e.key === "ArrowLeft" ||
		e.key === "Left" ||
		e.key === "ArrowRight" ||
		e.key === "Right"
	) {
		const col =
			e.key === "ArrowLeft" || e.key === "Left"
				? // if to the left, then we decrease the index in the column, if to the right, we increase
				  tetromino.col - 1
				: tetromino.col + 1;
		// if you can walk like that, then remember the current position
		if (isValidMove(tetromino.matrix, tetromino.row, col)) {
			tetromino.col = col;
		}
	}
	// up arrow - turn
	if (e.key === "ArrowUp" || e.key === "Up") {
		// rotate the shape 90 degrees
		const matrix = rotate(tetromino.matrix);
		// if you can walk like that, we remember
		if (isValidMove(matrix, tetromino.row, tetromino.col)) {
			tetromino.matrix = matrix;
		}
	}
	// down arrow - accelerate the fall
	if (e.key === "ArrowDown" || e.key === "Down") {
		// move the shape down one line
		const row = tetromino.row + 1;
		//if there is nowhere else to go down, we remember the new position
		if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
			tetromino.row = row - 1;
			// put in place and look at the filled rows
			placeTetromino();
			return;
		} // remember the line where the figure has become
		tetromino.row = row;
	}
});

// main game loop
function loop() {
	// start animation
	rAF = requestAnimationFrame(loop);
	// clear the canvas
	context.clearRect(0, 0, canvas.width, canvas.height);
	// we draw the playing field taking into account the filled figures
	for (let row = 0; row < 20; row++) {
		for (let col = 0; col < 10; col++) {
			if (playfield[row][col]) {
				const name = playfield[row][col];
				context.fillStyle = colors[name];
				// draw everything one pixel less to get a checkered effect
				context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
			}
		}
  } 
  // draw the current shape
	if (tetromino) {
		// the figure moves down every 35 frames
		if (++count > 35) {
			tetromino.row++;
			count = 0;
			// if the movement is over, draw a shape in the field and check if the lines can be deleted
			if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
				tetromino.row--;
				placeTetromino();
			}
		} // don't forget about the color of the current shape
    context.fillStyle = colors[tetromino.name]; 
    // draw it
		for (let row = 0; row < tetromino.matrix.length; row++) {
			for (let col = 0; col < tetromino.matrix[row].length; col++) {
				if (tetromino.matrix[row][col]) {
					// and again draw one pixel less
					context.fillRect(
						(tetromino.col + col) * grid,
						(tetromino.row + row) * grid,
						grid - 1,
						grid - 1
					);
				}
			}
		}
	}
}

// lets start 🚀
rAF = requestAnimationFrame(loop);
