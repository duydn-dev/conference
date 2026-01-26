import { defineEventHandler, setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  // Xóa cookie auth_token
  setCookie(event, 'auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Xóa cookie ngay lập tức
    path: '/',
  })
  
  // Xóa cookie auth_user
  setCookie(event, 'auth_user', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Xóa cookie ngay lập tức
    path: '/',
  })
  
  // Xóa cookie socket_token
  setCookie(event, 'socket_token', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Xóa cookie ngay lập tức
    path: '/',
  })

  return { success: true, message: 'Đăng xuất thành công' }
})
