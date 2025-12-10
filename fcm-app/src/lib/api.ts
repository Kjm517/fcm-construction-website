// API utility functions with localStorage fallback

const API_BASE = '/api'

// Helper to transform database fields to frontend format
export const transformProject = (dbProject: any) => {
  if (!dbProject) {
    return null
  }
  
  // Check if it's already in frontend format (from localStorage)
  if (dbProject.projectName !== undefined) {
    const transformed = {
      id: dbProject.id,
      projectName: dbProject.projectName,
      clientName: dbProject.clientName,
      clientContact: dbProject.clientContact || '',
      buildingAddress: dbProject.buildingAddress,
      workType: dbProject.workType,
      scopeOfWork: dbProject.scopeOfWork,
      projectCost: dbProject.projectCost || '',
      deadlineDate: dbProject.deadlineDate,
      createdAt: dbProject.createdAt || (dbProject.created_at ? new Date(dbProject.created_at).getTime() : Date.now()),
      updatedAt: dbProject.updatedAt || (dbProject.updated_at ? new Date(dbProject.updated_at).getTime() : dbProject.createdAt || Date.now()),
      lastEditedBy: dbProject.lastEditedBy || dbProject.last_edited_by || undefined,
      files: dbProject.files || undefined, // Preserve files array
      tasks: dbProject.tasks || [], // Preserve tasks array
    }
    return transformed
  }
  
  // Transform from database format (snake_case)
  if (dbProject.project_name !== undefined) {
    return {
      id: dbProject.id,
      projectName: dbProject.project_name || '',
      clientName: dbProject.client_name || '',
      clientContact: dbProject.client_contact || '',
      buildingAddress: dbProject.building_address || '',
      workType: dbProject.work_type || '',
      scopeOfWork: dbProject.scope_of_work || '',
      projectCost: dbProject.project_cost || '',
      deadlineDate: dbProject.deadline_date || '',
      createdAt: dbProject.created_at ? new Date(dbProject.created_at).getTime() : Date.now(),
      updatedAt: dbProject.updated_at ? new Date(dbProject.updated_at).getTime() : (dbProject.created_at ? new Date(dbProject.created_at).getTime() : Date.now()),
      lastEditedBy: dbProject.last_edited_by || dbProject.lastEditedBy || 'Admin',
      files: dbProject.files || undefined,
      tasks: dbProject.tasks || [],
    }
  }
  
  return null
}

// Helper to transform frontend format to database format
// Note: This returns camelCase for API routes that expect camelCase
// The API routes will convert to snake_case for the database
export const transformProjectForDB = (project: any) => ({
  projectName: project.projectName,
  clientName: project.clientName,
  clientContact: project.clientContact || null,
  buildingAddress: project.buildingAddress,
  workType: project.workType,
  scopeOfWork: project.scopeOfWork,
  projectCost: project.projectCost || null,
  deadlineDate: project.deadlineDate,
  lastEditedBy: project.lastEditedBy || null,
  files: project.files || null, // Pass files array
  tasks: project.tasks || null, // Pass tasks array
})

// Helper to transform quotation database fields to frontend format
export const transformQuotation = (dbQuotation: any) => {
  // Handle both database format (snake_case) and frontend format (camelCase)
  const quotation = {
    id: dbQuotation.id,
    quotationNumber: dbQuotation.quotation_number || dbQuotation.quotationNumber,
    date: dbQuotation.date,
    validUntil: dbQuotation.valid_until || dbQuotation.validUntil,
    clientName: dbQuotation.client_name || dbQuotation.clientName,
    jobDescription: dbQuotation.job_description || dbQuotation.jobDescription,
    clientContact: dbQuotation.client_contact || dbQuotation.clientContact || '',
    installationAddress: dbQuotation.installation_address || dbQuotation.installationAddress,
    attention: dbQuotation.attention || '',
    totalDue: dbQuotation.total_due || dbQuotation.totalDue,
    terms: dbQuotation.terms || [],
    termsTemplate: dbQuotation.terms_template || dbQuotation.termsTemplate || 'template1',
    items: dbQuotation.items || [],
    status: dbQuotation.status || 'Draft',
    createdAt: dbQuotation.created_at ? new Date(dbQuotation.created_at).getTime() : (dbQuotation.createdAt || Date.now()),
    updatedAt: dbQuotation.updated_at ? new Date(dbQuotation.updated_at).getTime() : (dbQuotation.updatedAt || undefined),
    lastEditedBy: dbQuotation.last_edited_by || dbQuotation.lastEditedBy || undefined,
    createdBy: dbQuotation.created_by || dbQuotation.createdBy || undefined,
  };
  
  // Ensure items is always an array
  if (!Array.isArray(quotation.items)) {
    quotation.items = [];
  }
  
  return quotation;
}

