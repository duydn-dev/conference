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
  return moment(date).format('dddd, DD [tháng] M [năm] YYYY, HH:mm')
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}
export function formatTimeDifferenceCustom(startTime: any, endTime: any) {
  const now = moment(new Date());
  const start = moment(startTime);
  const end = moment(endTime);
  const duration = moment.duration(start.diff(now));
  
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  
  // Logic hiển thị theo yêu cầu của bạn
  if(now > end){
    return "Đã kết thúc";
  }
  if (days > 0) {
    return `Bắt đầu sau: ${days} ngày, ${hours} giờ, ${minutes} phút`;
  } else if (hours > 0) {
    return `Bắt đầu sau: ${hours} giờ, ${minutes} phút`;
  } else if (minutes > 0) {
    return `Bắt đầu sau: ${minutes} phút`;
  } else {
    return "Đã bắt đầu";
  }
}