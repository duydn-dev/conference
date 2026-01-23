<template>
  <Dialog
    v-model:visible="internalVisible"
    header="Quản lý khách mời"
    :modal="true"
    :draggable="false"
    position="center"
    :style="{ width: '900px' }"
    @update:visible="onVisibleChange"
  >
    <!-- Pending Participants List (only when there is at least one) -->
    <div
      v-if="pendingParticipants.length > 0"
      class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
    >
      <h4 class="font-medium text-yellow-900 mb-2">
        Danh sách khách mời chờ xác nhận ({{ pendingParticipants.length }})
      </h4>
      <div class="max-h-40 overflow-y-auto space-y-2">
        <div
          v-for="(p, index) in pendingParticipants"
          :key="`pending-${p.id || index}`"
          class="flex items-center justify-between p-2 bg-white rounded border border-yellow-200"
        >
          <div class="flex-1">
            <p class="font-medium text-sm">{{ p.full_name }}</p>
            <p class="text-xs text-gray-500">
              {{ p.identity_number }} | {{ p.organization || 'Chưa có tổ chức' }}
            </p>
          </div>
          <Button
            icon="pi pi-times"
            severity="danger"
            text
            rounded
            size="small"
            @click="removePendingParticipant(index)"
          />
        </div>
      </div>
    </div>

    <TabView v-model:activeIndex="activeTabIndex">
      <!-- Tab 1: Chọn từ danh sách -->
      <TabPanel value="0" header="Chọn từ danh sách">
        <div class="space-y-4">
          <div class="flex gap-2">
            <InputText
              v-model="participantSearch"
              placeholder="Tìm kiếm theo tên, CMND/CCCD, email..."
              class="flex-1"
            />
            <Button
              icon="pi pi-search"
              @click="searchParticipants"
              :loading="searchingParticipants"
            />
          </div>

          <DataTable
            :value="availableParticipants"
            v-model:selection="selectedFromList"
            :rows="5"
            :paginator="true"
            :loading="searchingParticipants"
            selectionMode="checkbox"
            dataKey="id"
            class="border border-gray-200 rounded-lg"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem" />
            <Column field="full_name" header="Họ tên" />
            <Column field="identity_number" header="CMND/CCCD" />
            <Column field="email" header="Email" />
            <Column field="organization" header="Tổ chức" />
          </DataTable>
          
          <div class="flex justify-end mt-4">
            <Button
              label="Xác nhận"
              icon="pi pi-check"
              :disabled="selectedFromList.length === 0"
              @click="addSelectedParticipants"
            />
          </div>
        </div>
      </TabPanel>

      <!-- Tab 2: Tạo mới -->
      <TabPanel value="1" header="Tạo mới">
        <form @submit.prevent="handleCreateNewParticipant" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                CMND/CCCD <span class="text-red-500">*</span>
              </label>
              <InputText
                v-model="newParticipant.identity_number"
                placeholder="Nhập số CMND/CCCD"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Họ tên <span class="text-red-500">*</span>
              </label>
              <InputText
                v-model="newParticipant.full_name"
                placeholder="Nhập họ tên"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <InputText
                v-model="newParticipant.email"
                placeholder="Nhập email"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <InputText
                v-model="newParticipant.phone"
                placeholder="Nhập số điện thoại"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Tổ chức
              </label>
              <InputText
                v-model="newParticipant.organization"
                placeholder="Nhập tổ chức"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Chức vụ
              </label>
              <InputText
                v-model="newParticipant.position"
                placeholder="Nhập chức vụ"
                class="w-full"
              />
            </div>

            <div class="col-span-2">
              <div class="flex items-center gap-2">
                <Checkbox
                  v-model="newParticipant.is_receptionist"
                  :binary="true"
                  inputId="is_receptionist_dialog"
                />
                <label for="is_receptionist_dialog" class="text-sm font-medium text-gray-700">
                  Người đón tiếp
                </label>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button
              label="Hủy"
              severity="secondary"
              type="button"
              @click="resetNewParticipantForm"
            />
            <Button
              label="Tạo và thêm vào danh sách"
              type="submit"
              :loading="creatingParticipant"
            />
          </div>
        </form>
      </TabPanel>

      <!-- Tab 3: Import Excel -->
      <TabPanel value="2" header="Import Excel">
        <div class="space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="font-medium text-blue-900 mb-2">Định dạng file Excel:</h4>
            <p class="text-sm text-blue-800 mb-2">
              File Excel cần có các cột sau (bạn có thể tải file mẫu bên dưới):
            </p>
            <ul class="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li><strong>identity_number</strong> (CMND/CCCD) - Bắt buộc</li>
              <li><strong>full_name</strong> (Họ tên) - Bắt buộc</li>
              <li><strong>email</strong> - Tùy chọn</li>
              <li><strong>phone</strong> (Số điện thoại) - Tùy chọn</li>
              <li><strong>organization</strong> (Tổ chức) - Tùy chọn</li>
              <li><strong>position</strong> (Chức vụ) - Tùy chọn</li>
              <li><strong>is_receptionist</strong> (true/false) - Tùy chọn</li>
            </ul>
          </div>

          <div class="flex justify-end">
            <Button
              label="Tải file Excel mẫu"
              icon="pi pi-download"
              severity="success"
              class="p-button-sm"
              @click="downloadParticipantExcelTemplate"
            />
          </div>

          <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref="excelInputRef"
              type="file"
              accept=".xlsx,.xls"
              @change="handleExcelFileSelect"
              class="hidden"
            />
            <Button
              label="Chọn file Excel"
              icon="pi pi-file-excel"
              @click="excelInputRef?.click()"
              :loading="importingExcel"
            />
            <p v-if="selectedExcelFileName" class="mt-2 text-sm text-gray-600">
              {{ selectedExcelFileName }}
            </p>
          </div>
        </div>
      </TabPanel>
    </TabView>

    <!-- Dialog Footer with Confirm Button -->
    <div v-if="activeTabIndex !== 0" class="mt-6 pt-4 border-t border-gray-200">
      <div class="flex justify-between items-center w-full">
        <div class="text-sm text-gray-600">
          <span v-if="pendingParticipants.length > 0">
            {{ pendingParticipants.length }} khách mời chờ xác nhận
          </span>
          <span v-else class="text-gray-400">
            Chưa có khách mời nào được thêm
          </span>
        </div>
        <div class="flex gap-2">
          <Button
            label="Hủy"
            severity="secondary"
            @click="cancelParticipantDialog"
          />
          <Button
            label="Xác nhận"
            icon="pi pi-check"
            :loading="confirmingParticipants"
            @click="confirmParticipants"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useParticipants } from '~/composables/useParticipants'
