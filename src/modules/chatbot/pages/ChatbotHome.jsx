import { ChatWidget } from '../components/ChatWidget'

export function ChatbotHome() {
  return (
    <div>
      <span className="badge" style={{ color: 'var(--color-chatbot)', borderColor: 'var(--color-chatbot)' }}>Módulo IA / Chatbot</span>
      <h2>Asistente inteligente</h2>
      <ChatWidget />
    </div>
  )
}
