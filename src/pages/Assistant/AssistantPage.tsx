import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Send, User, Zap } from 'lucide-react'

interface Message {
  id: string
  sender: 'ai' | 'user'
  text: string
  timestamp: number
}

const SYSTEM_GREETINGS = [
  "Welcome back, Hunter. The System is fully initialized.",
  "Warning: Do not neglect your daily quests. The penalty for failure is severe.",
  "Analyze: Your discipline skill has increased by 12% this week.",
  "Suggestion: Complete 'Coding Practice' quest to level up your Intelligence skill.",
]

export const AssistantPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "System Assistant initialized. Ask me for quest suggestions, productivity tips, or daily motivation.",
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: input,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      let aiText = "Analyzing input... No relevant data found. Continue training to unlock more suggestions."
      const lower = input.toLowerCase()
      if (lower.includes('motivation')) {
        aiText = "Do not fear the struggle. The path to Monarch requires absolute consistency. Complete your daily quests now."
      } else if (lower.includes('suggest') || lower.includes('quest')) {
        aiText = "Based on your current abilities: I suggest practicing coding for 45 minutes (Intelligence) or completing 20 pushups (Strength)."
      } else if (lower.includes('tip') || lower.includes('productivity')) {
        aiText = "Tip: Break down epic quests into small, repeatable daily habits. The accumulation of micro-habits yields transcendent results."
      }

      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        text: aiText,
        timestamp: Date.now(),
      }])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col glass rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center gap-3 bg-white/[0.02]">
        <div className="w-10 h-10 rounded-xl bg-primary-gradient flex items-center justify-center shrink-0">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white text-sm">System Assistant</h2>
          <span className="text-2xs text-success flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Active
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto no-scrollbar space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              msg.sender === 'user' ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-primary/20 border-primary/30'}`}>
              {msg.sender === 'user' ? <User size={15} /> : <Zap size={15} className="text-primary" />}
            </div>
            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
              msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white/[0.02] border border-white/[0.06] text-gray-300'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <Zap size={15} className="text-primary" />
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={listRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask assistant... (e.g. 'Give me motivation', 'Suggest a quest')"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="input-field flex-1"
          />
          <button onClick={handleSend} className="btn-primary !p-3 rounded-xl shrink-0">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
