import type { NotificationReceiver, CreateNotificationReceiverDto, UpdateNotificationReceiverDto } from '~/types/notification-receiver'

export const useNotificationReceivers = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  const getPagination = async (options?: {
    page?: number
    limit?: number
    notification_id?: string
    participant_id?: string
    relations?: boolean
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.notification_id) query.notification_id = options.notification_id
    if (options?.participant_id) query.participant_id = options.participant_id
    if (options?.relations) query.relations = 'true'
    return await useFetch('/notification-receivers', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/notification-receivers/${id}`, { baseURL, query })
  }

  const create = async (data: CreateNotificationReceiverDto) => {
    return await useFetch('/notification-receivers', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  const update = async (id: string, data: Partial<UpdateNotificationReceiverDto>) => {
    return await useFetch(`/notification-receivers/${id}`, {
      method: 'PUT',
      body: data,
      baseURL
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/notification-receivers/${id}`, {
      method: 'DELETE',
      baseURL
    })
  }

  const markAllAsReadByNotification = async (notificationId: string) => {
    return await useFetch(`/notification-receivers/mark-read-by-notification/${notificationId}`, {
      method: 'PATCH',
      baseURL
    })
  }

  return {
    getPagination,
    getById,
    create,
    update,
    remove,
    markAllAsReadByNotification,
  }
}
