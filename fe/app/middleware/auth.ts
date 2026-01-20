export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth()
  
  // Allow access to auth pages without authentication
  const publicRoutes = ['/login', '/register', '/forgot-password']
  const isPublicRoute = publicRoutes.includes(to.path)
  
  // If user is not authenticated and trying to access protected route
  if (!isAuthenticated.value && !isPublicRoute) {
    return navigateTo('/login')
  }
  
  // If user is authenticated and trying to access auth pages, redirect to home
  if (isAuthenticated.value && isPublicRoute) {
    return navigateTo('/')
  }
})
