import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BoardsModule } from './boards/board.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://127.0.0.1:27017/boards', {
    dbName: 'boards',
  }), BoardsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
