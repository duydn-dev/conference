<template>
  <div class="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-3 mb-4">
          <img src="/imgs/ihanoi.png" alt="Logo" class="h-12 w-auto" />
          <span class="text-2xl font-bold text-gray-800">Conference</span>
        </div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Đăng nhập</h1>
        <p class="text-gray-600">Vui lòng đăng nhập để tiếp tục</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Username/Email Field -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
              <i class="pi pi-user mr-2"></i>
              Tên đăng nhập
            </label>
            <InputText
              id="username"
              v-model="form.username"
              type="text"
              placeholder="Nhập tên đăng nhập"
              class="w-full"
              :class="{ 'p-invalid': errors.username }"
              :disabled="loading"
              autocomplete="username"
            />
            <small v-if="errors.username" class="p-error">{{ errors.username }}</small>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              <i class="pi pi-lock mr-2"></i>
              Mật khẩu
            </label>
            <Password
              id="password"
              v-model="form.password"
              placeholder="Nhập mật khẩu"
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
              :disabled="loading"
              :feedback="false"
              toggleMask
              autocomplete="current-password"
              inputClass="w-full"
            />
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <Checkbox
                id="remember"
                v-model="form.remember"
                :binary="true"
                :disabled="loading"
              />
              <label for="remember" class="ml-2 text-sm text-gray-600 cursor-pointer">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <NuxtLink
              to="/forgot-password"
              class="text-sm text-sky-600 hover:text-sky-700 hover:underline"
            >
              Quên mật khẩu?
            </NuxtLink>
          </div>

          <!-- Error Message -->
          <Message
            v-if="errorMessage"
            severity="error"
            :closable="true"
            @close="errorMessage = ''"
          >
            {{ errorMessage }}
          </Message>

          <!-- Submit Button -->
          <Button
            type="submit"
            label="Đăng nhập"
            icon="pi pi-sign-in"
            class="w-full"
            :loading="loading"
            :disabled="loading"
            size="large"
          />
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Hoặc</span>
          </div>
        </div>

        <!-- Register Link -->
        <div class="text-center">
          <span class="text-sm text-gray-600">Chưa có tài khoản? </span>
          <NuxtLink
            to="/register"
            class="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
          >
            Đăng ký ngay
          </NuxtLink>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-6 text-sm text-gray-500">
        <p>&copy; {{ new Date().getFullYear() }} Conference. Tất cả quyền được bảo lưu.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useRouter } from 'vue-router'

useHead({
  title: 'Đăng nhập'
})

definePageMeta({
  layout: 'auth'
})

const router = useRouter()
const { login } = useAuth()

const form = reactive({
  username: '',
  password: '',
  remember: false
})

const errors = reactive({
  username: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

const validateForm = () => {
  let isValid = true
  
  errors.username = ''
  errors.password = ''
  
  if (!form.username.trim()) {
    errors.username = 'Vui lòng nhập tên đăng nhập hoặc email'
    isValid = false
  }
  
  if (!form.password) {
    errors.password = 'Vui lòng nhập mật khẩu'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    isValid = false
  }
  
  return isValid
}

const handleLogin = async () => {
  // Clear previous errors
  errorMessage.value = ''
  
  // Validate form
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  
  try {
    await login({
      username: form.username.trim(),
      password: form.password,
      remember: form.remember
    })
    
    // Redirect to home page on success
    await router.push('/')
  } catch (error: any) {
    errorMessage.value = error.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.p-password-input) {
  width: 100%;
}

:deep(.p-inputtext),
:deep(.p-password-input) {
  padding: 0.75rem 1rem;
}
</style>