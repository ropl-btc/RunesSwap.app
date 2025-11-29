import React from 'react';

import styles from '@/components/ui/Button.module.css';

/**
 * Props for the Button component.
 * Extends standard HTML button attributes.
 */
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * A reusable button component with standard styling.
 * Forwards refs to the underlying button element.
 *
 * @param props - Component props.
 * @param ref - Ref to the button element.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', ...props }, ref) => (
    <button ref={ref} className={`${styles.root} ${className}`} {...props} />
  ),
);
Button.displayName = 'Button';

export default Button;
