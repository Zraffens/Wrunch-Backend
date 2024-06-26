// board.service.ts

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Board, BoardDocument } from './board.model';
import { Injectable } from '@nestjs/common';
import * as allWordsData from './all_words.json';

@Injectable()
export class BoardService {
  private readonly allWords: Set<string> = new Set(allWordsData);
  constructor(
    @InjectModel(Board.name) private readonly boardModel: Model<BoardDocument>,
  ) {}
  generateRandomLetter(): string {
    const letters = ['E', 'A', 'R', 'I', 'O', 'T', 'N', 'S', 'L', 'C'];
    const biases = [
      11.1607, 8.4966, 7.5809, 7.5448, 7.1635, 6.9509, 6.6544, 5.7351, 5.4893,
      4.5388,
    ];

    const totalBias = biases.reduce((sum, bias) => sum + bias, 0);

    const remainingLetters = 26 - letters.length;
    const commonBias = (100 - totalBias) / remainingLetters;

    const weightedLetters = [];
    for (let i = 0; i < letters.length; i++) {
      weightedLetters.push({ letter: letters[i], bias: biases[i] });
    }
    for (let i = 0; i < remainingLetters; i++) {
      weightedLetters.push({ letter: '', bias: commonBias });
    }

    const randomBias = Math.random() * totalBias;

    let cumulativeBias = 0;
    for (let i = 0; i < weightedLetters.length; i++) {
      cumulativeBias += weightedLetters[i].bias;
      if (randomBias <= cumulativeBias) {
        return weightedLetters[i].letter.toUpperCase();
      }
    }

    // This should never be reached, but just in case
    return '';
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private canPlaceWord(
    word: string,
    row: number,
    col: number,
    dRow: number,
    dCol: number,
    rows: number,
    cols: number,
    occupiedPositions: Set<string>,
  ): boolean {
    if (
      row < 0 ||
      col < 0 ||
      col + word.length * dCol >= cols ||
      row + word.length * dRow >= rows ||
      occupiedPositions.has(`${row}-${col}`)
    ) {
      return false;
    }
    return true;
  }

  private adjacentCells(
    startRow: number,
    startCol: number,
    board: string[][],
    word: string,
    occupiedPositions: Set<string>,
    horizontal: boolean,
  ): { [key: string]: [number, number] } {
    const rows = board.length;
    const cols = board[0].length;
    const wordLength = word.length;
    let adjacentCells: { [key: string]: [number, number] } = {};

    // Iterate over each cell in the word
    for (let i = 0; i < wordLength; i++) {
      const row = horizontal ? startRow : startRow + i;
      const col = horizontal ? startCol + i : startCol;
      // Check adjacent cells for swapping
      // console.log(row, col, word, horizontal);
      if (
        row > 0 &&
        !occupiedPositions.has(`${row - 1}-${col}`) &&
        !(board[row - 1][col] == board[row][col])
      ) {
        adjacentCells[`${row}_${col}`] = [row - 1, col];
      }
      if (
        row < rows - 1 &&
        !occupiedPositions.has(`${row + 1}-${col}`) &&
        !(board[row + 1][col] == board[row][col])
      ) {
        adjacentCells[`${row}_${col}`] = [row + 1, col];
      }
      if (
        col > 0 &&
        !occupiedPositions.has(`${row}-${col - 1}`) &&
        !(board[row][col - 1] == board[row][col])
      ) {
        adjacentCells[`${row}_${col}`] = [row, col - 1];
      }
      if (
        col < cols - 1 &&
        !occupiedPositions.has(`${row}-${col + 1}`) &&
        !(board[row][col + 1] == board[row][col])
      ) {
        adjacentCells[`${row}_${col}`] = [row, col + 1];
      }
    }

    return adjacentCells;
  }

  private swapAdjacentCells(
    row: number,
    col: number,
    newBoard: string[][],
    occupiedPositions: Set<string>,
    adjacentCell: [number, number],
  ): string[][] {
    const rows = newBoard.length;
    const cols = newBoard[0].length;
    const [adjRow, adjCol] = adjacentCell;

    const temp = newBoard[row][col];
    newBoard[row][col] = newBoard[adjRow][adjCol];
    newBoard[adjRow][adjCol] = temp;
    occupiedPositions.add(`${adjRow}-${adjCol}`);
    return newBoard;
  }

  createRandomBoard(rows: number, cols: number): string[][] {
    const newBoard: string[][] = [];
    for (let i = 0; i < rows; i++) {
      newBoard.push([]);
      for (let j = 0; j < cols; j++) {
        newBoard[i][j] = this.generateRandomLetter();
      }
    }
    // console.log(newBoard, 'random board');
    return newBoard;
  }

  placeRandomWord(
    word: string,
    newBoard: string[][],
    rows: number,
    cols: number,
    occupiedPositions: Set<string>,
    placedWords: Set<string>,
    wordsAndPositions: object,
    horizontal: boolean,
  ): string[][] {
    let attempts = 0;
    let horBoard = newBoard.slice();
    while (attempts < 1000) {
      const startRow = Math.floor(Math.random() * rows);
      const startCol = Math.floor(Math.random() * cols);
      console.log(attempts);
      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const row = horizontal ? startRow : startRow + i;
        const col = horizontal ? startCol + i : startCol;

        if (row < 0 || row >= rows || col < 0 || col >= cols) {
          // Out of bounds
          canPlace = false;
          break;
        }

        if (occupiedPositions.has(`${row}-${col}`)) {
          // Cell is occupied
          canPlace = false;
          break;
        }
      }
      if (!canPlace) {
        attempts++;
        continue;
      }
      const adjacent = this.adjacentCells(
        startRow,
        startCol,
        newBoard,
        word,
        occupiedPositions,
        horizontal,
      );
      if (Object.keys(adjacent).length == 0) {
        canPlace = false;
      }
      if (canPlace) {
        // Place the word on the board
        for (let i = 0; i < word.length; i++) {
          const row = horizontal ? startRow : startRow + i;
          const col = horizontal ? startCol + i : startCol;

          horBoard[row][col] = word[i].toUpperCase();
          occupiedPositions.add(`${row}-${col}`);
          wordsAndPositions[word] = {
            position: [startRow, startCol],
            horizontal: horizontal,
          };
        }
        placedWords.add(word);
        const randomIndex = Math.floor(
          Math.random() * Object.keys(adjacent).length,
        );
        const cellCoords = Object.keys(adjacent)[randomIndex];
        const swapCell: string[] = cellCoords.split('_');
        newBoard = this.swapAdjacentCells(
          parseInt(swapCell[0]),
          parseInt(swapCell[1]),
          horBoard,
          occupiedPositions,
          adjacent[cellCoords],
        );
        placedWords.add(word);
        // console.log(newBoard, horBoard)
        return newBoard;
      }
      console.log(attempts);
      attempts++;
    }
    console.log("can't place word: ", word);
    return newBoard;
  }

