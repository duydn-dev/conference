import type { ImportLog, CreateImportLogDto } from '~/types/import-log'

export const useImportLogs = () => {
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
    return await $fetch('/import-logs', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await $fetch(`/import-logs/${id}`, { baseURL, query })
  }

  const create = async (data: CreateImportLogDto) => {
    return await useFetch('/import-logs', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  return {
    getPagination,
    getById,
    create
  }
}
