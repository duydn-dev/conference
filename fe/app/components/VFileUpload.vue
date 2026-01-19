<template>
  <div class="card">
    <PrimeFileUpload 
      name="files[]" 
      :url="uploadUrl" 
      @upload="onTemplatedUpload($event)" 
      :multiple="isMultiple" 
      :accept="accept" 
      :maxFileSize="maxFileSize" 
      @select="onSelectedFiles"
      :auto="false"
      :customUpload="true"
      @uploader="customUploader"
    >
      <template #header="{ chooseCallback, clearCallback, files }">
        <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
          <div class="flex gap-2">
            <Button 
              @click="chooseCallback()" 
              icon="pi pi-images" 
              rounded 
              outlined
              severity="secondary"
            />
            <Button 
              @click="clearCallback()" 
              icon="pi pi-times" 
              rounded 
              outlined
              severity="danger" 
              :disabled="!files || files.length === 0"
            />
          </div>
          <ProgressBar 
            v-if="uploading"
            :value="totalSizePercent" 
            :showValue="false" 
            class="md:w-20rem h-1 w-full md:ml-auto"
          >
            <span class="whitespace-nowrap">{{ totalSize }}B / {{ maxFileSizeMB }}MB</span>
          </ProgressBar>
        </div>
      </template>
      
      <template #content="{ files, uploadedFiles, removeUploadedFileCallback, removeFileCallback, messages }">
        <div class="flex flex-col gap-8 pt-4">
          <Message 
            v-for="message of messages" 
            :key="message" 
            :class="{ 'mb-8': !files.length && !uploadedFiles.length}" 
            severity="error"
          >
            {{ message }}
          </Message>

          <div v-if="files.length > 0">
            <h5 class="text-lg font-semibold mb-4">Chờ upload</h5>
            <div class="flex flex-wrap gap-4">
              <div 
                v-for="(file, index) of files" 
                :key="file.name + file.type + file.size" 
                class="p-4 rounded-lg flex flex-col border border-gray-300 items-center gap-3"
              >
                <div>
                  <img 
                    v-if="(file as any).objectURL" 
                    role="presentation" 
                    :alt="file.name" 
                    :src="(file as any).objectURL" 
                    class="w-24 h-24 object-cover rounded"
                  />
                  <i v-else class="pi pi-file text-4xl text-gray-400"></i>
                </div>
                <span class="font-semibold text-sm text-ellipsis max-w-[200px] whitespace-nowrap overflow-hidden">
                  {{ file.name }}
                </span>
                <div class="text-xs text-gray-500">{{ formatSize(file.size) }}</div>
                <Tag value="Chờ upload" severity="warn" />
                <Button 
                  icon="pi pi-times" 
                  @click="onRemoveTemplatingFile(file, removeFileCallback, index)" 
                  outlined
                  rounded 
                  severity="danger"
                  size="small"
                />
              </div>
            </div>
          </div>

          <div v-if="uploadedFilesList.length > 0">
            <h5 class="text-lg font-semibold mb-4">Đã upload</h5>
            <div class="flex flex-wrap gap-4">
              <div 
                v-for="(file, index) of uploadedFilesList" 
                :key="file.url || file.name" 
                class="p-4 rounded-lg flex flex-col border border-gray-300 items-center gap-3"
              >
                <div>
                  <img 
                    v-if="file.url" 
                    role="presentation" 
                    :alt="file.name" 
                    :src="file.url" 
                    class="w-24 h-24 object-cover rounded"
                  />
                  <i v-else class="pi pi-file text-4xl text-gray-400"></i>
                </div>
                <span class="font-semibold text-sm text-ellipsis max-w-[200px] whitespace-nowrap overflow-hidden">
                  {{ file.name }}
                </span>
                <div class="text-xs text-gray-500">{{ formatSize(file.size) }}</div>
                <Tag value="Hoàn thành" severity="success" />
                <Button 
                  icon="pi pi-times" 
                  @click="removeUploadedFile(index)" 
                  outlined
                  rounded 
                  severity="danger"
                  size="small"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <template #empty>
        <div class="flex items-center justify-center flex-col py-12">
          <i class="pi pi-cloud-upload border-2 rounded-full p-8 text-6xl text-gray-400" />
          <p class="mt-6 mb-0 text-gray-500">Kéo thả file vào đây để upload</p>
        </div>
      </template>
    </PrimeFileUpload>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PrimeFileUpload from 'primevue/fileupload'
