import React from 'react';

const variantStyles = {
  primary: {
    background: 'var(--gradient-primary)',
    color: '#fff',
    border: 'none',
    hoverBg: 'var(--gradient-primary)',
    hoverShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
  },
  secondary: {
    background: 'var(--color-background-secondary)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border-secondary)',
    hoverBg: 'var(--color-background-tertiary)',
    hoverShadow: 'var(--shadow-md)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: 'none',
    hoverBg: 'var(--color-background-secondary)',
    hoverShadow: 'none',
  },
  danger: {
    background: 'var(--gradient-warning)',
    color: '#fff',
    border: 'none',
    hoverBg: 'var(--gradient-warning)',
    hoverShadow: '0 4px 12px rgba(250, 112, 154, 0.4)',
  },
};

const sizeStyles = {
  sm: {
    padding: '4px 10px',
    fontSize: '11px',
    borderRadius: 'var(--radius-sm)',
  },
  md: {
    padding: '6px 14px',
    fontSize: '12px',
    borderRadius: 'var(--radius-md)',
  },
  lg: {
    padding: '8px 18px',
    fontSize: '14px',
    borderRadius: 'var(--radius-lg)',
  },
};

export const Button = React.memo(function Button({
  variant = 'primary',
  size = 'md',
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}) {
  const [hovered, setHovered] = React.useState(false);
  const variantStyle = variantStyles[variant] || variantStyles.primary;
  const sizeStyle = sizeStyles[size] || sizeStyles.md;

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    lineHeight: 1.2,
    transition: 'all var(--transition-fast)',
    transform: hovered ? 'translateY(-2px)' : 'none',
    boxShadow: hovered ? variantStyle.hoverShadow : 'var(--shadow-xs)',
    background: hovered ? variantStyle.hoverBg : variantStyle.background,
    color: variantStyle.color,
    border: variantStyle.border,
    ...sizeStyle,
    ...style,
  };

  const handleMouseEnter = (e) => {
    setHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e) => {
    setHovered(false);
    onMouseLeave?.(e);
  };

  return (
    <button
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
});