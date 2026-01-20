export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  try {
    // Đọc form data từ client
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file uploaded'
      })
    }

    // Tạo FormData mới để forward sang NestJS
    const nestFormData = new FormData()
    
    // Lấy file đầu tiên (single upload)
    const fileData = formData[0]
    
    if (!fileData.data) {
      throw createError({
        statusCode: 400,
        message: 'Invalid file data'
      })
    }

    // Tạo Blob từ buffer
    const blob = new Blob([fileData.data], { type: fileData.type })
    
    // Append vào FormData với tên field là 'file' (theo NestJS endpoint)
    nestFormData.append('file', blob, fileData.filename || 'file')

    // Forward request sang NestJS Upload API
    const response = await $fetch<{ url: string }>(`${config.public.apiBase}/upload/single`, {
      method: 'POST',
      body: nestFormData
    })

    // Map response từ 'url' sang 'path' để frontend dùng
    return {
      path: response.url
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Upload failed'
    })
  }
})