import { useEventParticipants } from '~/composables/useEventParticipants'
import { useToastSafe } from '~/composables/useToastSafe'
import type { Participant } from '~/types/participant'
import { ParticipantStatus, ImportSource } from '~/types/event-participant'

type ParticipantLike = Participant & {
  relationId?: string
}

const props = withDefaults(defineProps<{
  modelValue: boolean
  eventId?: string | null
  participants?: ParticipantLike[]
}>(), {
  eventId: null,
  participants: () => []
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:participants', value: ParticipantLike[]): void
}>()

const toast = useToastSafe()
const { getPagination: getParticipants, create: createParticipant } = useParticipants()
const { getPagination: getEventParticipants, create: createEventParticipant } = useEventParticipants()

// Visibility
const internalVisible = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    internalVisible.value = val
    // Khi dialog mở và đang ở tab "Chọn từ danh sách", load danh sách
    if (val && activeTabIndex.value === 0) {
      loadParticipantsForSelection()
    }
  }
)

const onVisibleChange = (val: boolean) => {
  emit('update:modelValue', val)
}

// Tab state
const activeTabIndex = ref(0)

// Watch tab change để tự động load khi vào tab "Chọn từ danh sách"
watch(activeTabIndex, async (newIndex) => {
  if (newIndex === 0 && internalVisible.value) {
    // Tab "Chọn từ danh sách" và dialog đang mở
    await loadParticipantsForSelection()
  }
})

