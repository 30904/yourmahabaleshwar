import { Link } from 'react-router-dom';
import ServiceBookHubPage from './ServiceBookHubPage';

export default function TaxiPage() {
  return (
    <>
      <ServiceBookHubPage tenant="TAXI" />
      <div className="page-container -mt-8 pb-12 text-center">
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/driver-enquiry" className="btn-outline text-sm">
            Driver enquiry
          </Link>
          <Link to="/hourly-enquiry" className="btn-secondary text-sm">
            Hourly enquiry
          </Link>
        </div>
      </div>
    </>
  );
}
