class GameLogic {
  static checkWinner(board, gameType = 'tic-tac-toe') {
    switch (gameType) {
      case 'tic-tac-toe':
        return this.checkTicTacToeWinner(board);
      case 'connect-four':
        return this.checkConnectFourWinner(board);
      case 'checkers':
        return this.checkCheckersWinner(board);
      default:
        return this.checkTicTacToeWinner(board);
    }
  }

  static checkTicTacToeWinner(board) {
    const lines = [
      // Rows
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      // Columns
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      // Diagonals
      [0, 4, 8], [2, 4, 6]
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: line };
      }
    }

    return null;
  }

  static checkConnectFourWinner(board) {
    const rows = 6;
    const cols = 7;

    // Check horizontal
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col <= cols - 4; col++) {
        const line = [
          board[row * cols + col],
          board[row * cols + col + 1],
          board[row * cols + col + 2],
          board[row * cols + col + 3]
        ];
        if (line.every(cell => cell && cell === line[0])) {
          return { winner: line[0], line: [row * cols + col, row * cols + col + 1, row * cols + col + 2, row * cols + col + 3] };
        }
      }
    }

    // Check vertical
    for (let row = 0; row <= rows - 4; row++) {
      for (let col = 0; col < cols; col++) {
        const line = [
          board[row * cols + col],
          board[(row + 1) * cols + col],
          board[(row + 2) * cols + col],
          board[(row + 3) * cols + col]
        ];
        if (line.every(cell => cell && cell === line[0])) {
          return { winner: line[0], line: [row * cols + col, (row + 1) * cols + col, (row + 2) * cols + col, (row + 3) * cols + col] };
        }
      }
    }

    // Check diagonal (positive slope)
    for (let row = 0; row <= rows - 4; row++) {
      for (let col = 0; col <= cols - 4; col++) {
        const line = [
          board[row * cols + col],
          board[(row + 1) * cols + col + 1],
          board[(row + 2) * cols + col + 2],
          board[(row + 3) * cols + col + 3]
        ];
        if (line.every(cell => cell && cell === line[0])) {
          return { winner: line[0], line: [row * cols + col, (row + 1) * cols + col + 1, (row + 2) * cols + col + 2, (row + 3) * cols + col + 3] };
        }
      }
    }

    // Check diagonal (negative slope)
    for (let row = 3; row < rows; row++) {
      for (let col = 0; col <= cols - 4; col++) {
        const line = [
          board[row * cols + col],
          board[(row - 1) * cols + col + 1],
          board[(row - 2) * cols + col + 2],
          board[(row - 3) * cols + col + 3]
        ];
        if (line.every(cell => cell && cell === line[0])) {
          return { winner: line[0], line: [row * cols + col, (row - 1) * cols + col + 1, (row - 2) * cols + col + 2, (row - 3) * cols + col + 3] };
        }
      }
    }

    return null;
  }

  static checkCheckersWinner(board) {
    // Simplified checkers logic - count pieces
    const redPieces = board.filter(cell => cell === 'red').length;
    const blackPieces = board.filter(cell => cell === 'black').length;

    if (redPieces === 0) return { winner: 'black' };
    if (blackPieces === 0) return { winner: 'red' };

    return null;
  }

  static isValidMove(board, position, gameType = 'tic-tac-toe') {
    switch (gameType) {
      case 'tic-tac-toe':
        return this.isValidTicTacToeMove(board, position);
      case 'connect-four':
        return this.isValidConnectFourMove(board, position);
      case 'checkers':
        return this.isValidCheckersMove(board, position);
      default:
        return this.isValidTicTacToeMove(board, position);
    }
  }

  static isValidTicTacToeMove(board, position) {
    return position >= 0 && position < 9 && !board[position];
  }

  static isValidConnectFourMove(board, col) {
    const rows = 6;
    const cols = 7;
    
    if (col < 0 || col >= cols) return false;
    
    // Check if column is full
    return !board[col]; // Simplified - assumes board is 1D array
  }

  static isValidCheckersMove(board, from, to) {
    // Simplified checkers move validation
    return from >= 0 && from < 32 && to >= 0 && to < 32 && !board[to];
  }

  static isDraw(board, gameType = 'tic-tac-toe') {
    switch (gameType) {
      case 'tic-tac-toe':
        return board.every(cell => cell !== null);
      case 'connect-four':
        return board.every(cell => cell !== null);
      case 'checkers':
        // Check for stalemate conditions
        return false; // Simplified
      default:
        return board.every(cell => cell !== null);
    }
  }

  static getValidMoves(board, gameType = 'tic-tac-toe') {
    switch (gameType) {
      case 'tic-tac-toe':
        return board.map((cell, index) => cell === null ? index : null).filter(index => index !== null);
      case 'connect-four':
        const cols = 7;
        return Array.from({ length: cols }, (_, i) => i).filter(col => !board[col]);
      case 'checkers':
        return []; // Complex logic for checkers
      default:
        return board.map((cell, index) => cell === null ? index : null).filter(index => index !== null);
    }
  }

  static getGameStats(board, gameType = 'tic-tac-toe') {
    const stats = {
      totalMoves: board.filter(cell => cell !== null).length,
      emptySpaces: board.filter(cell => cell === null).length,
      gameType: gameType
    };

    switch (gameType) {
      case 'tic-tac-toe':
        stats.xMoves = board.filter(cell => cell === 'X').length;
        stats.oMoves = board.filter(cell => cell === 'O').length;
        break;
      case 'connect-four':
        stats.redMoves = board.filter(cell => cell === 'red').length;
        stats.yellowMoves = board.filter(cell => cell === 'yellow').length;
        break;
    }

    return stats;
  }
}

module.exports = GameLogic; 