// Selected & pending participants
const selectedParticipants = ref<ParticipantLike[]>([...props.participants])
const pendingParticipants = ref<ParticipantLike[]>([])

watch(
  () => props.participants,
  (val) => {
    selectedParticipants.value = [...(val || [])]
    
    // Nếu đang ở tab "Chọn từ danh sách" và dialog đang mở, cập nhật lại selectedFromList
    if (activeTabIndex.value === 0 && internalVisible.value && availableParticipants.value.length > 0) {
      if (val && val.length > 0) {
        const selectedIds = new Set(val.map(p => p.id))
        selectedFromList.value = availableParticipants.value.filter(
          (p: Participant) => selectedIds.has(p.id)
        )
      } else {
        // Nếu danh sách bên ngoài rỗng, không tích gì cả
        selectedFromList.value = []
      }
    }
  },
  { deep: true }
)

// Search & available participants
const availableParticipants = ref<Participant[]>([])
const selectedFromList = ref<Participant[]>([])
const participantSearch = ref('')
const searchingParticipants = ref(false)

// Create participant
const creatingParticipant = ref(false)
const newParticipant = ref({
  identity_number: '',
  full_name: '',
  email: '',
  phone: '',
  organization: '',
  position: '',
  is_receptionist: false
})

// Excel import state
const excelInputRef = ref<HTMLInputElement | null>(null)
const selectedExcelFile = ref<File | null>(null)
const selectedExcelFileName = ref<string>('')
const importingExcel = ref(false)

const loadParticipantsForSelection = async () => {
  try {
    searchingParticipants.value = true
    
    // Load danh sách tất cả khách mời
    const response = await getParticipants({
      page: 1,
      limit: 200,
      search: participantSearch.value
    })
    const result = (response as any)
    if (result) {
      availableParticipants.value = result.data || []
      
      // Ưu tiên dùng props.participants (danh sách từ bên ngoài) để set checked
      // Điều này đảm bảo đồng bộ với UI bên ngoài khi người dùng đã xóa/thêm khách mời
      if (props.participants && props.participants.length > 0) {
        const selectedIds = new Set(props.participants.map(p => p.id))
        selectedFromList.value = availableParticipants.value.filter(
          (p: Participant) => selectedIds.has(p.id)
        )
      } else if (props.eventId) {
        // Nếu không có props.participants nhưng có eventId, load từ event-participants
        try {
          const eventParticipantsResponse = await getEventParticipants({ 
            event_id: props.eventId, 
            limit: 200, 
            relations: true 
          })
          const eventParticipantsResult = (eventParticipantsResponse as any)
          if (eventParticipantsResult && eventParticipantsResult.data) {
            const eventParticipantIds = new Set(
              eventParticipantsResult.data.map((ep: any) => ep.participant_id)
            )
            
            // Set checked cho những participants đã có trong sự kiện
            selectedFromList.value = availableParticipants.value.filter(
              (p: Participant) => eventParticipantIds.has(p.id)
            )
          } else {
            // Nếu không có dữ liệu từ event-participants, không tích gì cả
            selectedFromList.value = []
          }
        } catch (error) {
          console.error('Error loading event participants:', error)
          selectedFromList.value = []
        }
      } else {
        // Nếu không có eventId và không có props.participants, dùng selectedParticipants internal
        const selectedIds = new Set(selectedParticipants.value.map(p => p.id))
        selectedFromList.value = availableParticipants.value.filter(
          (p: Participant) => selectedIds.has(p.id)
        )
      }
    }
  } catch (error) {
    console.error('Error loading participants:', error)
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách khách mời', life: 3000 })
  } finally {
    searchingParticipants.value = false
  }
}

const searchParticipants = async () => {
  await loadParticipantsForSelection()
}

