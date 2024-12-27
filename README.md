## Aplicação de demonstração integração NestJs com Minio Bucket Server

O intuíto desta aplicação é apresentar um ambiente de desenvolvimento compativel com AWS-S3.
Foi utilizado como base o projeto Open-Source Minio que é um servidor de "Buckets like S3", ou seja, seus métodos nativos funcionam também para o S3.

## Configurações

No arquivo ".env.example" estão as chaves necessárias.
Note que a chave ENV que será responsável pela configuração do ambiente. Se for igual a "development" a aplicação será configruada para conectar no Minio. Já se for "production" será configurada para conectar com o AWS-S3.

No arquivo "src/config/configConstants.ts" estão as constantes utilizadas nos serviços. Se no futuro forem utilizados mais de um tipo de BUCKET suas configurações devem ser adicionadas aqui.

## Como é feita a escolha do provedor?

Em "nestjs-s3-minio/src/providers" estão os arquivos de configuração para tudo acontecer.
No arquivo "minio.ts" são criadas os parâmetros de conexão com escolha de acordo com a chave ENV.

```
function ConfigClientConnectS3Minio() {
  const configService = new ConfigService();

  if (configService.getOrThrow('ENV') === 'development') {
    // Check if environment is development and config service for MINIO Container
    return {
      endPoint: configService.getOrThrow('S3_ENDPOINT'),
      port: 9000,
      useSSL: false,
      accessKey: configService.getOrThrow('S3_ACCESS_KEY'),
      secretKey: configService.getOrThrow('S3_SECRET_KEY'),
    };
  }
  // Environment is production and config service for AWS-S3
  return {
    endPoint: configService.getOrThrow('S3_ENDPOINT'),
    accessKey: configService.getOrThrow('S3_ACCESS_KEY'),
    secretKey: configService.getOrThrow('S3_SECRET_KEY'),
  };
}
```

No arquivo "minio.decorator.ts" é criado o decorator de injeção de dependência para uso no módulos do NestJs.

```
export const MINIO_TOKEN = 'MINIO_INJECT_TOKEN';

export function InjectMinio(): ParameterDecorator {
  return Inject(MINIO_TOKEN);
}
```

No arquivo "minio.module.ts" é criado o módulo para injeção do serviço e conexão com o client escolhido.

```
@Global()
@Module({
  exports: [MINIO_TOKEN],
  providers: [
    {
      inject: [ConfigService],
      provide: MINIO_TOKEN,
      useFactory: async (): Promise<Minio.Client> => {
        const client = new Minio.Client(ConfigClientConnectS3Minio());
        return client;
      },
    },
  ],
})
export class MinioModule {}
```

## Módulo fileBucket

Neste módulo estão o controller e o service da aplicação.
Note que devido a criação do "minio.module.ts" a injeção de dependência no "fileBucket.module.controller.ts" ficou nativa para uso do mesmo nas demais camadas.

No método de upload da imagem foi adicionado um interceptador para verificar a chave do arquivo enviado e um decorador de validação dos parâmetros do arquivo, neste caso tamanho e tipo.

Após a validação é utilizada a lib "Multer". Ela cria um objeto do arquivo enviado. Um dos parâmetros deste objeto é o Buffer, responsável pela "bufferização" do conteudo do arquivo. O Multer também adiciona alguns metadados.

```
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: BUCKET.IMAGES_FILE_SIZE }),
          new FileTypeValidator({ fileType: BUCKET.IMAGE_FILE_TYPE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadImage(file);
  }
```

## Docker Compose

O Servidor do Minio é executado em PORT=9000.

A imagem do mínio utilizada inclui um frontend para gestão dos arquivos que é executada em PORT=9001.

A aplicação NestJs é executada em PORT=3001.
