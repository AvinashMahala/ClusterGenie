// frontend/src/components/Hero/Hero.tsx

import './Hero.scss';

export interface HeroProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  stats?: Array<{
    value: number | string;
    label: string;
  }>;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

export function Hero({ 
  title, 
  subtitle, 
  icon, 
  stats, 
  variant = 'default',
  className = '' 
}: HeroProps) {
  return (
    <div className={`hero hero--${variant} ${className}`}>
      <div className="hero__content">
        {(icon || title) && (
          <div className="hero__header">
            {icon && <div className="hero__icon">{icon}</div>}
            <div className="hero__text">
              <h1 className="hero__title">{title}</h1>
              {subtitle && <p className="hero__subtitle">{subtitle}</p>}
            </div>
          </div>
        )}
        
        {stats && stats.length > 0 && (
          <div className="hero__stats">
            {stats.map((stat, index) => (
              <div key={index} className="hero__stat-item">
                <div className="hero__stat-value">{stat.value}</div>
                <div className="hero__stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
