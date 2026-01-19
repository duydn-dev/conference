export const useEventContents = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'
  const getPagination = async (options?: {
    page?: number
    limit?: number
    event_id?: string
    relations?: boolean
    search?: string
  }) => {
    const query: any = {}
    if (options?.page) query.page = options.page
    if (options?.limit) query.limit = options.limit
    if (options?.event_id) query.event_id = options.event_id
    if (options?.search) query.search = options.search
    if (options?.relations) query.relations = 'true'
    return await useFetch('/event-contents', { baseURL, query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/event-contents/${id}`, { baseURL, query })
  }

  const create = async (data: {
    event_id: string
    title: string
    content?: string
    start_time?: string | Date
    end_time?: string | Date
    order_no?: number
  }) => {
    return await useFetch('/event-contents', {
      method: 'POST',
      body: data,
      baseURL
    })
  }

  const update = async (
    id: string,
    data: {
      title?: string
      content?: string
      start_time?: string | Date
      end_time?: string | Date
      order_no?: number
    }
  ) => {
    return await useFetch(`/event-contents/${id}`, {
      method: 'PUT',
      body: data,
      baseURL
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/event-contents/${id}`, {
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
