interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  className?: string
  size?: 'sm' | 'md'
  disabled?: boolean
}

export const ToggleSwitch = ({ checked, onChange, className = "", size = 'md', disabled = false }: ToggleSwitchProps) => {
  const sizeClasses = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11'
  const thumbSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const translateX = size === 'sm' ? (checked ? 'translate-x-4' : 'translate-x-0.5') : (checked ? 'translate-x-6' : 'translate-x-1')

  const handleClick = () => {
    if (!disabled) {
      onChange()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative inline-flex ${sizeClasses} items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      style={{
        backgroundColor: checked ? '#374151' : '#e5e7eb',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <span
        className={`inline-block ${thumbSize} transform rounded-full bg-white transition-transform duration-200 ease-in-out ${translateX}`}
        style={{
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      />
    </button>
  )
} 