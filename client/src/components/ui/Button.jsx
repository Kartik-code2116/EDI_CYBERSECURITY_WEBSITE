import { motion } from 'framer-motion';

const variants = {
  primary: 'btn-cyber text-white',
  outline: 'btn-outline-cyber',
  ghost: 'px-6 py-3 rounded-xl font-semibold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300',
  danger: 'px-6 py-3 rounded-xl font-semibold text-sm bg-cyber-red/20 text-cyber-red border border-cyber-red/40 hover:bg-cyber-red/30 transition-all duration-300',
  success: 'px-6 py-3 rounded-xl font-semibold text-sm bg-cyber-green/20 text-cyber-green border border-cyber-green/40 hover:bg-cyber-green/30 transition-all duration-300',
};

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  fullWidth = false,
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${size ? sizes[size] : ''}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        inline-flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  );
}
