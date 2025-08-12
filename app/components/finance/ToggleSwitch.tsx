interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  className?: string
  disabled?: boolean
}

export const ToggleSwitch = ({ checked, onChange, className = "", disabled = false }: ToggleSwitchProps) => {
  const isDisabled = disabled || className.includes("cursor-not-allowed")
  
  return (
    <button
      onClick={isDisabled ? undefined : onChange}
      disabled={isDisabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      style={{
        backgroundColor: checked ? '#374151' : '#e5e7eb',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
        style={{
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      />
    </button>
  )
}
