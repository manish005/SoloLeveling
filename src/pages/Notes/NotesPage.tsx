import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Trash2, Edit3, Check } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  createdAt: number
}

export const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', title: 'Strength Training Plan', content: 'Do 3 sets of pushups, pullups, and squats every weekday morning. Rest on weekends.', createdAt: Date.now() - 86400000 },
    { id: '2', title: 'Trading Strategy Rules', content: '1. Never risk more than 1% per trade.\n2. Keep trading log updated daily.', createdAt: Date.now() },
  ])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return
    if (editingId) {
      setNotes(prev => prev.map(n => n.id === editingId ? { ...n, title, content } : n))
      setEditingId(null)
    } else {
      setNotes(prev => [{ id: Math.random().toString(), title, content, createdAt: Date.now() }, ...prev])
    }
    setTitle('')
    setContent('')
    setShowForm(false)
  }

  const handleEdit = (note: Note) => {
    setEditingId(note.id)
    setTitle(note.title)
    setContent(note.content)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Hunter Notes</h1>
          <p className="text-sm text-gray-500">Document your goals, session plans, and strategies.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setTitle(''); setContent('') }} className="btn-primary gap-2">
          <Plus size={16} /> New Note
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass p-6 space-y-4">
            <h3 className="font-bold text-white text-sm">{editingId ? 'Edit Note' : 'Create Note'}</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-field"
              />
              <textarea
                placeholder="Write your note here..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                className="input-field resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1"><Check size={16} /> Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map(note => (
          <motion.div
            key={note.id}
            layout
            className="glass p-5 flex flex-col justify-between min-h-48 border hover:border-white/10 transition-all duration-300"
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-bold text-white text-sm truncate">{note.title}</h3>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(note)} className="p-1 rounded text-gray-500 hover:text-white transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(note.id)} className="p-1 rounded text-gray-500 hover:text-danger transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 whitespace-pre-line leading-relaxed mb-4">{note.content}</p>
            </div>
            <span className="text-2xs text-gray-600 font-mono self-end">
              {new Date(note.createdAt).toLocaleDateString()}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
