export interface QueryFilter {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'in';
  value: any;
}

export interface QueryOptions<T> {
  filters?: QueryFilter[];
  search?: {
    term: string;
    fields: (keyof T)[];
  };
  sortBy?: keyof T;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Puerto universal del repositorio de datos.
 * Desacopla la lógica de negocio y las Server Actions de la capa física (Google Sheets o MySQL).
 */
export interface IDataRepository<T> {
  findMany(options?: QueryOptions<T>): Promise<PaginatedResult<T>>;
  findById(id: string): Promise<T | null>;
  create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  bulkUpdate(updates: { id: string; data: Partial<T> }[]): Promise<{ updatedCount: number }>;
}
