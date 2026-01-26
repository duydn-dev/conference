<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="'Quay giải thưởng - ' + (minigame?.name || 'Mini Game')"
    :draggable="false"
    :closable="!isDrawing"
    :style="{ width: '90vw', maxWidth: '800px' }"
    class="minigame-draw-modal"
  >
    <div v-if="isDrawing" class="drawing-container">
      <div class="text-center space-y-4">
        <div class="spinner-container">
          <i class="pi pi-spin pi-spinner text-6xl text-primary"></i>
        </div>
        <h3 class="text-xl font-semibold text-gray-800">
          Đang quay giải: {{ currentPrize?.prize_name || '...' }}
        </h3>
        <p class="text-gray-600">Vui lòng đợi trong giây lát...</p>
      </div>
    </div>

    <div v-else-if="drawResults.length > 0" class="results-container">
      <div class="space-y-6">
        <div
          v-for="(result, index) in drawResults"
          :key="result.prize.id"
          class="prize-result border border-gray-200 rounded-lg p-4 bg-white"
          :class="{ 'animate-fade-in': result.visible }"
        >
          <div class="flex items-start gap-4">
            <div class="prize-icon flex-shrink-0">
              <div class="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <i class="pi pi-trophy text-3xl text-white"></i>
              </div>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h4 class="text-lg font-bold text-gray-800">{{ result.prize.prize_name }}</h4>
                <Tag :value="`Thứ tự: ${result.prize.order || 0}`" severity="info" :rounded="true" />
              </div>
              <p v-if="result.prize.description" class="text-sm text-gray-600 mb-3">
                {{ result.prize.description }}
              </p>
              
              <div v-if="result.winners.length > 0" class="winners-list">
                <p class="text-sm font-medium text-gray-700 mb-2">
                  Người thắng giải ({{ result.winners.length }}/{{ result.prize.quantity }}):
                </p>
                <div class="space-y-2">
                  <div
                    v-for="(winner, winnerIndex) in result.winners"
                    :key="winner.participant_id"
                    class="winner-item bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div class="flex items-center gap-3">
                      <div class="winner-avatar flex-shrink-0">
                        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {{ winner.participant?.full_name?.charAt(0)?.toUpperCase() || '?' }}
                        </div>
                      </div>
                      <div class="flex-1">
                        <p class="font-medium text-gray-800">
                          {{ winner.participant?.full_name || 'Không xác định' }}
                        </p>
                        <div class="flex flex-col gap-2">
                          <p v-if="winner.serial_number" class="text-sm text-gray-500">
                            Số thứ tự: <span class="text-red-600 text-lg font-semibold">{{ winner.serial_number }}</span>
                          </p>
                        </div>
                      </div>
                      <div class="winner-number">
                        <Tag :value="`#${winnerIndex + 1}`" severity="success" :rounded="true" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4 text-gray-500">
                <p>Không có người thắng giải</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state text-center py-8">
      <i class="pi pi-info-circle text-4xl text-gray-400 mb-4"></i>
      <p class="text-gray-600">Chưa có kết quả quay giải</p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          v-if="!isDrawing && drawResults.length > 0"
          label="Đóng"
          icon="pi pi-times"
          @click="handleClose"
          class="p-button-text"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Minigame } from '~/types/minigame'

interface DrawResult {
  prize: {
    id: string
    prize_name: string
    description?: string | null
    image?: string | null
    quantity: number
    order: number
  }
  winners: Array<{
    event_participant_id: string
    participant_id: string
    serial_number?: number | null
    participant: {
      id: string
      full_name: string
      identity_number?: string
      email?: string
    } | null
  }>
  visible?: boolean
}

interface Props {
  modelValue: boolean
  minigame: Minigame | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isDrawing = ref(false)
const drawResults = ref<DrawResult[]>([])
const currentPrize = ref<DrawResult['prize'] | null>(null)

const { drawPrizes: drawPrizesApi } = useMinigames()

const startDrawing = async () => {
  if (!props.minigame?.id) return

  isDrawing.value = true
  drawResults.value = []
  currentPrize.value = null

  try {
    // Gọi API để quay giải
    const results = await drawPrizesApi(props.minigame.id) as DrawResult[]

    // Hiển thị kết quả từng giải một với delay
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (!result || !result.prize) continue
      
      currentPrize.value = result.prize
      
      // Delay để tạo hiệu ứng quay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Thêm kết quả vào danh sách với animation
      const resultWithVisible: DrawResult = { ...result, visible: true }
      drawResults.value.push(resultWithVisible)
    }

    currentPrize.value = null
  } catch (error: any) {
    console.error('Error drawing prizes:', error)
    // Hiển thị lỗi nếu cần
  } finally {
    isDrawing.value = false
  }
}

const handleClose = () => {
  visible.value = false
  // Reset state khi đóng
  setTimeout(() => {
    drawResults.value = []
    currentPrize.value = null
  }, 300)
}

// Tự động bắt đầu quay khi modal mở
watch(visible, (newVal) => {
  if (newVal && props.minigame) {
    startDrawing()
  }
})
</script>

<style scoped>
.minigame-draw-modal :deep(.p-dialog-content) {
  max-height: 70vh;
  overflow-y: auto;
}

.drawing-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-container {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.prize-result {
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.winner-item {
  transition: all 0.3s ease;
}

.winner-item:hover {
  background-color: #f3f4f6;
  transform: translateX(4px);
}
</style>
