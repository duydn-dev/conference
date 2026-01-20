import type { OrganizerUnit, CreateOrganizerUnitDto, UpdateOrganizerUnitDto } from '~/types/organizer-unit'

export const useOrganizerUnits = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  const getPagination = async (options?: {
    page?: number
    limit?: number
    relations?: boolean
    search?: string
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.relations) query.relations = 'true'
    if (options?.search) query.search = options.search
    return await useFetch('/organizer-units', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/organizer-units/${id}`, { baseURL, query })
  }

  const create = async (data: CreateOrganizerUnitDto) => {
    return await useFetch('/organizer-units', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  const update = async (id: string, data: Partial<UpdateOrganizerUnitDto>) => {
    return await useFetch(`/organizer-units/${id}`, {
      method: 'PATCH',
      body: data,
      baseURL
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/organizer-units/${id}`, {
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
