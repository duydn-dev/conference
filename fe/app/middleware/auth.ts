import { isAuthenticated } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware((to, from) => {
  const isAuth = isAuthenticated();
  
  // Allow access to auth pages without authentication
  const publicRoutes = ['/login', '/register', '/forgot-password']
  const isPublicRoute = publicRoutes.includes(to.path)
  
  // If user is not authenticated and trying to access protected route
  if (!isAuth && !isPublicRoute) {
    return navigateTo('/login')
  }
  
  // If user is authenticated and trying to access auth pages, redirect to home
  if (isAuth && isPublicRoute) {
    return navigateTo('/')
  }
})
