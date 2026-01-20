export class LoginResponseDto {
  user: {
    id: string | number;
    username: string;
    email: string;
    name?: string;
    fullname?: string;
    department?: string;
    department_id?: number;
    place_id?: string;
    roles?: string[];
    [key: string]: any;
  };
  token: string;
}
