import type { Participant, CreateParticipantDto, UpdateParticipantDto } from '~/types/participant'

export const useParticipants = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  const getPagination = async (options?: {
    page?: number
    limit?: number
    identity_number?: string
    relations?: boolean
    search?: string
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.identity_number) query.identity_number = options.identity_number
    if (options?.search) query.search = options.search
    if (options?.relations) query.relations = 'true'
    return await $fetch('/participants', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await $fetch(`/participants/${id}`, { baseURL, query })
  }

  const create = async (data: CreateParticipantDto) => {
    return await useFetch('/participants', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  const update = async (id: string, data: Partial<UpdateParticipantDto>) => {
    return await useFetch(`/participants/${id}`, {
      method: 'PUT',
      body: data,
      baseURL
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/participants/${id}`, {
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
