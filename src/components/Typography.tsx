import React from 'react';
import { typographyClasses, textColors } from '../styles/typography';

// Typography component props
interface TypographyProps {
  variant?: keyof typeof typographyClasses;
  color?: keyof typeof textColors;
  className?: string;
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

// Main Typography component
export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = 'primary',
  className = '',
  children,
  as: Component = 'p',
}) => {
  const baseClasses = typographyClasses[variant];
  const colorClasses = color === 'gradient' || color === 'gradientAlt' 
    ? `bg-clip-text text-transparent ${textColors[color]}`
    : textColors[color];
  
  const combinedClasses = `${baseClasses} ${colorClasses} ${className}`.trim();

  return (
    <Component className={combinedClasses}>
      {children}
    </Component>
  );
};

// Specialized heading components
export const Heading: React.FC<Omit<TypographyProps, 'variant'> & { level: 1 | 2 | 3 | 4 | 5 | 6 }> = ({
  level,
  ...props
}) => {
  const variant = `h${level}` as keyof typeof typographyClasses;
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  return <Typography variant={variant} as={Component} {...props} />;
};

// Hero text component with special effects
export const HeroText: React.FC<Omit<TypographyProps, 'variant'> & { 
  gradient?: boolean;
  neon?: boolean;
}> = ({ gradient = false, neon = false, className = '', ...props }) => {
  let additionalClasses = '';
  
  if (gradient) {
    additionalClasses += ' bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600';
  }
  
  if (neon) {
    additionalClasses += ' neon-text';
  }
  
  return (
    <Typography 
      variant="heroTitle" 
      className={`${additionalClasses} ${className}`.trim()}
      {...props} 
    />
  );
};

// Button text component
export const ButtonText: React.FC<Omit<TypographyProps, 'variant'> & { 
  size?: 'small' | 'medium' | 'large';
}> = ({ size = 'medium', ...props }) => {
  const variant = size === 'small' ? 'buttonSmall' : size === 'large' ? 'buttonLarge' : 'button';
  
  return <Typography variant={variant} as="span" {...props} />;
};

// Card text components
export const CardTitle: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="cardTitle" {...props} />
);

export const CardSubtitle: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="cardSubtitle" {...props} />
);

export const CardCaption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="cardCaption" {...props} />
);

// Metric display component - ensures numbers display properly
export const MetricDisplay: React.FC<Omit<TypographyProps, 'variant'> & { 
  size?: 'normal' | 'large';
}> = ({ size = 'normal', className = '', ...props }) => {
  const variant = size === 'large' ? 'metricLarge' : 'metric';
  
  return (
    <Typography 
      variant={variant} 
      className={`metric-number ${className}`.trim()}
      {...props} 
    />
  );
};

// Tag component
export const Tag: React.FC<Omit<TypographyProps, 'variant'>> = ({ className = '', ...props }) => (
  <Typography 
    variant="tag" 
    as="span" 
    className={`px-3 py-1 bg-gray-800 text-gray-300 rounded-full whitespace-nowrap hover:bg-gray-700 transition-colors cursor-pointer ${className}`}
    {...props} 
  />
);