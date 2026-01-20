import { readMultipartFormData } from 'h3';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase || 'http://localhost:3001';

  try {
    // Read multipart form data
    const formData = await readMultipartFormData(event);
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Không có file được upload',
      });
    }

    // Find file in form data
    const fileData = formData.find(item => item.name === 'file');
    
    if (!fileData) {
      throw createError({
        statusCode: 400,
        message: 'Không tìm thấy file trong request',
      });
    }

    // Create FormData for backend API
    const backendFormData = new FormData();
    const blob = new Blob([fileData.data], { type: fileData.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    backendFormData.append('file', blob, fileData.filename);

    // Forward request to backend API
    const response = await fetch(`${apiBase}/participants/import-excel`, {
      method: 'POST',
      body: backendFormData,
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
        message: errorData.message || 'Lỗi khi import Excel',
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
      message: error.message || 'Lỗi khi import Excel',
    });
  }
});

