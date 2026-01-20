export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase || 'http://localhost:3001';

  try {
    // Forward request to backend API
    const response = await fetch(`${apiBase}/participants/import-template`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: 'Lỗi khi tải file template',
      });
    }

    // Get the file buffer
    const buffer = await response.arrayBuffer();

    // Set headers for file download
    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    setHeader(event, 'Content-Disposition', 'attachment; filename="import-khachmoi.xlsx"');
    setHeader(event, 'Content-Length', buffer.byteLength.toString());

    // Return buffer as Uint8Array for binary data
    return new Uint8Array(buffer);
  } catch (error: any) {
    // If it's already a H3 error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Otherwise, create a new error
    throw createError({
      statusCode: 500,
      message: error.message || 'Lỗi khi tải file template',
    });
  }
});

