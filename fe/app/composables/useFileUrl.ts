/**
 * Composable để xử lý file URL
 * Chuyển đổi relative path thành full URL với API base
 */
export const useFileUrl = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase || 'http://localhost:3001'

  /**
   * Lấy full URL từ relative path
   * @param path - Relative path (vd: /uploads/abc.jpg) hoặc full URL
   * @returns Full URL để hiển thị trong HTML
   */
  const getFullUrl = (path: string | null | undefined): string => {
    if (!path) return ''
    
    // Nếu đã là full URL (có http/https) thì giữ nguyên
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    
    // Nếu là relative path, prepend API host
    return `${apiBase}${path.startsWith('/') ? '' : '/'}${path}`
  }

  return {
    getFullUrl,
    apiBase
  }
}
