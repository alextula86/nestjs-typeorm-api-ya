import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePairQuizGameBonus } from './types';
import { PairQuizGameBonus } from './entities';

@Injectable()
export class PairQuizGameBonusRepository {
  constructor(
    @InjectRepository(PairQuizGameBonus)
    private readonly pairQuizGameBonusRepository: Repository<PairQuizGameBonus>,
  ) {}
  async createResultPairQuizGame({
    userId,
    pairQuizGameId,
    bonus,
  }: CreatePairQuizGameBonus): Promise<{ id: string }> {
    const madePairQuizGameBonus = await this.pairQuizGameBonusRepository
      .createQueryBuilder()
      .insert()
      .into(PairQuizGameBonus)
      .values({
        userId,
        pairQuizGameId,
        bonus,
      })
      .returning(['id'])
      .execute();

    return madePairQuizGameBonus.raw[0];
  }
}
