import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { IntegrationsModel, IntegrationsViewModel } from './types';

@Injectable()
export class IntegrationsQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findIntegrationUsersForBlog(
    userId: string,
    blogId: string,
  ): Promise<IntegrationsViewModel | null> {
    const query = `
      SELECT "id", "code"
      FROM integrations
      WHERE "userId" = '${userId}' AND "blogId" = '${blogId}';
    `;

    const foundIntegration = await this.dataSource.query(query);

    if (isEmpty(foundIntegration)) {
      return null;
    }

    return this._getIntegrationViewModel(foundIntegration[0]);
  }
  _getIntegrationViewModel(integration: IntegrationsModel) {
    return { link: integration.code };
  }
}
