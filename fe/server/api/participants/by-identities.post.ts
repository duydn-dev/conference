import { readBody } from 'h3';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase || 'http://localhost:3001';

  try {
    const body = await readBody<{ identity_numbers: string[] }>(event);

    if (!body || !Array.isArray(body.identity_numbers) || body.identity_numbers.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'identity_numbers must be a non-empty array',
      });
    }

    const response = await fetch(`${apiBase}/participants/by-identities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identity_numbers: body.identity_numbers,
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
        message: errorData.message || 'Lỗi khi lấy danh sách khách mời theo identity_number',
        data: errorData,
      });
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Lỗi khi lấy danh sách khách mời theo identity_number',
    });
  }
})