<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Thêm mới đơn vị tổ chức</h1>
        <p class="text-gray-500 text-sm mt-1">Tạo đơn vị tổ chức mới trong hệ thống</p>
      </div>
      <Button 
        label="Quay lại" 
        icon="pi pi-arrow-left" 
        class="p-button-text"
        @click="navigateTo('/organizer-units')"
      />
    </div>

    <!-- Form -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Tên đơn vị -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tên đơn vị tổ chức <span class="text-red-500">*</span>
            </label>
            <InputText 
              v-model="formData.name" 
              placeholder="Nhập tên đơn vị tổ chức" 
              class="w-full"
              :class="{ 'p-invalid': errors.name }"
            />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>

          <!-- Người liên hệ -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Người liên hệ
            </label>
            <InputText 
              v-model="formData.contact_person" 
              placeholder="Nhập tên người liên hệ" 
              class="w-full"
            />
          </div>

          <!-- Email liên hệ -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email liên hệ
            </label>
            <InputText 
              v-model="formData.contact_email" 
              placeholder="Nhập email liên hệ" 
              type="email"
              class="w-full"
              :class="{ 'p-invalid': errors.contact_email }"
            />
            <small v-if="errors.contact_email" class="p-error">{{ errors.contact_email }}</small>
          </div>

          <!-- Số điện thoại -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <InputText 
              v-model="formData.contact_phone" 
              placeholder="Nhập số điện thoại" 
              class="w-full"
              :class="{ 'p-invalid': errors.contact_phone }"
            />
            <small v-if="errors.contact_phone" class="p-error">{{ errors.contact_phone }}</small>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button 
            label="Hủy" 
            icon="pi pi-times" 
            class="p-button-text"
            @click="navigateTo('/organizer-units')"
          />
          <Button 
            label="Lưu" 
            icon="pi pi-check" 
            type="submit"
            :loading="submitting"
            class="bg-sky-500 hover:bg-sky-600"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useOrganizerUnits } from '~/composables/useOrganizerUnits'
import { useToastSafe } from '~/composables/useToastSafe'

useHead({
  title: 'Thêm mới đơn vị tổ chức'
})
definePageMeta({
  middleware: ['auth']
})
const toast = useToastSafe()
const { create } = useOrganizerUnits()

const submitting = ref(false)
const errors = ref<Record<string, string>>({})

const formData = ref({
  name: '',
  contact_person: '',
  contact_email: '',
  contact_phone: ''
})

const validate = () => {
  errors.value = {}

  if (!formData.value.name?.trim()) {
    errors.value.name = 'Tên đơn vị tổ chức là bắt buộc'
  }

  if (formData.value.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.contact_email)) {
    errors.value.contact_email = 'Email không hợp lệ'
  }

  if (formData.value.contact_phone && !/^[0-9\-\+\(\)\s]+$/.test(formData.value.contact_phone)) {
    errors.value.contact_phone = 'Số điện thoại không hợp lệ'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) {
    return
  }

  try {
    submitting.value = true
    const data = {
      name: formData.value.name.trim(),
      contact_person: formData.value.contact_person?.trim() || undefined,
      contact_email: formData.value.contact_email?.trim() || undefined,
      contact_phone: formData.value.contact_phone?.trim() || undefined
    }

    await create(data)
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã tạo đơn vị tổ chức thành công', life: 3000 })
    navigateTo('/organizer-units')
  } catch (error: any) {
    console.error('Error creating organizer unit:', error)
    const errorMessage = error.data?.message || 'Không thể tạo đơn vị tổ chức'
    toast.add({ severity: 'error', summary: 'Lỗi', detail: errorMessage, life: 3000 })
  } finally {
    submitting.value = false
  }
}
</script>