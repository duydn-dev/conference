import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import JSEncrypt from 'jsencrypt';

@Injectable()
export class RSAEncryptHelper {
  private readonly DEFAULT_PUBLIC_KEY: string;
  private readonly logger = new Logger(RSAEncryptHelper.name);

  // Public key mặc định từ code gốc
  private readonly FALLBACK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCfxux0cJb7awTICxQyJqhqw7ud
FJC8VRZINAB+WSElKTfK+ipvwenTHMJ9UO91NND4xOJuQLxzHOlobdzaPUXe+y89
E2Rob/Oak7IHsJ4++Mp+UgFlV8jRS0mKzS7EsGpYyF3MITB8Bujo5DSKz2IsUiPY
yJ2eQkIzGineMJ1u1wIDAQAB
-----END PUBLIC KEY-----`;

  constructor(private readonly configService: ConfigService) {
    // Lấy public key từ env
    const envKey = this.configService.get<string>('RSA_PUBLIC_KEY');
    const trimmedEnvKey = envKey?.trim();

    // Kiểm tra xem env key có hợp lệ không
    if (trimmedEnvKey && this.isValidPublicKey(trimmedEnvKey)) {
      this.logger.log('Sử dụng RSA_PUBLIC_KEY từ environment variable (hợp lệ)');
      this.DEFAULT_PUBLIC_KEY = trimmedEnvKey;
    } else if (trimmedEnvKey) {
      // Env key có nhưng không hợp lệ
      this.logger.warn('RSA_PUBLIC_KEY trong env không hợp lệ, sử dụng fallback public key');
      this.DEFAULT_PUBLIC_KEY = this.FALLBACK_PUBLIC_KEY;
    } else {
      // Không có env key
      this.logger.warn('RSA_PUBLIC_KEY chưa được cấu hình trong env, sử dụng fallback public key');
      this.DEFAULT_PUBLIC_KEY = this.FALLBACK_PUBLIC_KEY;
    }

    // Validate public key cuối cùng (phải luôn hợp lệ vì đã có fallback)
    if (!this.isValidPublicKey(this.DEFAULT_PUBLIC_KEY)) {
      throw new Error('RSA Public Key không hợp lệ. Không thể khởi tạo RSAEncryptHelper.');
    }
  }

  /**
   * Hàm y hệt gm(e) từ JavaScript
   */
  genaratePassword(data: string): string {
    if (!data || !data.trim()) {
      throw new Error('Dữ liệu cần mã hóa không được để trống.');
    }

    if (!this.DEFAULT_PUBLIC_KEY || !this.DEFAULT_PUBLIC_KEY.trim()) {
      throw new Error('Public key không được để trống. Vui lòng cấu hình RSA_PUBLIC_KEY trong file .env');
    }

    const encryptor = new JSEncrypt({
      default_key_size: '1024'
    });

    encryptor.setPublicKey(this.DEFAULT_PUBLIC_KEY);
    const encrypted = encryptor.encrypt(data);

    if (!encrypted) {
      throw new Error(`Mã hóa thất bại. Public key có thể không hợp lệ hoặc dữ liệu quá dài. Public key length: ${this.DEFAULT_PUBLIC_KEY.length}`);
    }

    return encrypted;
  }

  /**
   * Hàm mã hóa với public key tùy chỉnh
   */
  encrypt(data: string, publicKey?: string): string {
    const encryptor = new JSEncrypt({
      default_key_size: '1024'
    });

    const key = publicKey || this.DEFAULT_PUBLIC_KEY;
    encryptor.setPublicKey(key);

    const encrypted = encryptor.encrypt(data);

    if (!encrypted) {
      throw new Error('Mã hóa thất bại. Kiểm tra public key và dữ liệu.');
    }

    return encrypted;
  }

  /**
   * Tạo cặp key mới
   */
  generateKeyPair(keySize: number = 1024): { publicKey: string; privateKey: string } {
    const encryptor = new JSEncrypt({ default_key_size: keySize.toString() });

    // Tạo key pair
    encryptor.getKey();

    return {
      publicKey: encryptor.getPublicKey(),
      privateKey: encryptor.getPrivateKey()
    };
  }

  /**
   * Giải mã với private key
   */
  decrypt(encryptedData: string, privateKey: string): string {
    const decryptor = new JSEncrypt();
    decryptor.setPrivateKey(privateKey);

    const decrypted = decryptor.decrypt(encryptedData);

    if (!decrypted) {
      throw new Error('Giải mã thất bại. Kiểm tra private key và dữ liệu mã hóa.');
    }

    return decrypted;
  }

  /**
   * Kiểm tra tính hợp lệ của public key
   */
  isValidPublicKey(publicKey: string): boolean {
    try {
      const encryptor = new JSEncrypt();
      encryptor.setPublicKey(publicKey);

      // Thử mã hóa chuỗi test
      const testEncrypted = encryptor.encrypt('test');
      return !!testEncrypted;
    } catch {
      return false;
    }
  }

  /**
   * Mã hóa đối tượng JSON
   */
  encryptObject(obj: Record<string, any>, publicKey?: string): string {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString, publicKey);
  }

  /**
   * Giải mã thành đối tượng JSON
   */
  decryptObject<T = any>(encryptedData: string, privateKey: string): T {
    const decryptedString = this.decrypt(encryptedData, privateKey);
    return JSON.parse(decryptedString) as T;
  }
}
