/*
  MÓDULO CRM · servicio
  Propietaria: Ediana Tejada Ureña.
*/
import { apiClient } from '../../../core/api/apiClient'

export const crmService = {
  listContacts: () => apiClient.get('/crm/contacts'),
  createContact: (contact) => apiClient.post('/crm/contacts', contact),
}
