import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    key: 'business',
    title: 'Add your business info',
    description: 'Set your business name, phone, and email so clients see your details in their portal.',
    to: '/settings',
    cta: 'Go to Settings',
  },
  {
    key: 'service',
    title: 'Create your first service',
    description: 'Add the types of services you offer (e.g. Overnight Stay, Drop-In Visit, Dog Walking).',
    to: '/settings',
    cta: 'Go to Settings',
  },
  {
    key: 'client',
    title: 'Add your first client',
    description: 'Add a client with their contact info, emergency contact, and vet details.',
    to: '/clients',
    cta: 'Go to Clients',
  },
  {
    key: 'pet',
    title: 'Add a pet',
    description: 'Add a pet for your client — species, breed, medical notes, and a photo.',
    to: '/pets',
    cta: 'Go to Pets',
  },
  {
    key: 'booking',
    title: 'Create your first booking',
    description: 'Schedule a service for a client and their pet.',
    to: '/bookings',
    cta: 'Go to Bookings',
  },
]

function Step({ step, done, isLast }) {
  return (
    <div className={cn('flex gap-4 pb-5', !isLast && 'border-b border-surface-border')}>
      <div className="flex-shrink-0 mt-0.5">
        {done
          ? <CheckCircle2 className="w-5 h-5 text-teal" />
          : <Circle className="w-5 h-5 text-navy-200" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', done ? 'text-navy-300 line-through' : 'text-navy')}>
          {step.title}
        </p>
        {!done && (
          <>
            <p className="text-xs text-navy-300 mt-0.5 mb-2">{step.description}</p>
            <Link
              to={step.to}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal hover:text-teal-700"
            >
              {step.cta} <ArrowRight className="w-3 h-3" />
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function OnboardingChecklist({ checks, onDismiss }) {
  const [collapsed, setCollapsed] = useState(false)

  const stepsDone = {
    business: checks.hasBusiness,
    service:  checks.hasService,
    client:   checks.hasClient,
    pet:      checks.hasPet,
    booking:  checks.hasBooking,
  }

  const completedCount = Object.values(stepsDone).filter(Boolean).length
  const allDone = completedCount === STEPS.length

  if (allDone) return null

  return (
    <div className="card p-5 border-l-4 border-l-teal">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-navy">Getting Started</h2>
          <span className="text-xs font-semibold text-teal bg-teal/10 px-2 py-0.5 rounded-full">
            {completedCount} / {STEPS.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="btn-ghost p-1.5 rounded-lg"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={onDismiss}
            className="btn-ghost p-1.5 rounded-lg"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-teal rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
        />
      </div>

      {!collapsed && (
        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <Step
              key={step.key}
              step={step}
              done={stepsDone[step.key]}
              isLast={i === STEPS.length - 1}
            />
          ))}
        </div>
      )}

      {collapsed && (
        <p className="text-xs text-navy-300">
          {STEPS.length - completedCount} step{STEPS.length - completedCount !== 1 ? 's' : ''} remaining — click to expand
        </p>
      )}
    </div>
  )
}
