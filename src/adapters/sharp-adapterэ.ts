import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class SharpAdapter {
  async metadataFile(buffer: Buffer): Promise<sharp.Metadata> {
    const metadata = await sharp(buffer).metadata();

    return metadata;
  }

  async resizeFile(
    buffer: Buffer,
    width: number,
    height: number,
  ): Promise<Buffer> {
    const resized = await sharp(buffer).resize(width, height).toBuffer();

    return resized;
  }

  async convertToWebP(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer).webp().toBuffer();
  }
}
