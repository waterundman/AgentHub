import React from 'react';

const paddingStyles = {
  sm: { padding: '12px' },
  md: { padding: '16px' },
  lg: { padding: '24px' },
};

export const Card = React.memo(function Card({
  glass = false,
  hoverable = false,
  padding = 'md',
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}) {
  const [hovered, setHovered] = React.useState(false);
  const paddingStyle = paddingStyles[padding] || paddingStyles.md;

  const glassStyle = glass
    ? {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }
    : {
        background: 'var(--color-background-primary)',
        border: '1px solid var(--color-border-primary)',
      };

  const hoverStyle = hoverable
    ? {
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transition: 'all var(--transition-normal)',
      }
    : {};

  const baseStyle = {
    borderRadius: 'var(--radius-lg)',
    ...paddingStyle,
    ...glassStyle,
    ...hoverStyle,
    ...style,
  };

  const handleMouseEnter = (e) => {
    if (hoverable) setHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e) => {
    if (hoverable) setHovered(false);
    onMouseLeave?.(e);
  };

  return (
    <div
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
});