  private findFormedWords(board: string[][]): [string[][], string[]] {
    const formedWords: string[] = [];
    const numRows = board.length;
    const numCols = board[0].length;
    // console.log('before', board)

    // Check horizontal words
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length - 3; j++) {
        // Start from each cell except the last three
        for (let k = 4; k <= board[i].length - j; k++) {
          // Check all possible lengths from 4 up to the remaining length
          const horizontalWord = board[i].slice(j, j + k).join('');
          // console.log(horizontalWord)
          // console.log(this.allWords.has('rook'))
          if (
            [...this.allWords].includes(horizontalWord.toLowerCase()) &&
            horizontalWord.length > 3
          ) {
            // console.log(horizontalWord, 'inside the if')
            formedWords.push(horizontalWord.toLowerCase());
            for (let l = j; l < j + k; l++) {
              board[i][l] = ''; // Remove the formed word
            }
          }
        }
      }
    }

    // Check vertical words
    for (let j = 0; j < board[0].length; j++) {
      for (let i = 0; i < board.length - 3; i++) {
        // Start from each row except the last three
        for (let k = 4; k <= board.length - i; k++) {
          // Check all possible lengths from 4 up to the remaining length
          let verticalWord = '';
          for (let l = 0; l < k; l++) {
            verticalWord += board[i + l][j];
          }
          // console.log(verticalWord, 'vertical')
          if (
            this.allWords.has(verticalWord.toLowerCase()) &&
            verticalWord.length > 3
          ) {
            formedWords.push(verticalWord.toLowerCase());
            for (let l = 0; l < k; l++) {
              board[i + l][j] = ''; // Remove the formed word
            }
          }
        }
      }
    }
    console.log(formedWords, board);

    return [board, formedWords];
  }

  private fillEmptyCells(board: string[][]): string[][] {
    const newBoard = [...board];
    for (let i = 0; i < newBoard.length; i++) {
      for (let j = 0; j < newBoard[i].length; j++) {
        if (newBoard[i][j] === '') {
          newBoard[i][j] = this.generateRandomLetter();
        }
      }
    }
    return newBoard;
  }

  generateBoard(rows: number, cols: number, wordList: string[]): BoardDocument {
    let newBoard = this.createRandomBoard(rows, cols);
    console.log('gen board func');

    const horizontalWordsCount = Math.floor(Math.random() * 6);
    const verticalWordsCount = wordList.length - horizontalWordsCount;
    const shuffledWords = this.shuffleArray(wordList.slice());

    const occupiedPositions = new Set<string>();
    const placedWords = new Set<string>();
    const wordsAndPositions = new Object();
    for (let i = 0; i < horizontalWordsCount; i++) {
      newBoard = this.placeRandomWord(
        shuffledWords[i],
        newBoard,
        rows,
        cols,
        occupiedPositions,
        placedWords,
        wordsAndPositions,
        true,
      );
    }

    for (let i = horizontalWordsCount; i < wordList.length; i++) {
      newBoard = this.placeRandomWord(
        shuffledWords[i],
        newBoard,
        rows,
        cols,
        occupiedPositions,
        placedWords,
        wordsAndPositions,
        false,
      );
    }
    // console.log(wordsAndPositions);
    // let formedWords: string[]
    // [newBoard, formedWords] = this.findFormedWords(newBoard);

    // while (formedWords.length > 0) {
    //   [newBoard, formedWords] = this.findFormedWords(newBoard);
    //   newBoard = this.fillEmptyCells(newBoard);
    // }

    const grid = newBoard.map((row) =>
      row.map((letter) => {
        const l1 = letter
          ? letter.toUpperCase()
          : this.generateRandomLetter().toUpperCase();
        return l1;
      }),
    );
    console.log('grid', grid);

    const createdBoard = new this.boardModel({
      grid,
      rows,
      cols,
      words: wordsAndPositions,
    });
    createdBoard.save();
    return createdBoard as BoardDocument;
  }
}
