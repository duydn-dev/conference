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
