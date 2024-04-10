// board.service.ts

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Board, BoardDocument } from './board.model';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BoardService {
  constructor(
    @InjectModel(Board.name) private readonly boardModel: Model<BoardDocument>,
  ) {}
  generateRandomLetter(): string {
    const letters = ['E', 'A', 'R', 'I', 'O', 'T', 'N', 'S', 'L', 'C'];
    const biases = [
      11.1607, 8.4966, 7.5809, 7.5448, 7.1635, 6.9509, 6.6544, 5.7351, 5.4893,
      4.5388,
    ];

    // Calculate the total bias of the provided letters
    const totalBias = biases.reduce((sum, bias) => sum + bias, 0);

    // Calculate the common bias for the remaining letters
    const remainingLetters = 26 - letters.length;
    const commonBias = (100 - totalBias) / remainingLetters;

    // Generate the weighted list of letters
    const weightedLetters = [];
    for (let i = 0; i < letters.length; i++) {
      weightedLetters.push({ letter: letters[i], bias: biases[i] });
    }
    for (let i = 0; i < remainingLetters; i++) {
      weightedLetters.push({ letter: '', bias: commonBias }); // Placeholder for remaining letters
    }

    // Generate a random number between 0 and total bias
    const randomBias = Math.random() * totalBias;

    // Find the letter corresponding to the random bias
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

  shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  canPlaceWord(
    word: string,
    row: number,
    col: number,
    dRow: number,
    dCol: number,
    rows: number,
    cols: number,
  ): boolean {
    return (col + word.length * dCol) <= cols || (row + word.length * dRow) <= rows;
  }

  swapAdjacentCells(
    row: number,
    col: number,
    newBoard: string[][],
  ): string[][] {
    const adjacentCells = [];
    const rows = newBoard.length;
    const cols = newBoard[0].length;
    if (row > 0) adjacentCells.push([row - 1, col]);
    if (row < rows - 1) adjacentCells.push([row + 1, col]);
    if (col > 0) adjacentCells.push([row, col - 1]);
    if (col < cols - 1) adjacentCells.push([row, col + 1]);

    const randomIndex = Math.floor(Math.random() * adjacentCells.length);
    const [adjRow, adjCol] = adjacentCells[randomIndex];
    const temp = newBoard[row][col];
    newBoard[row][col] = newBoard[adjRow][adjCol];
    newBoard[adjRow][adjCol] = temp;

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
    return newBoard;
  }

  placeRandomWord(
    word: string,
    newBoard: string[][],
    rows: number,
    cols: number,
    occupiedPositions: Set<string>,
  ): string[][] {
    let attempts = 0;
    let horBoard = newBoard.slice();
    while (attempts < 1000) {
      const startRow = Math.floor(Math.random() * rows);
      const startCol = Math.floor(Math.random() * cols);
      let isOccupied = false;
      for (let i = 0; i < word.length; i++) {
        if (
          occupiedPositions.has(`${startRow}-${startCol + i}`) &&
          occupiedPositions.has(`${startRow + i}-${startCol}`)
        ) {
          isOccupied = true;
          break;
        }
      }
      if (
        !isOccupied &&
        this.canPlaceWord(word, startRow, startCol, 0, 1, rows, cols)
      ) {
        for (let i = 0; i < word.length; i++) {
          horBoard[startRow][startCol + i] = word[i].toUpperCase();
          occupiedPositions.add(`${startRow}-${startCol + i}`);
        }

        const randomIndex = Math.floor(Math.random() * word.length);
        horBoard = this.swapAdjacentCells(
          startRow,
          startCol + randomIndex,
          horBoard,
        );

        return horBoard;
      } else if (
        !isOccupied &&
        !this.canPlaceWord(word, startRow, startCol, 1, 0, rows, cols)
      ) {
        for (let i = 0; i < word.length; i++) {
          newBoard[startRow + i][startCol] = word[i].toUpperCase();
          occupiedPositions.add(`${startRow + i}-${startCol}`); // Add occupied positions
        }
        const randomIndex = Math.floor(Math.random() * word.length);
        newBoard = this.swapAdjacentCells(
          startRow + randomIndex,
          startCol,
          newBoard,
        );
        return newBoard;
      }
      attempts++;
    }
    console.error('Failed to place word:', word);
    console.log('Failed to place word:', word);
    return newBoard;
  }

  generateBoard(rows: number, cols: number, wordList: string[]): BoardDocument {
    let newBoard = this.createRandomBoard(rows, cols);

    const horizontalWordsCount = Math.floor(Math.random() * 6);
    const verticalWordsCount = wordList.length - horizontalWordsCount;
    const shuffledWords = this.shuffleArray(wordList.slice());

    const occupiedPositions = new Set<string>();
    for (let i = 0; i < horizontalWordsCount; i++) {
      newBoard = this.placeRandomWord(
        shuffledWords[i],
        newBoard,
        rows,
        cols,
        occupiedPositions,
      );
    }

    for (let i = horizontalWordsCount; i < wordList.length; i++) {
      newBoard = this.placeRandomWord(
        shuffledWords[i],
        newBoard,
        rows,
        cols,
        occupiedPositions,
      );
    }

    const grid = newBoard.map((row) =>
      row.map((letter) => {
        const l1 = letter ? letter.toUpperCase() : this.generateRandomLetter().toUpperCase()
        return l1
      }),
    );
    grid.forEach(row => {
      console.log(...row)
    })
    console.log(occupiedPositions)

    const createdBoard = new this.boardModel({ grid, rows, cols });
    createdBoard.save();
    return createdBoard as BoardDocument;
  }
}
