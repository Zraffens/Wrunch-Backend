// board.controller.ts

import { Controller, Get } from '@nestjs/common';
import { BoardService } from './board.service';
import { Board } from './board.model';
import * as words from './4_letter_words.json'


@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  async generateBoard(): Promise<Board> {
    // const rawData = fs.readFileSync('4_letter_words.json', 'utf-8');

    // Parse JSON data into a JavaScript object
    const selectedWords = this.selectRandomWords(words.words, 20);
    // const wordList = ["ride", "cook", "hope", "hurt", "gift", "true", "soft", "bold", "deep", "wish",
    //        "talk", "wait", "want", "like", "good", "easy", "pink", "rich", "safe", "zoom",
    //        "play", "read", "fly", "know", "book", "light", "rain", "cold", "open", "close",
    //  "love", "game", "food", "turn", "come"]
    return this.boardService.generateBoard(11, 11, selectedWords);
  }

  selectRandomWords(wordList: string[], count: number): string[] {
    const selectedWords: string[] = [];
    const totalWords = wordList.length;

    // Randomly select words until the desired count is reached
    while (selectedWords.length < count) {
      const randomIndex = Math.floor(Math.random() * totalWords);
      const word = wordList[randomIndex];
      // Ensure the word is not already selected
      if (!selectedWords.includes(word)) {
        selectedWords.push(word);
      }
    }

    return selectedWords;
  }
}
