import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { MakeIntegrationsModel, IntegrationsModel } from './types';

@Injectable()
export class IntegrationsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findIntegrationUserForBlogById(
    userId: string,
    blogId: string,
  ): Promise<IntegrationsModel | null> {
    const query = `
      SELECT "id", "code"
      FROM integrations
      WHERE "userId" = '${userId}' AND "blogId" = '${blogId}';
    `;

    const foundIntegration = await this.dataSource.query(query);

    if (!foundIntegration) {
      return null;
    }

    return foundIntegration[0];
  }
  async createIntegration({
    code,
    userId,
    blogId,
  }: MakeIntegrationsModel): Promise<IntegrationsModel> {
    const query = `
      INSERT INTO integrations ("userId", "blogId", "code")
      VALUES ('${userId}', '${blogId}', '${code}')
      RETURNING *;
    `;

    const madeBan = await this.dataSource.query(query);

    return madeBan[0];
  }
  async updateIntegration(
    code: string,
    userId: string,
    blogId: string,
  ): Promise<boolean> {
    const query = `
      UPDATE integrations
      SET "code" = '${code}'
      WHERE "userId" = '${userId}' AND "blogId" = '${blogId}';
    `;

    await this.dataSource.query(query);

    return true;
  }
}
