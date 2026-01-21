import type { CreateEventDto, UpdateEventDto } from '~/types/event'

export const useEvents = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  const getPagination = async (options?: {
    page?: number
    limit?: number
    status?: number // EventStatus enum value
    relations?: boolean
    search?: string
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.status) query.status = options.status
    if (options?.search) query.search = options.search
    if (options?.relations) query.relations = 'true'
    return await $fetch('/events', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await $fetch(`/events/${id}`, { baseURL, query })
  }

  const create = async (data: CreateEventDto) => {
    return await $fetch('/events', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  const update = async (id: string, data: Partial<UpdateEventDto>) => {
    return await $fetch(`/events/${id}`, {
      method: 'PUT',
      body: data,
      baseURL
    })
  }

  const remove = async (id: string) => {
    return await $fetch(`/events/${id}`, {
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
