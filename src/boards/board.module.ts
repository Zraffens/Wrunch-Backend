import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { BoardSchema } from './board.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Board', schema: BoardSchema }]),
  ],
  controllers: [BoardController],
  providers: [BoardService],
})
export class BoardsModule {}