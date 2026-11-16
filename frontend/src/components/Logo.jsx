import { Box } from 'lucide-react'

export default function Logo({ size = 'md' }) {
  return (
    <div className={`logo logo-${size}`}>
      <Box size={size === 'lg' ? 64 : 26} strokeWidth={size === 'lg' ? 2.2 : 2} />
      <span>Mothys</span>
    </div>
  )
}