import { useToastSafe } from '~/composables/useToastSafe'

interface Props {
  modelValue?: string | string[] | null
  isMultiple?: boolean
  accept?: string
  maxFileSize?: number // in bytes
  uploadUrl?: string
  autoUpload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  isMultiple: false,
  accept: 'image/*',
  maxFileSize: 5000000, // 5MB
  uploadUrl: '/api/events/upload',
  autoUpload: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | null]
}>()

const toast = useToastSafe()
const totalSize = ref(0)
const totalSizePercent = ref(0)
const uploading = ref(false)
const uploadedFilesList = ref<Array<{ url: string; name: string; size: number }>>([])

const maxFileSizeMB = computed(() => {
  return (props.maxFileSize / 1000000).toFixed(0)
})

const onRemoveTemplatingFile = (file: any, removeFileCallback: Function, index: number) => {
  removeFileCallback(index)
  totalSize.value -= parseInt(formatSize(file.size))
  totalSizePercent.value = totalSize.value / (props.maxFileSize / 100)
}

const onSelectedFiles = async (event: any) => {
  const files = event.files
  totalSize.value = 0
  files.forEach((file: any) => {
    totalSize.value += file.size
  })
  totalSizePercent.value = (totalSize.value / props.maxFileSize) * 100
  
  // Auto upload if enabled
  if (props.autoUpload && files.length > 0) {
    await uploadFiles(files)
  }
}

// Upload files to server
const uploadFiles = async (files: File[]) => {
  uploading.value = true
  
  try {
    const formData = new FormData()
    
    if (props.isMultiple) {
      files.forEach((file: File) => {
        formData.append('files', file)
      })
    } else {
      if (files[0]) {
        formData.append('file', files[0])
      }
    }
    
    // Upload to server
    const response = await $fetch(props.uploadUrl, {
      method: 'POST',
      body: formData
    })
    
    // Parse response - API trả về { path: string } hoặc { paths: string[] }
    // Path không có host, ví dụ: /fileupload/abc.jpg
    const uploadedData = response as any
    
    if (props.isMultiple) {
      // API trả về array paths
      const paths = uploadedData.paths || uploadedData.urls || []
      uploadedFilesList.value = paths.map((path: string, index: number) => ({
        url: path, // Đường dẫn không có host
        name: files[index]?.name || 'file',
        size: files[index]?.size || 0
      }))
      emit('update:modelValue', paths)
    } else {
      // API trả về single path
      const path = uploadedData.path || uploadedData.url || ''
      const firstFile = files[0]
      uploadedFilesList.value = [{
        url: path, // Đường dẫn không có host
        name: firstFile?.name || 'file',
        size: firstFile?.size || 0
      }]
      emit('update:modelValue', path)
    }
    
    toast.add({ 
      severity: 'success', 
      summary: 'Thành công', 
      detail: 'Upload file thành công', 
      life: 3000 
    })
    
    // Reset size tracking
    totalSize.value = 0
    totalSizePercent.value = 0
  } catch (error: any) {
    console.error('Upload error:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Lỗi', 
      detail: error.data?.message || 'Không thể upload file', 
      life: 3000 
    })
  } finally {
    uploading.value = false
  }
}

// Custom uploader để upload lên server thật
const customUploader = async (event: any) => {
  const files = event.files
  await uploadFiles(files)
}

const onTemplatedUpload = (event: any) => {
  // This is called after successful upload
  console.log('Upload completed:', event)
}

const removeUploadedFile = (index: number) => {
  uploadedFilesList.value.splice(index, 1)
  
  if (props.isMultiple) {
    const urls = uploadedFilesList.value.map(f => f.url)
    emit('update:modelValue', urls.length > 0 ? urls : null)
  } else {
    emit('update:modelValue', null)
  }
}

const formatSize = (bytes: number): string => {
  const k = 1024
  const dm = 2
  const sizes = ['B', 'KB', 'MB', 'GB']

  if (bytes === 0) {
    return `0 ${sizes[0]}`
  }

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))

  return `${formattedSize} ${sizes[i]}`
}
</script>

<style scoped>
.card {
  background: white;
  border-radius: 8px;
}
</style>