const addSelectedParticipants = () => {
  // Lấy danh sách ID của các participants đang được chọn trong tab "Chọn từ danh sách"
  const selectedIds = new Set(selectedFromList.value.map(p => p.id))
  
  // Lấy danh sách ID của các participants hiện có trong selectedParticipants
  const currentSelectedIds = new Set(selectedParticipants.value.map(p => p.id))
  
  // Tìm các participants cần thêm (có trong selectedFromList nhưng chưa có trong selectedParticipants)
  const toAdd = selectedFromList.value.filter(p => !currentSelectedIds.has(p.id))
  
  // Tìm các participants cần xóa (có trong selectedParticipants nhưng không có trong selectedFromList)
  // Chỉ xóa những participants có trong availableParticipants (tức là từ tab "Chọn từ danh sách")
  const availableIds = new Set(availableParticipants.value.map(p => p.id))
  const toRemove = selectedParticipants.value.filter(
    p => availableIds.has(p.id) && !selectedIds.has(p.id)
  )
  
  // Thêm các participants mới
  let addedCount = 0
  for (const participant of toAdd) {
    selectedParticipants.value.push({
      ...participant,
      is_receptionist: (participant as any).is_receptionist || false
    })
    addedCount++
  }
  
  // Xóa các participants đã bị bỏ tích
  let removedCount = 0
  for (const participant of toRemove) {
    const index = selectedParticipants.value.findIndex(p => p.id === participant.id)
    if (index !== -1) {
      selectedParticipants.value.splice(index, 1)
      removedCount++
    }
  }
  
  // Emit về parent để đồng bộ với trang thêm/sửa event
  emit('update:participants', [...selectedParticipants.value])
  
  // Hiển thị thông báo
  if (addedCount > 0 || removedCount > 0) {
    const messages = []
    if (addedCount > 0) {
      messages.push(`Đã thêm ${addedCount} khách mời`)
    }
    if (removedCount > 0) {
      messages.push(`Đã xóa ${removedCount} khách mời`)
    }
    
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: messages.join(', '),
      life: 3000
    })
  } else {
    toast.add({
      severity: 'info',
      summary: 'Thông báo',
      detail: 'Không có thay đổi nào',
      life: 3000
    })
  }
  
  // Đóng dialog sau khi xác nhận
  internalVisible.value = false
  emit('update:modelValue', false)
}

const handleCreateNewParticipant = async () => {
  if (!newParticipant.value.identity_number || !newParticipant.value.full_name) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'CMND/CCCD và Họ tên là bắt buộc',
      life: 3000
    })
    return
  }

  try {
    creatingParticipant.value = true
    const response = await createParticipant(newParticipant.value)
    const created = (response.data.value as any)

    if (created) {
      if (
        !pendingParticipants.value.find(p => p.id === created.id) &&
        !selectedParticipants.value.find(p => p.id === created.id)
      ) {
        pendingParticipants.value.push({
          ...created,
          is_receptionist: created.is_receptionist || false
        })

        toast.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã tạo khách mời và thêm vào danh sách chờ xác nhận',
          life: 3000
        })
      } else {
        toast.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Khách mời này đã có trong danh sách',
          life: 3000
        })
      }

      resetNewParticipantForm()
      
      // Tự động xác nhận và đóng dialog sau khi tạo mới thành công
      await confirmParticipants()
    }
  } catch (error: any) {
    console.error('Error creating participant:', error)
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.data?.message || 'Không thể tạo khách mời',
      life: 3000
    })
  } finally {
    creatingParticipant.value = false
  }
}

const resetNewParticipantForm = () => {
  newParticipant.value = {
    identity_number: '',
    full_name: '',
    email: '',
    phone: '',
    organization: '',
    position: '',
    is_receptionist: false
  }
}

const handleExcelFileSelect = (event: any) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedExcelFile.value = target.files[0] || null
    selectedExcelFileName.value = target.files[0]?.name || ''
  }
}

