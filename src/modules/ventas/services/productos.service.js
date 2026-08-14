/*
  MÓDULO VENTAS - SERVICIO DE PRODUCTOS
  Propietario: Sistema de Ventas.
  
  Obtiene la lista de productos disponibles del inventario.
  Soporta búsqueda y carga de datos.
*/
import { apiClient } from '../../../core/api/apiClient'

export const productosService = {
  /**
   * Obtiene la lista completa de productos activos.
   */
  listAll: () => apiClient.get('/products'),

  /**
   * Obtiene un producto específico por su ID.
   */
  getById: (id) => apiClient.get(`/products/${id}`),

  /**
   * Busca productos por nombre o descripción.
   * Filtra en el cliente (frontend) por rendimiento.
   */
  search: async (query) => {
    try {
      const productos = await apiClient.get('/products')
      if (!query || query.trim() === '') {
        return productos
      }
      
      const lowerQuery = query.toLowerCase()
      return productos.filter(p =>
        p.nombre.toLowerCase().includes(lowerQuery) ||
        p.descripcion?.toLowerCase().includes(lowerQuery)
      )
    } catch (error) {
      console.error('Error buscando productos:', error)
      return []
    }
  }
}
