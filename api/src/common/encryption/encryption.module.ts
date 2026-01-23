import { Module } from '@nestjs/common';
import { RSAEncryptHelper } from './rsa-encrypt-helper.service';

@Module({
  providers: [RSAEncryptHelper],
  exports: [RSAEncryptHelper],
})
export class EncryptionModule {}
