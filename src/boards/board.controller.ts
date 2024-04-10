// board.controller.ts

import { Controller, Get } from '@nestjs/common';
import { BoardService } from './board.service';
import { Board } from './board.model';

@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  async generateBoard(): Promise<Board> {
    const wordList = ["ride", "cook", "hope", "hurt", "gift", "true", "soft", "bold", "deep", "wish",
           "talk", "wait", "want", "like", "good", "easy", "pink", "rich", "safe", "zoom",
           "play", "read", "fly", "know", "book", "light", "rain", "cold", "open", "close",
           "love", "game", "food", "turn", "come"]
    return this.boardService.generateBoard(11, 11, wordList);
  }
}
