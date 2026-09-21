const BOARD_SIZE = 6;

const boardEl = document.getElementById('board');
const messageEl = document.getElementById('message');
const newPuzzleBtn = document.getElementById('new-puzzle-btn');
const resetBtn = document.getElementById('reset-btn');

let currentPuzzle = null;
let currentBoard = [];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildSolvedBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => randomInt(1, 9))
  );
}

function hasInitialValue(rowIndex, colIndex) {
  return currentPuzzle && currentPuzzle.initialBoard[rowIndex][colIndex] !== '';
}

function getRowSum(board, rowIndex) {
  return board[rowIndex].reduce((sum, value) => {
    if (value === '') {
      return sum;
    }
    return sum + Number(value);
  }, 0);
}

function getColSum(board, colIndex) {
  return board.reduce((sum, row) => {
    const value = row[colIndex];
    if (value === '') {
      return sum;
    }
    return sum + Number(value);
  }, 0);
}

function sanitizeInput(value) {
  if (typeof value !== 'string') {
    return '';
  }
  const digit = value.replace(/[^1-9]/g, '').slice(0, 1);
  return digit || '';
}

function createPuzzle() {
  const solution = buildSolvedBoard();
  const rowTargets = solution.map((row) => row.reduce((sum, value) => sum + value, 0));
  const colTargets = Array.from({ length: BOARD_SIZE }, (_, colIndex) =>
    solution.reduce((sum, row) => sum + row[colIndex], 0)
  );

  const initialBoard = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => '')
  );

  const positions = [];
  for (let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex += 1) {
    for (let colIndex = 0; colIndex < BOARD_SIZE; colIndex += 1) {
      positions.push([rowIndex, colIndex]);
    }
  }

  const revealCount = 18;
  const revealPositions = new Set();

  while (revealPositions.size < revealCount) {
    const index = randomInt(0, positions.length - 1);
    const [rowIndex, colIndex] = positions[index];
    revealPositions.add(`${rowIndex}-${colIndex}`);
  }

  revealPositions.forEach((key) => {
    const [rowIndex, colIndex] = key.split('-').map(Number);
    initialBoard[rowIndex][colIndex] = String(solution[rowIndex][colIndex]);
  });

  currentPuzzle = {
    solution,
    rowTargets,
    colTargets,
    initialBoard,
  };
  currentBoard = initialBoard.map((row) => [...row]);
  renderBoard();
  updateMessage();
}

function resetBoard() {
  currentBoard = currentPuzzle.initialBoard.map((row) => [...row]);
  renderBoard();
  updateMessage();
}

function isBoardSolved() {
  if (!currentPuzzle) {
    return false;
  }

  const rowsReady = currentPuzzle.rowTargets.every((target, rowIndex) => {
    const rowFilled = currentBoard[rowIndex].every((value) => value !== '');
    const rowSum = getRowSum(currentBoard, rowIndex);
    return rowFilled && rowSum === target;
  });

  const colsReady = currentPuzzle.colTargets.every((target, colIndex) => {
    const colFilled = currentBoard.every((row) => row[colIndex] !== '');
    const colSum = getColSum(currentBoard, colIndex);
    return colFilled && colSum === target;
  });

  const exactMatch = currentBoard.every((row, rowIndex) =>
    row.every((value, colIndex) => value === String(currentPuzzle.solution[rowIndex][colIndex]))
  );

  return rowsReady && colsReady && exactMatch;
}

function updateMessage() {
  if (!currentPuzzle) {
    return;
  }

  if (isBoardSolved()) {
    messageEl.textContent = 'クリア！ すべての合計が一致しました。';
    messageEl.className = 'message success';
    return;
  }

  const hasAnyValue = currentBoard.some((row) => row.some((value) => value !== ''));
  if (!hasAnyValue) {
    messageEl.textContent = '空いているマスを埋めてください';
    messageEl.className = 'message';
    return;
  }

  const rowMismatch = currentPuzzle.rowTargets.some((target, rowIndex) => {
    const rowFilled = currentBoard[rowIndex].every((value) => value !== '');
    return rowFilled && getRowSum(currentBoard, rowIndex) !== target;
  });

  const colMismatch = currentPuzzle.colTargets.some((target, colIndex) => {
    const colFilled = currentBoard.every((row) => row[colIndex] !== '');
    return colFilled && getColSum(currentBoard, colIndex) !== target;
  });

  if (rowMismatch || colMismatch) {
    messageEl.textContent = '合計が違います。各行・各列を見直してください。';
    messageEl.className = 'message error';
    return;
  }

  messageEl.textContent = 'いい感じです。まだ完成していません。';
  messageEl.className = 'message';
}

function renderBoard() {
  boardEl.innerHTML = '';

  const blank = document.createElement('div');
  blank.className = 'clue';
  boardEl.appendChild(blank);

  currentPuzzle.colTargets.forEach((target) => {
    const clue = document.createElement('div');
    clue.className = 'clue top';
    clue.textContent = target;
    boardEl.appendChild(clue);
  });

  for (let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex += 1) {
    const rowClue = document.createElement('div');
    rowClue.className = 'clue';
    rowClue.textContent = currentPuzzle.rowTargets[rowIndex];
    boardEl.appendChild(rowClue);

    for (let colIndex = 0; colIndex < BOARD_SIZE; colIndex += 1) {
      const value = currentBoard[rowIndex][colIndex];
      const fixed = hasInitialValue(rowIndex, colIndex);
      const cell = document.createElement('input');
      cell.type = 'text';
      cell.maxLength = 1;
      cell.inputMode = 'numeric';
      cell.pattern = '[1-9]';
      cell.className = 'cell';
      cell.value = value;
      cell.setAttribute('aria-label', `行${rowIndex + 1}列${colIndex + 1}`);

      if (fixed) {
        cell.readOnly = true;
        cell.disabled = true;
        cell.classList.add('fixed');
      }

      if (!fixed) {
        cell.addEventListener('input', (event) => {
          const nextValue = sanitizeInput(event.target.value);
          event.target.value = nextValue;
          currentBoard[rowIndex][colIndex] = nextValue;
          renderBoard();
          updateMessage();
        });
      }

      boardEl.appendChild(cell);
    }
  }
}

newPuzzleBtn.addEventListener('click', () => {
  createPuzzle();
});

resetBtn.addEventListener('click', () => {
  resetBoard();
});

createPuzzle();