const downloadParticipantExcelTemplate = async () => {
  try {
    const response = await $fetch('/api/participants/import-template', {
      method: 'GET',
      responseType: 'blob'
    })

    const blob = response as unknown as Blob
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'import-khachmoi.xlsx'
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)

    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã tải file mẫu thành công',
      life: 3000
    })
  } catch (error: any) {
    console.error('Error downloading template:', error)
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.data?.message || 'Không thể tải file mẫu. Vui lòng thử lại.',
      life: 3000
    })
  }
}

const handleImportExcel = async () => {
  if (!selectedExcelFile.value) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Vui lòng chọn file Excel',
      life: 3000
    })
    return
  }

  try {
    importingExcel.value = true
    const formData = new FormData()
    formData.append('file', selectedExcelFile.value)

    const response = await $fetch('/api/participants/import-excel', {
      method: 'POST',
      body: formData
    })

    const result = response as any

    // Thông báo kết quả import
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: `Import thành công ${result.success || 0} khách mời`,
      life: 3000
    })

    // Nếu backend trả về danh sách identity_number thì gọi API lấy danh sách Participant tương ứng
    const identityNumbers: string[] = result.identity_numbers || []
    if (identityNumbers.length > 0) {
      try {
        const importedParticipants = await $fetch('/api/participants/by-identities', {
          method: 'POST',
          body: {
            identity_numbers: identityNumbers
          }
        })

        const participantsList = importedParticipants as any[]

        // Đổ lại dữ liệu vào tab "Chọn từ danh sách"
        availableParticipants.value = participantsList

        // Đồng thời in ra màn thêm mới/sửa event
        selectedParticipants.value = [...participantsList]
        emit('update:participants', [...selectedParticipants.value])

        // Chuyển sang tab "Chọn từ danh sách"
        activeTabIndex.value = 0
      } catch (error: any) {
        console.error('Error loading participants by identities:', error)
        toast.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: error.data?.message || 'Không thể tải danh sách khách mời sau khi import',
          life: 3000
        })
      }
    }

    selectedExcelFile.value = null
    selectedExcelFileName.value = ''
    if (excelInputRef.value) {
      excelInputRef.value.value = ''
    }

    // Sau import, có thể load lại danh sách tìm kiếm nếu cần
    await searchParticipants()
  } catch (error: any) {
    console.error('Error importing Excel:', error)
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.data?.message || 'Không thể import Excel',
      life: 3000
    })
  } finally {
    importingExcel.value = false
  }
}

const removePendingParticipant = (index: number) => {
  pendingParticipants.value.splice(index, 1)
}

const cancelParticipantDialog = () => {
  pendingParticipants.value = []
  internalVisible.value = false
  emit('update:modelValue', false)
}

const confirmingParticipants = ref(false)

