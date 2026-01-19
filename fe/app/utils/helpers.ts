import moment from 'moment'
import 'moment/locale/vi'

// Set default locale to Vietnamese
moment.locale('vi')

// Utility functions
export const formatDate = (date: string | Date, format: string = 'DD/MM/YYYY HH:mm'): string => {
  return moment(date).format(format)
}

export const formatDateShort = (date: string | Date): string => {
  return moment(date).format('DD/MM/YYYY')
}

export const formatDateTime = (date: string | Date): string => {
  return moment(date).format('DD/MM/YYYY HH:mm')
}

export const formatDateLong = (date: string | Date): string => {
  return moment(date).format('DD MMM YYYY, HH:mm')
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}
