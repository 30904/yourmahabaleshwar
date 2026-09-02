import { Link } from 'react-router-dom';
import ServiceBookHubPage from './ServiceBookHubPage';

export default function DriversPage() {
  return (
    <>
      <ServiceBookHubPage tenant="DRIVER" />
      <div className="page-container -mt-8 pb-12 text-center">
        <Link to="/driver-enquiry" className="text-sm text-primary underline">
          Send a driver enquiry instead
        </Link>
      </div>
    </>
  );
}
