export class LoginResponseDto {
  user: {
    id: string | number;
    email: string;
    fullname?: string;
    sdt: string;
    identity_number: string;
    [key: string]: any;
  };
  token: string;
}
