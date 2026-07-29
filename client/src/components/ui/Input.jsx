import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon: Icon, rightIcon, className = '', ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={`
            input-cyber
            ${Icon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-cyber-red/60 focus:border-cyber-red' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-cyber-red">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
