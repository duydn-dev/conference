import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator để lấy thông tin user từ JWT token trong request
 * User info được extract từ request.user (sau khi qua JWT guard)
 * hoặc từ Authorization header nếu không có guard
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // Nếu đã có user từ guard (request.user)
    if (request.user) {
      return request.user;
    }
    
    // Fallback: lấy từ JWT token trong header (nếu không có guard)
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    // Trả về null để service tự decode token
    // Hoặc có thể decode ở đây nhưng cần inject JwtService
    return null;
  },
);

