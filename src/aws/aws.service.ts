/// <reference types="multer" />
import { Injectable } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class AwsService {
  private s3 = new S3Client({
    region: "us-east-2",
    credentials: {
      accessKeyId: process.env.acceskey_bucket!,
      secretAccessKey: process.env.secretkey_bucket!,
    },
  });

  private readonly bucket = "nest-bus-test";

  /** Sube el archivo al bucket y regresa la URL pública o la ruta key. */
  async uploadFile(file: Express.Multer.File, folder = 'uploads'): Promise<string> {
    const key = `${folder}/${file.originalname}`;
    const url = `https://nest-bus-test.s3.us-east-2.amazonaws.com/${key}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3.send(command);
    return key; // O puedes retornar `url` si prefieres, pero auth.service espera la key para identidad.
  }

  /** URL temporal de lectura. */
  getPresignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }
}