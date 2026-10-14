import { useTranslation } from 'react-i18next';
import StaticPage from './StaticPage';
import { privacyPolicyFor } from '../../content/privacyPolicy';

export default function PrivacyPolicyPage() {
  const { i18n } = useTranslation();
  const policy = privacyPolicyFor(i18n.language);

  return (
    <StaticPage
      title={policy.title}
      description="Privacy policy for YOURMAHABALESHWAR.COM, including documents we collect and how to delete your account."
    >
      <p className="text-sm text-slate-500">{policy.updated}</p>
      {policy.sections.map((section) => (
        <section key={section.heading} id={section.id} className="mt-8 scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-sm leading-6 text-slate-600">{paragraph}</p>
          ))}
        </section>
      ))}
    </StaticPage>
  );
}
