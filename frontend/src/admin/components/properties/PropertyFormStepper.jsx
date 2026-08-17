import { Check } from 'lucide-react';
import { FORM_STEPS } from './propertyFormConfig';

export default function PropertyFormStepper({ activeStep, onStepClick, completedSteps }) {
  const canVisit = (index) =>
    index <= activeStep || completedSteps.includes(index);

  return (
    <div className="admin-prop-stepper-shell">
      <nav className="admin-prop-stepper" aria-label="Property form progress">
        <ol className="admin-prop-stepper-grid">
          {FORM_STEPS.map((step, index) => {
            const done = completedSteps.includes(index);
            const active = index === activeStep;
            const upcoming = index > activeStep && !done;
            const visitable = canVisit(index);
            const Icon = step.icon;

            return (
              <li key={step.id} className="admin-prop-stepper-cell">
                <button
                  type="button"
                  disabled={!visitable}
                  onClick={() => visitable && onStepClick(index)}
                  className={[
                    'admin-prop-step-card',
                    active && 'admin-prop-step-card-active',
                    done && !active && 'admin-prop-step-card-done',
                    upcoming && 'admin-prop-step-card-upcoming',
                    !visitable && 'admin-prop-step-card-locked',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span
                    className={[
                      'admin-prop-step-icon',
                      active && 'admin-prop-step-icon-active',
                      done && !active && 'admin-prop-step-icon-done',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {done && !active ? <Check size={16} strokeWidth={2.5} /> : <Icon size={16} strokeWidth={2} />}
                  </span>
                  <span className="admin-prop-step-copy">
                    <span className="admin-prop-step-kicker">Step {index + 1}</span>
                    <span className="admin-prop-step-label">{step.label}</span>
                    <span className="admin-prop-step-desc">{step.desc}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
