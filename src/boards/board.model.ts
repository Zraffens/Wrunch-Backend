
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BoardDocument = Board & Document;

@Schema()
export class Board {
  @Prop({ required: true, type: [[String]] }) // Assuming the board is a 2D array of strings
  grid: string[][];

  @Prop({ required: true })
  rows: number;

  @Prop({ required: true })
  cols: number;

  // Add other properties or methods as needed
}

export const BoardSchema = SchemaFactory.createForClass(Board);
