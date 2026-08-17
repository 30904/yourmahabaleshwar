import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function HomeSectionHeader({ eyebrow, title, subtitle, linkTo, linkLabel = 'View all' }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="btn-ghost shrink-0 self-start sm:self-auto">
          {linkLabel}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
