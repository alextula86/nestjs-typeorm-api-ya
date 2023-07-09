import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePairQuizGameResult } from './types';
import { PairQuizGameResult } from './entities';

@Injectable()
export class PairQuizGameResultRepository {
  constructor(
    @InjectRepository(PairQuizGameResult)
    private readonly pairQuizGameResultRepository: Repository<PairQuizGameResult>,
  ) {}
  async createResultPairQuizGame({
    userId,
    pairQuizGameId,
    status,
  }: CreatePairQuizGameResult): Promise<{ id: string }> {
    const madePairQuizGameResult = await this.pairQuizGameResultRepository
      .createQueryBuilder()
      .insert()
      .into(PairQuizGameResult)
      .values({
        userId,
        pairQuizGameId,
        status,
      })
      .returning(['id'])
      .execute();

    return madePairQuizGameResult.raw[0];
  }
}
