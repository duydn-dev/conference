import type { EventDocument, CreateEventDocumentDto, UpdateEventDocumentDto } from '~/types/event-document'

export const useEventDocuments = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  const getPagination = async (options?: {
    page?: number
    limit?: number
    event_id?: string
    relations?: boolean
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.event_id) query.event_id = options.event_id
    if (options?.relations) query.relations = 'true'
    return await $fetch('/event-documents', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await $fetch(`/event-documents/${id}`, { baseURL, query })
  }

  const create = async (data: CreateEventDocumentDto) => {
    return await useFetch('/event-documents', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  const update = async (id: string, data: Partial<UpdateEventDocumentDto>) => {
    return await useFetch(`/event-documents/${id}`, {
      method: 'PUT',
      body: data,
      baseURL
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/event-documents/${id}`, {
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
