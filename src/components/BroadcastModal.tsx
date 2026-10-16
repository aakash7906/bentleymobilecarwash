import React, { useState } from 'react'

interface BroadcastModalProps {
  isOpen: boolean
  onClose: () => void
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose }) => {
  const [targetVan, setTargetVan] = useState('all')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'normal' | 'urgent'>('urgent')
  const [sent, setSent] = useState(false)

  if (!isOpen) return null

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setMessage('')
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-[var(--radius-box-lg)] shadow-2xl border border-[var(--border-light)] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-[var(--color-primary)]">
              campaign
            </span>
            <h3 className="text-base font-extrabold text-[var(--text-main)]">
              Broadcast Fleet Alert
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[var(--surface-alt)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSend} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[var(--text-main)]">Target Recipient</label>
            <select
              value={targetVan}
              onChange={(e) => setTargetVan(e.target.value)}
              className="app-input px-3 py-2 text-xs w-full bg-white font-medium"
            >
              <option value="all">All 4 Vans on Route (Kelowna + Lake Country)</option>
              <option value="van4">Van 4 - Raheem (Enterprise &amp; Water St)</option>
              <option value="van2">Van 2 - Marcus (Bernard Ave)</option>
              <option value="van1">Van 1 - Standby Base</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[var(--text-main)]">Alert Priority</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPriority('urgent')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-[var(--radius-btn-sm)] border cursor-pointer ${
                  priority === 'urgent'
                    ? 'bg-red-50 text-[var(--color-primary)] border-[var(--color-primary)]'
                    : 'bg-white text-[var(--text-muted)] border-[var(--border-light)]'
                }`}
              >
                🚨 Urgent Broadcast
              </button>
              <button
                type="button"
                onClick={() => setPriority('normal')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-[var(--radius-btn-sm)] border cursor-pointer ${
                  priority === 'normal'
                    ? 'bg-slate-100 text-[var(--text-main)] border-slate-400'
                    : 'bg-white text-[var(--text-muted)] border-[var(--border-light)]'
                }`}
              >
                Standard Notification
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[var(--text-main)]">Alert Message</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Weather shift in Lake Country: switch to covered driveway protocols."
              className="app-input p-3 text-xs w-full resize-none"
              required
            />
          </div>

          {sent ? (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-[var(--radius-box-sm)] text-center border border-emerald-200">
              ✓ Broadcast dispatched to in-vehicle tablets &amp; mobile phones!
            </div>
          ) : (
            <button type="submit" className="btn-primary py-2.5 text-xs font-bold w-full">
              Send Fleet Broadcast
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
