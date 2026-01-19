export const useEvents = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  const getPagination = async (options?: {
    page?: number
    limit?: number
    status?: 'draft' | 'published' | 'closed' | 'cancelled'
    relations?: boolean
    search?: string
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.status) query.status = options.status
    if (options?.search) query.search = options.search
    if (options?.relations) query.relations = 'true'
    return await useFetch('/events', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/events/${id}`, { baseURL, query })
  }

  const create = async (data: {
    code: string
    name: string
    description?: string
    start_time: string | Date
    end_time: string | Date
    location_name?: string
    location?: string
    organizer_unit_id?: string
    representative_name?: string
    representative_identity?: string
    status?: 'draft' | 'published' | 'closed' | 'cancelled'
  }) => {
    return await useFetch('/events', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  const update = async (
    id: string,
    data: {
      code?: string
      name?: string
      description?: string
      start_time?: string | Date
      end_time?: string | Date
      location_name?: string
      location?: string
      organizer_unit_id?: string
      representative_name?: string
      representative_identity?: string
      status?: 'draft' | 'published' | 'closed' | 'cancelled'
    }
  ) => {
    return await useFetch(`/events/${id}`, {
      method: 'PUT',
      body: data,
      baseURL
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/events/${id}`, {
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
