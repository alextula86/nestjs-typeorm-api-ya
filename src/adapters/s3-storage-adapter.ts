import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

/*
  Идентификатор ключа:
  YCAJEdb8XhF_o9KV5YMkTFmOS
  Ваш секретный ключ:
  YCPJ3KbeYs-mtLcC4_BWPaHJu44-zFo7dfC1W3wv
*/

@Injectable()
export class S3StorageAdapter {
  public s3Client: S3Client;
  constructor() {
    const REGION = 'us-east-1';
    this.s3Client = new S3Client({
      region: REGION,
      endpoint: 'https://storage.yandexcloud.net/',
      credentials: {
        secretAccessKey: 'YCPJ3KbeYs-mtLcC4_BWPaHJu44-zFo7dfC1W3wv',
        accessKeyId: 'YCAJEdb8XhF_o9KV5YMkTFmOS',
      },
    });
  }

  async saveImage(buffer: Buffer, url: string) {
    try {
      const params = {
        Bucket: 'nestjs-typeorm-api-ya',
        // Key: `content/wallpapers/${blogId}/${file.originalname}`, // Оригинальное наименование файла
        Key: url,
        Body: buffer,
        ContentType: 'image/webp', // Принудительный форматирование в webp
      };
      const command = new PutObjectCommand(params);
      const uploadResult: PutObjectCommandOutput = await this.s3Client.send(
        command,
      );
      console.log('uploadResult', uploadResult);
    } catch (error) {
      console.log('s3Client saveWallpaper error', error);
    }

    return null;
  }
}
