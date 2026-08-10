/*
  MÓDULO CHATBOT / IA · servicio
  Propietarios: Daniel Morales (agentes IA) y Francisco Rosendo Diaz (NLP/chatbot).
*/
import { apiClient } from '../../../core/api/apiClient'

export const chatbotService = {
  sendMessage: (message) => apiClient.post('/ai/agent', { message }),
}
