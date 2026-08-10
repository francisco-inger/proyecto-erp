import { registerModule } from '../../core/moduleRegistry'
import { ChatbotHome } from './pages/ChatbotHome'

registerModule({
  id: 'chatbot',
  name: 'Asistente IA',
  path: '/chatbot',
  color: 'var(--color-chatbot)',
  requiredRole: null, // visible para todos los roles
  element: <ChatbotHome />,
})
