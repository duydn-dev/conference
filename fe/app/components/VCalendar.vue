<template>
  <Calendar 
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    :showTime="showTime"
    :hourFormat="hourFormat"
    :dateFormat="dateFormat"
    :placeholder="placeholder"
    :locale="locale"
    class="w-full"
    :inputClass="inputClass"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import Calendar from 'primevue/calendar'

interface Props {
  modelValue?: Date | Date[] | string | string[] | null
  showTime?: boolean
  hourFormat?: '12' | '24'
  dateFormat?: string
  placeholder?: string
  inputClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  showTime: false,
  hourFormat: '24',
  dateFormat: 'dd/mm/yy',
  placeholder: '',
  inputClass: 'w-full'
})

const emit = defineEmits<{
  'update:modelValue': [value: Date | Date[] | string | string[] | null]
}>()

const locale = {
  firstDayOfWeek: 1,
  dayNames: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  dayNamesShort: ['CN', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'],
  dayNamesMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  monthNames: [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],
  monthNamesShort: [
    'Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6',
    'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'
  ],
  today: 'Hôm nay',
  clear: 'Xóa',
  weekHeader: 'Tuần'
}
</script>
