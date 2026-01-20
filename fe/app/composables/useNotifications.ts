import type { Notification, CreateNotificationDto, UpdateNotificationDto } from '~/types/notification'

export const useNotifications = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  const getPagination = async (options?: {
    page?: number
    limit?: number
    event_id?: string
    type?: number // NotificationType enum value
    relations?: boolean
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.event_id) query.event_id = options.event_id
    if (options?.type !== undefined) query.type = options.type
    if (options?.relations) query.relations = 'true'
    return await useFetch('/notifications', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/notifications/${id}`, { baseURL, query })
  }

  const create = async (data: CreateNotificationDto) => {
    return await useFetch('/notifications', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  const update = async (id: string, data: Partial<UpdateNotificationDto>) => {
    return await useFetch(`/notifications/${id}`, {
      method: 'PUT',
      body: data,
      baseURL
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/notifications/${id}`, {
      method: 'DELETE',
      baseURL
    })
  }

  return {
    getPagination,
    getById,
    create,
    update,
    remove
  }
}
