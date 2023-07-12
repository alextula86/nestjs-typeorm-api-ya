import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePairQuizGameBonus, UpdatePairQuizGameBonus } from './types';
import { PairQuizGameBonus } from './entities';

@Injectable()
export class PairQuizGameBonusRepository {
  constructor(
    @InjectRepository(PairQuizGameBonus)
    private readonly pairQuizGameBonusRepository: Repository<PairQuizGameBonus>,
  ) {}
  async createPairQuizGameBonus({
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
  async updatePairQuizGameBonus({
    userId,
    pairQuizGameId,
    bonus,
  }: UpdatePairQuizGameBonus): Promise<boolean> {
    await this.pairQuizGameBonusRepository
      .createQueryBuilder()
      .update(PairQuizGameBonus)
      .set({ bonus })
      .where('userId = :userId', { userId })
      .andWhere('pairQuizGameId = :pairQuizGameId', { pairQuizGameId })
      .execute();

    return true;
  }
}