// Helper to transform frontend format to database format for quotations
export const transformQuotationForDB = (quotation: any) => ({
  quotationNumber: quotation.quotationNumber,
  date: quotation.date,
  validUntil: quotation.validUntil,
  clientName: quotation.clientName,
  jobDescription: quotation.jobDescription,
  clientContact: quotation.clientContact || null,
  installationAddress: quotation.installationAddress,
  attention: quotation.attention || null,
  totalDue: quotation.totalDue,
  terms: quotation.terms || null,
  termsTemplate: quotation.termsTemplate || 'template1',
  items: quotation.items || null,
  status: quotation.status || 'Draft',
  lastEditedBy: quotation.lastEditedBy || null,
  createdBy: quotation.createdBy || null,
})

// Projects API
export const projectsAPI = {
  async getAll(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/projects`)
      const data = await response.json()
      
      // If we get an empty array and Supabase is not configured, use localStorage
      if (Array.isArray(data) && data.length === 0) {
        const localData = this.getFromLocalStorage()
        if (localData.length > 0) {
          return localData
        }
      }
      
      // Transform and return data
      if (Array.isArray(data)) {
        return data.map(transformProject)
      }
      
      // Fallback to localStorage if response is not an array
      return this.getFromLocalStorage()
    } catch (error) {
      console.error('Error fetching projects:', error)
      return this.getFromLocalStorage()
    }
  },

  async getById(id: string): Promise<any | null> {
    try {
      // Encode the ID to handle UUIDs and special characters
      const encodedId = encodeURIComponent(id)
      const response = await fetch(`${API_BASE}/projects/${encodedId}`)
      
      // Check if response has error
      if (!response.ok) {
        let errorData: any = {}
        const contentType = response.headers.get('content-type')
        
        // Only try to parse JSON if content-type indicates JSON
        if (contentType && contentType.includes('application/json')) {
          try {
            const text = await response.text()
            if (text) {
              errorData = JSON.parse(text)
            }
          } catch (e) {
            // If parsing fails, errorData remains empty object
          }
        }
        
        // Try localStorage as fallback
        const localData = this.getByIdFromLocalStorage(id)
        if (localData) {
          return transformProject(localData)
        }
        return null
      }
      
      const data = await response.json()
      
      // Check if response contains an error object
      if (data && data.error) {
        // Try localStorage as fallback
        const localData = this.getByIdFromLocalStorage(id)
        if (localData) {
          return transformProject(localData)
        }
        return null
      }
      
      // If data exists and has an id, transform and return it
      if (data && (data.id || data.project_name || data.projectName)) {
        return transformProject(data)
      }
      
      // If no data from API, try localStorage
      const localData = this.getByIdFromLocalStorage(id)
      if (localData) {
        return transformProject(localData)
      }
      
      return null
    } catch (error) {
      console.error('Error fetching project:', error)
      // On error, try localStorage
      const localData = this.getByIdFromLocalStorage(id)
      if (localData) {
        return transformProject(localData)
      }
      return null
    }
  },

  async create(project: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformProjectForDB(project)),
      })
      const data = await response.json()
      
      // If we get a temp ID, it means Supabase is not configured, use localStorage
      if (data && data.id && data.id.startsWith('temp-')) {
        return this.createInLocalStorage(project)
      }
      
      if (data) {
        return transformProject(data)
      }
      
      return this.createInLocalStorage(project)
    } catch (error) {
      console.error('Error creating project:', error)
      return this.createInLocalStorage(project)
    }
  },

  async update(id: string, project: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformProjectForDB(project)),
      })
      const data = await response.json()
      
      // Check for API errors first
      if (!response.ok) {
        console.error('API update failed:', response.status, data)
        return this.updateInLocalStorage(id, project)
      }
      
      // If data exists and has the expected structure, transform it
      if (data && data.id) {
        return transformProject(data)
      }
      
      // Otherwise fallback to localStorage
      return this.updateInLocalStorage(id, project)
    } catch (error) {
      console.error('Error updating project:', error)
      return this.updateInLocalStorage(id, project)
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      
      // If we get success response, return true
      if (data && data.success) {
        return true
      }
      
      // Otherwise fallback to localStorage
      return this.deleteFromLocalStorage(id)
    } catch (error) {
      console.error('Error deleting project:', error)
      return this.deleteFromLocalStorage(id)
    }
  },

  // LocalStorage fallback methods
  getFromLocalStorage(): any[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('projects')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return []
  },

  getByIdFromLocalStorage(id: string): any | null {
    if (typeof window === 'undefined') return null
    try {
      const projects = this.getFromLocalStorage()
      // Try exact match first
      let found = projects.find((p: any) => p.id === id || p.id?.toString() === id?.toString())
      
      // If not found, try to find by string comparison (handles UUID vs string mismatch)
      if (!found) {
        found = projects.find((p: any) => {
          const pId = p.id?.toString().toLowerCase()
          const searchId = id?.toString().toLowerCase()
          return pId === searchId
        })
      }
      
      return found || null
    } catch (error) {
      console.error('Error getting project from localStorage:', error)
      return null
    }
  },

  createInLocalStorage(project: any): any {
    const projects = this.getFromLocalStorage()
    const newProject = {
      ...project,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    projects.push(newProject)
    if (typeof window !== 'undefined') {
      localStorage.setItem('projects', JSON.stringify(projects))
    }
    return newProject
  },

  updateInLocalStorage(id: string, project: any): any {
    const projects = this.getFromLocalStorage()
    const index = projects.findIndex((p: any) => {
      const pId = String(p.id || '').toLowerCase().trim()
      const searchId = String(id || '').toLowerCase().trim()
      return pId === searchId || pId.includes(searchId) || searchId.includes(pId)
    })
    if (index !== -1) {
      // Get current user for lastEditedBy
      const currentUser = typeof window !== 'undefined' 
        ? (localStorage.getItem('admin-username') || 'Admin')
        : 'Admin'
      
      projects[index] = {
        ...projects[index],
        ...project,
        id: projects[index].id || id, // Preserve original ID
        updatedAt: Date.now(),
        lastEditedBy: project.lastEditedBy || currentUser,
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('projects', JSON.stringify(projects))
      }
      return projects[index]
    }
    return null
  },

  deleteFromLocalStorage(id: string): boolean {
    const projects = this.getFromLocalStorage()
    const filtered = projects.filter((p: any) => p.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('projects', JSON.stringify(filtered))
    }
    return true
  },
}

// Quotations API
export const quotationsAPI = {
  async getAll(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/quotations`)
      const data = await response.json()
      
      // Always prioritize database response
      if (Array.isArray(data)) {
        // Transform and return data from database (even if empty)
        return data.map(transformQuotation)
      }
      
      // Only fallback to localStorage if response is not an array (error case)
      return this.getFromLocalStorage()
    } catch (error) {
      console.error('Error fetching quotations:', error)
      // Only use localStorage as last resort on network errors
      return this.getFromLocalStorage()
    }
  },

  async getById(id: string): Promise<any | null> {
    try {
      // Encode the ID to handle UUIDs and special characters
      const encodedId = encodeURIComponent(id)
      const response = await fetch(`${API_BASE}/quotations/${encodedId}`)
      
      // Check if response has error
      if (!response.ok) {
        let errorData: any = {}
        const contentType = response.headers.get('content-type')
        
        // Only try to parse JSON if content-type indicates JSON
        if (contentType && contentType.includes('application/json')) {
          try {
            const text = await response.text()
            if (text) {
              errorData = JSON.parse(text)
            }
          } catch (e) {
            // If parsing fails, errorData remains empty object
          }
        }
        
        // Try localStorage as fallback
        const localData = this.getByIdFromLocalStorage(id)
        if (localData) {
          return transformQuotation(localData)
        }
        return null
      }
      
      const data = await response.json()
      
      // Check if response contains an error object
      if (data && data.error) {
        // Try localStorage as fallback
        const localData = this.getByIdFromLocalStorage(id)
        if (localData) {
          return transformQuotation(localData)
        }
        return null
      }
      
      // If data exists and has an id, transform and return it
      if (data && (data.id || data.quotation_number || data.quotationNumber)) {
        return transformQuotation(data)
      }
      
      // If no data from API, try localStorage
      const localData = this.getByIdFromLocalStorage(id)
      if (localData) {
        return transformQuotation(localData)
      }
      
      return null
    } catch (error) {
      console.error('Error fetching quotation:', error)
      // On error, try localStorage
      const localData = this.getByIdFromLocalStorage(id)
      if (localData) {
        return transformQuotation(localData)
      }
      return null
    }
  },

  async create(quotation: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformQuotationForDB(quotation)),
      })
      const data = await response.json()
      
      // If we get a temp ID, it means Supabase is not configured, use localStorage
      if (data && data.id && data.id.startsWith('temp-')) {
        return this.createInLocalStorage(quotation)
      }
      
      if (data) {
        return transformQuotation(data)
      }
      
      return this.createInLocalStorage(quotation)
    } catch (error) {
      console.error('Error creating quotation:', error)
      return this.createInLocalStorage(quotation)
    }
  },

  async update(id: string, quotation: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformQuotationForDB(quotation)),
      })
      const data = await response.json()
      
      // If data exists and has the expected structure, transform it
      if (data && data.id) {
        return transformQuotation(data)
      }
      
      // Otherwise fallback to localStorage
      return this.updateInLocalStorage(id, quotation)
    } catch (error) {
      console.error('Error updating quotation:', error)
      return this.updateInLocalStorage(id, quotation)
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/quotations/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      
      // If we get success response, return true
      if (data && data.success) {
        return true
      }
      
      // Otherwise fallback to localStorage
      return this.deleteFromLocalStorage(id)
    } catch (error) {
      console.error('Error deleting quotation:', error)
      return this.deleteFromLocalStorage(id)
    }
  },

  // LocalStorage fallback methods
  getFromLocalStorage(): any[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('quotations')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return []
  },

  getByIdFromLocalStorage(id: string): any | null {
    const quotations = this.getFromLocalStorage()
    return quotations.find((q: any) => q.id === id) || null
  },

  createInLocalStorage(quotation: any): any {
    const quotations = this.getFromLocalStorage()
    const newQuotation = {
      ...quotation,
      id: Date.now().toString(),
      status: quotation.status || 'Draft',
      createdAt: Date.now(),
    }
    quotations.push(newQuotation)
    if (typeof window !== 'undefined') {
      localStorage.setItem('quotations', JSON.stringify(quotations))
    }
    return newQuotation
  },

  updateInLocalStorage(id: string, quotation: any): any {
    const quotations = this.getFromLocalStorage()
    const index = quotations.findIndex((q: any) => q.id === id)
    if (index !== -1) {
      quotations[index] = {
        ...quotations[index],
        ...quotation,
        id,
        termsTemplate: quotation.termsTemplate || 'template1', // Ensure termsTemplate is preserved
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('quotations', JSON.stringify(quotations))
      }
      return quotations[index]
    }
    return null
  },

  deleteFromLocalStorage(id: string): boolean {
    const quotations = this.getFromLocalStorage()
    const filtered = quotations.filter((q: any) => q.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('quotations', JSON.stringify(filtered))
    }
    return true
  },
}