const confirmParticipants = async () => {
  try {
    // Nếu đang ở tab "Chọn từ danh sách", đồng bộ danh sách từ tab đó trước
    if (activeTabIndex.value === 0) {
      // Đồng bộ selectedParticipants với selectedFromList
      const selectedIds = new Set(selectedFromList.value.map(p => p.id))
      const availableIds = new Set(availableParticipants.value.map(p => p.id))
      
      // Xóa các participants từ tab "Chọn từ danh sách" đã bị bỏ tích
      selectedParticipants.value = selectedParticipants.value.filter(
        p => !availableIds.has(p.id) || selectedIds.has(p.id)
      )
      
      // Thêm các participants mới được chọn
      const currentSelectedIds = new Set(selectedParticipants.value.map(p => p.id))
      for (const participant of selectedFromList.value) {
        if (!currentSelectedIds.has(participant.id)) {
          selectedParticipants.value.push({
            ...participant,
            is_receptionist: (participant as any).is_receptionist || false
          })
        }
      }
    }
    
    // Nếu người dùng đã chọn file Excel nhưng chưa bấm import, thì import trước
    if (selectedExcelFile.value && pendingParticipants.value.length === 0) {
      await handleImportExcel()
    }

    if (pendingParticipants.value.length === 0 && activeTabIndex.value === 0) {
      // Nếu chỉ có thay đổi từ tab "Chọn từ danh sách" và không có pending, emit và đóng dialog
      emit('update:participants', [...selectedParticipants.value])
      internalVisible.value = false
      emit('update:modelValue', false)
      return
    }

    if (pendingParticipants.value.length === 0) {
      return
    }

    confirmingParticipants.value = true

    // Nếu có eventId thì call API tạo event_participants
    if (props.eventId) {
      const eventId = props.eventId
      let successCount = 0
      let failCount = 0

      for (const participant of pendingParticipants.value) {
        try {
          await createEventParticipant({
            event_id: eventId,
            participant_id: participant.id,
            status: ParticipantStatus.REGISTERED,
            source: ImportSource.MANUAL
          })
          successCount++
        } catch (error: any) {
          console.error(`Error adding participant ${participant.id}:`, error)
          failCount++
        }
      }

      // Sau khi tạo xong thì load lại danh sách khách mời của event
      const response = await getEventParticipants({ event_id: eventId, limit: 200, relations: true })
      const result = (response as any)
      if (result) {
        selectedParticipants.value = (result.data || []).map((ep: any) => ({
          id: ep.participant_id,
          relationId: ep.id,
          full_name: ep.participant?.full_name || '',
          identity_number: ep.participant?.identity_number || '',
          email: ep.participant?.email || '',
          phone: ep.participant?.phone || '',
          organization: ep.participant?.organization || ''
        }))
      }

      const msgSuffix = failCount > 0 ? ` (${failCount} thất bại)` : ''
      toast.add({
        severity: successCount > 0 ? 'success' : 'error',
        summary: successCount > 0 ? 'Thành công' : 'Lỗi',
        detail: successCount > 0
          ? `Đã thêm ${successCount} khách mời vào sự kiện${msgSuffix}`
          : 'Không thể thêm khách mời vào sự kiện',
        life: 3000
      })
    } else {
      // Không có eventId: chỉ merge pending vào selected và trả về cho parent
      const existingIds = new Set(selectedParticipants.value.map(p => p.id))
      for (const participant of pendingParticipants.value) {
        if (!existingIds.has(participant.id)) {
          selectedParticipants.value.push(participant)
        }
      }
    }

    // Emit về cho parent danh sách khách mời mới
    emit('update:participants', [...selectedParticipants.value])

    // Clear pending & đóng dialog
    const totalCount = pendingParticipants.value.length
    pendingParticipants.value = []
    internalVisible.value = false
    emit('update:modelValue', false)

    // Nếu không có eventId thì show toast đơn giản
    if (!props.eventId && totalCount > 0) {
      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: `Đã thêm ${totalCount} khách mời vào danh sách`,
        life: 3000
      })
    }
  } catch (error: any) {
    console.error('Error confirming participants:', error)
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.data?.message || 'Không thể thêm khách mời vào sự kiện',
      life: 3000
    })
  } finally {
    confirmingParticipants.value = false
  }
}

// Nếu truyền eventId thì load sẵn danh sách khách mời của event đó
onMounted(async () => {
  if (props.eventId) {
    try {
      const response = await getEventParticipants({ event_id: props.eventId, limit: 200, relations: true })
      const result = (response as any)
      if (result) {
        selectedParticipants.value = (result.data || []).map((ep: any) => ({
          id: ep.participant_id,
          relationId: ep.id,
          full_name: ep.participant?.full_name || '',
          identity_number: ep.participant?.identity_number || '',
          email: ep.participant?.email || '',
          phone: ep.participant?.phone || '',
          organization: ep.participant?.organization || ''
        }))
        emit('update:participants', [...selectedParticipants.value])
      }
    } catch (error) {
      console.error('Error loading event participants:', error)
    }
  }
  
  // Load danh sách khi mở dialog nếu đang ở tab "Chọn từ danh sách"
  if (activeTabIndex.value === 0) {
    await loadParticipantsForSelection()
  }
})
</script>
