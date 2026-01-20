export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  try {
    // Đọc form data từ client
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No files uploaded'
      })
    }

    // Tạo FormData mới để forward sang NestJS
    const nestFormData = new FormData()
    
    // Append tất cả files
    for (const fileData of formData) {
      if (fileData.data) {
        const blob = new Blob([fileData.data], { type: fileData.type })
        nestFormData.append('files', blob, fileData.filename || 'file')
      }
    }

    // Forward request sang NestJS Upload API
    const response = await $fetch<Array<{ url: string }>>(`${config.public.apiBase}/upload/multiple`, {
      method: 'POST',
      body: nestFormData
    })

    // Map response từ array of {url} sang array of paths để frontend dùng
    return {
      paths: response.map(file => file.url)
    }
  } catch (error: any) {
    console.error('Upload multiple error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Upload failed'
    })
  }
})
