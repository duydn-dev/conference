import { defineEventHandler, readBody, createError, setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase || 'http://localhost:3001';

  try {
    // Read request body
    const body = await readBody(event);

    // Validate required fields
    if (!body.username || !body.password) {
      throw createError({
        statusCode: 400,
        message: 'Tên đăng nhập và mật khẩu không được để trống',
      });
    }

    // Forward request to backend API using fetch
    const response = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: body.username,
        password: body.password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      throw createError({
        statusCode: response.status,
        message: errorData.message || 'Đăng nhập thất bại',
        data: errorData,
      });
    }

    const result = await response.json();
    
    // Set auth_token vào cookie với các thiết lập bảo mật
    if (result.token) {
      setCookie(event, 'auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Chỉ secure trong production
        sameSite: 'strict',
        maxAge: body.remember ? 60 * 60 * 24 * 7 : 60 * 60 * 24, // 7 ngày nếu remember, 1 ngày nếu không
        path: '/',
      });
      
      // Set socket_token vào cookie không httpOnly để Socket.IO có thể đọc
      setCookie(event, 'socket_token', result.token, {
        httpOnly: false, // Cho phép client JavaScript truy cập để connect Socket.IO
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: body.remember ? 60 * 60 * 24 * 7 : 60 * 60 * 24,
        path: '/',
      });
    }
    
    // Set auth_user vào cookie (không httpOnly để client có thể đọc)
    if (result.user) {
      setCookie(event, 'auth_user', JSON.stringify(result.user), {
        httpOnly: false, // Cho phép client JavaScript truy cập
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: body.remember ? 60 * 60 * 24 * 7 : 60 * 60 * 24, // 7 ngày nếu remember, 1 ngày nếu không
        path: '/',
      });
    }
    
    return result;
  } catch (error: any) {
    // If it's already a H3 error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Otherwise, create a new error
    throw createError({
      statusCode: 500,
      message: error.message || 'Đăng nhập thất bại',
    });
  }
});
