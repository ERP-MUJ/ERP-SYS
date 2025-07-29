import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/server/src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

let app: any;

async function createNestApp() {
  if (!app) {
    app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.enableCors({
      origin: [
        'http://localhost:3000',
        'https://erp-sys-web.vercel.app',
        process.env.NEXT_PUBLIC_APP_URL
      ].filter(Boolean),
      credentials: true,
    });

    await app.init();
  }
  return app;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await createNestApp();
    const expressApp = app.getHttpAdapter().getInstance();

    // Handle the request through NestJS
    return expressApp(req, res);
  } catch (error) {
    console.error('Error in serverless function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
