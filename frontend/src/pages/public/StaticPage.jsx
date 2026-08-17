import Seo from '../../components/seo/Seo';
import { truncateMeta } from '../../constants/seo';

export default function StaticPage({ title, description, children }) {
  const desc =
    description ||
    truncateMeta(
      typeof children === 'string'
        ? children
        : `${title} — information from YOURMAHABALESHWAR.COM`
    );

  return (
    <div className="page-container max-w-4xl py-10 sm:py-14">
      <Seo title={title} description={desc} />
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      <div className="prose prose-slate mt-6 max-w-none text-slate-600">{children}</div>
    </div>
  );
}
