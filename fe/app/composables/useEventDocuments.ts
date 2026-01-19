export const useEventDocuments = () => {
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
    return await useFetch('/api/event-documents', { query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/api/event-documents/${id}`, { query })
  }

  const create = async (data: {
    event_id: string
    file_name: string
    file_path: string
    file_type?: string
    user_files?: string
  }) => {
    return await useFetch('/api/event-documents', {
      method: 'POST',
      body: data
    })
  }

  const update = async (
    id: string,
    data: {
      file_name?: string
      file_path?: string
      file_type?: string
      user_files?: string
    }
  ) => {
    return await useFetch(`/api/event-documents/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  const remove = async (id: string) => {
    return await useFetch(`/api/event-documents/${id}`, {
      method: 'DELETE'
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
