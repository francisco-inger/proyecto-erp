import { useState } from 'react'
import { chatbotService } from '../services/chatbot.service'

export function ChatWidget() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: '¡Hola! Soy el asistente del ERP. ¿En qué te ayudo?' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim()) return
    const userMessage = { from: 'user', text: input }
    setMessages((m) => [...m, userMessage])
    setInput('')
    setSending(true)
    try {
      // USE_MOCK en el core hará que esto falle hasta que el backend de
      // Daniel/Francisco esté listo; se deja envuelto en try/catch a propósito.
      const reply = await chatbotService.sendMessage(userMessage.text)
      setMessages((m) => [...m, { from: 'bot', text: reply?.text ?? '(respuesta del agente IA)' }])
    } catch {
      setMessages((m) => [...m, { from: 'bot', text: 'Aún no estoy conectado al backend de IA.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxHeight: 240, overflowY: 'auto' }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
              background: m.from === 'user' ? 'var(--color-accent)' : 'var(--color-surface-alt)',
              color: m.from === 'user' ? 'var(--color-accent-ink)' : 'var(--color-ink)',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 14,
              maxWidth: '80%',
            }}
          >
            {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje…"
          style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--color-line)', borderRadius: 6 }}
        />
        <button className="btn btn-primary" type="submit" disabled={sending}>Enviar</button>
      </form>
    </div>
  )
}
