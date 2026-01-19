export const useImportLogs = () => {
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
    return await useFetch('/api/import-logs', { query })
  }

  const getById = async (id: string, options?: { relations?: boolean }) => {
    const query: any = {}
    if (options?.relations) query.relations = 'true'
    return await useFetch(`/api/import-logs/${id}`, { query })
  }

  const create = async (data: {
    event_id: string
    file_name: string
    imported_by?: string
    total_rows: number
    success_rows: number
    failed_rows: number
  }) => {
    return await useFetch('/api/import-logs', {
      method: 'POST',
      body: data
    })
  }

  return {
    getPagination,
    getById,
    create
  }
}
