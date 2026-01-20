import type { EventParticipant, CreateEventParticipantDto, UpdateEventParticipantDto } from '~/types/event-participant'

export const useEventParticipants = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  const getPagination = async (options?: {
    page?: number
    limit?: number
    event_id?: string
    participant_id?: string
    status?: number // ParticipantStatus enum value
    relations?: boolean
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.event_id) query.event_id = options.event_id
    if (options?.participant_id) query.participant_id = options.participant_id
    if (options?.status !== undefined) query.status = options.status
    if (options?.relations) query.relations = 'true'
    return await useFetch('/event-participants', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/event-participants/${id}`, { baseURL, query })
  }

  const create = async (data: CreateEventParticipantDto) => {
    return await useFetch('/event-participants', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  const update = async (id: string, data: Partial<UpdateEventParticipantDto>) => {
    return await useFetch(`/event-participants/${id}`, {
      method: 'PUT',
      body: data,
      baseURL
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/event-participants/${id}`, {
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
