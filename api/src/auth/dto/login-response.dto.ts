export class LoginResponseDto {
  user: {
    id: string | number;
    email: string;
    fullname?: string;
    sdt: string;
    [key: string]: any;
  };
  token: string;
}
