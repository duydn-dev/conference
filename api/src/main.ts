import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  try {
    console.log('Starting NestJS application...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: true,
    });
    console.log('App created successfully');
    
    // Use Winston logger
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
    console.log('Logger configured');
    
    // Serve static files from uploads directory
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads/',
    });
    console.log('Static assets configured');
    
    // Enable CORS for frontend
    app.enableCors();
    console.log('CORS enabled');
    
    // Configure WebSocket adapter for Socket.IO
    app.useWebSocketAdapter(new IoAdapter(app));
    console.log('WebSocket adapter configured');

    const config = new DocumentBuilder()
      .setTitle('Conference API')
      .setDescription('Conference backend API (NestJS + TypeORM, DB-first)')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    console.log('Swagger configured');

    const port = process.env.PORT ?? 3001;
    console.log(`Starting server on port ${port}...`);
    
    // Add timeout to detect if listen is hanging
    const listenPromise = app.listen(port);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Server listen timeout after 10 seconds')), 10000);
    });
    
    try {
      await Promise.race([listenPromise, timeoutPromise]);
      console.log(`Application is running on: http://localhost:${port}`);
    } catch (error) {
      console.error('Listen error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}
bootstrap();
