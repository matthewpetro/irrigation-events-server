import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from '@/app.module'
import metadata from './metadata'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true, snapshot: true })
  app.enableShutdownHooks()

  const openApiConfig = new DocumentBuilder()
    .setTitle('Irrigation Events API')
    .setDescription('API to manage irrigation events and programs')
    .setVersion('1.0')
    .build()
  await SwaggerModule.loadPluginMetadata(metadata)
  const document = SwaggerModule.createDocument(app, openApiConfig)
  SwaggerModule.setup('api', app, document)

  await app.listen(3000)
}
bootstrap()
