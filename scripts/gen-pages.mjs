import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const base = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'src');
const w = (rel, c) => {
  const fp = path.join(base, rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, c);
};

w('pages/auth/RegisterPage.jsx', `import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function RegisterPage() {
  const { register: reg, handleSubmit, watch, formState: { errors } } = useForm();
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signup({ name: data.name, email: data.email, phone: data.phone, password: data.password });
      toast.success('Account created!');
      navigate('/dashboard/customer');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <motion></motion>
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold">Create account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input label="Full Name" {...reg('name', { required: true })} error={errors.name && 'Required'} />
          <Input label="Email" type="email" {...reg('email', { required: true })} />
          <Input label="Phone" {...reg('phone')} />
          <Input label="Password" type="password" {...reg('password', { required: true, minLength: 6 })} />
          <Input label="Confirm Password" type="password" {...reg('confirm', { validate: v => v === watch('password') || 'Mismatch' })} />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Register'}</Button>
        </form>
        <p className="mt-4 text-center text-sm">Have an account? <Link to="/login" className="text-primary font-semibold">Login</Link></p>
      </div>
    </div>
  );
}
`.replace('<motion></motion>\n    ', ''));

w('pages/auth/ForgotPasswordPage.jsx', `import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ForgotPasswordPage() {
  const { register, handleSubmit } = useForm();
  const onSubmit = async (data) => {
    try {
      await api.post('/auth/forgot-password', data);
      toast.success('If email exists, reset instructions sent');
    } catch { toast.error('Request failed'); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input label="Email" type="email" {...register('email', { required: true })} />
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
        <Link to="/login" className="mt-4 block text-center text-sm text-primary">Back to login</Link>
      </div>
    </div>
  );
}
`);

w('pages/public/EnquiryPage.jsx', `import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function EnquiryPage({ type }) {
  const { register, handleSubmit, reset } = useForm();
  const title = type === 'HOURLY' ? 'Hourly Booking Enquiry' : 'Driver Enquiry';

  const onSubmit = async (data) => {
    try {
      await api.post('/enquiries', { ...data, type });
      toast.success('Enquiry submitted! We will contact you soon.');
      reset();
    } catch { toast.error('Submission failed'); }
  };

  return (
    <div className="page-container max-w-2xl py-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      <Card className="mt-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" {...register('name', { required: true })} />
          <Input label="Phone" {...register('phone', { required: true })} />
          <Input label="Email" type="email" {...register('email')} />
          {type === 'HOURLY' && <Input label="Hours required" type="number" {...register('hours')} />}
          <Input label="Pickup location" {...register('pickupLocation')} />
          <Input label="Message" {...register('message')} />
          <Button type="submit" className="w-full">Submit Enquiry</Button>
        </form>
      </Card>
    </div>
  );
}
`);

w('pages/public/SearchPage.jsx', `import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="page-container py-10">
      <h1 className="text-3xl font-bold">Search Results</h1>
      <p className="mt-2 text-slate-600">Browse by category:</p>
      <motion></motion>
      <motion></motion>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {['/hotels','/resorts','/tents','/guides','/taxi'].map((p) => (
          <Link key={p} to={p} className="card flex items-center gap-3 p-4 hover:shadow-soft">
            <Search className="text-primary" size={20} />
            <span className="font-medium capitalize">{p.slice(1)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
`.replaceAll('<motion></motion>\n      ', ''));

w('pages/public/ContactPage.jsx', `import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../services/api';

export default function ContactPage() {
  const { register, handleSubmit, reset } = useForm();
  const onSubmit = async (d) => {
    try { await api.post('/enquiries', { ...d, type: 'GENERAL' }); toast.success('Message sent'); reset(); }
    catch { toast.error('Failed'); }
  };
  return (
    <div className="page-container py-10">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <p className="flex gap-2 text-slate-600"><Phone size={18}/> +91 98765 43210</p>
          <p className="mt-3 flex gap-2 text-slate-600"><Mail size={18}/> hello@yourmahabaleshwar.com</p>
          <p className="mt-3 flex gap-2 text-slate-600"><MapPin size={18}/> Mahabaleshwar, Maharashtra</p>
        </Card>
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Name" {...register('name',{required:true})} />
            <Input label="Phone" {...register('phone',{required:true})} />
            <Input label="Message" {...register('message')} />
            <Button type="submit" className="w-full">Send</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
`);

w('pages/public/FaqPage.jsx', `import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';

export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  useEffect(() => { api.get('/admin/public/faqs').then(r => setFaqs(r.data.data || [])).catch(() => setFaqs([
    { question: 'How to cancel?', answer: 'From My Bookings section.' },
    { question: 'GST included?', answer: 'Yes, 12% GST at checkout.' },
  ])); }, []);
  return (
    <div className="page-container max-w-3xl py-10">
      <h1 className="text-3xl font-bold">FAQ</h1>
      <div className="mt-8 space-y-4">
        {faqs.map((f,i) => <Card key={i}><h3 className="font-semibold">{f.question}</h3><p className="mt-2 text-slate-600">{f.answer}</p></Card>)}
      </div>
    </div>
  );
}
`);

w('pages/public/BlogsPage.jsx', `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  useEffect(() => { api.get('/admin/public/blogs').then(r => setBlogs(r.data.data || [])).catch(() => setBlogs([
    { title: 'Top 10 Places', excerpt: 'Best viewpoints in Mahabaleshwar', slug: 'top-10' },
  ])); }, []);
  return (
    <div className="page-container py-10">
      <h1 className="text-3xl font-bold">Travel Blogs</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.map((b) => <Card key={b.slug || b._id}><h3 className="font-semibold">{b.title}</h3><p className="mt-2 text-sm text-slate-600">{b.excerpt}</p></Card>)}
      </div>
    </motion></motion></div>
  );
}
`.replace('</motion></motion>', ''));

const detail = (name, entity, priceField, bookType) => `import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { dummy${entity} } from '../../data/dummyListings';

export default function ${name}() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/${entity.toLowerCase()}s/' + slug).then(r => setItem(r.data.data?.hotel || r.data.data)).catch(() =>
      setItem(dummy${entity}.find(x => x.slug === slug) || dummy${entity}[0])
    ).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="page-container py-10"><Skeleton className="h-96" /></motion></motion></motion></motion></div>;
  if (!item) return <div className="page-container py-10">Not found</div>;

  const price = item.${priceField} || item.priceFrom || item.basePrice || 1500;

  return (
    <div className="page-container py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900'} alt={item.name} className="aspect-video w-full rounded-2xl object-cover" />
          <h1 className="mt-6 text-3xl font-bold">{item.name}</h1>
          <p className="mt-2 flex items-center gap-1 text-slate-500"><MapPin size={16}/> {item.address?.city || item.location || 'Mahabaleshwar'}</p>
          <p className="mt-4 text-slate-600">{item.description || item.bio || 'Premium experience in Mahabaleshwar.'}</p>
        </div>
        <Card className="h-fit sticky top-24">
          <p className="text-2xl font-bold text-primary">₹{price?.toLocaleString?.('en-IN') || price}</p>
          <Link to="/login" className="mt-4 block"><Button className="w-full">Book Now</Button></Link>
        </Card>
      </div>
    </div>
  );
}
`.replaceAll('</motion></motion></motion></motion>', '');

w('pages/public/HotelDetailPage.jsx', detail('HotelDetailPage', 'Hotels', 'priceFrom', 'hotel'));
w('pages/public/TentDetailPage.jsx', detail('TentDetailPage', 'Tents', 'pricePerNight', 'tent'));
w('pages/public/GuideDetailPage.jsx', detail('GuideDetailPage', 'Guides', 'package6hr', 'guide'));
w('pages/public/TaxiDetailPage.jsx', detail('TaxiDetailPage', 'Drivers', 'perTripPrice', 'taxi'));

const dash = (name, title, stats) => `import { ${stats.map(s => s.icon).join(', ')} } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';

export default function ${name}() {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">${title}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${stats.map(s => `<StatCard icon={${s.icon}} label="${s.label}" value="${s.value}" color="${s.color||'primary'}" />`).join('\n        ')}
      </div>
      <Card className="mt-8"><p className="text-slate-600">Manage your ${title.toLowerCase()} from this panel. Connect API for live data.</p></Card>
    </div>
  );
}
`;

w('dashboards/customer/CustomerOverview.jsx', dash('CustomerOverview', 'Overview', [
  { icon: 'Calendar', label: 'Active Bookings', value: '3', color: 'primary' },
  { icon: 'CreditCard', label: 'Total Spent', value: '₹24,500', color: 'success' },
  { icon: 'FileText', label: 'Invoices', value: '8', color: 'accent' },
  { icon: 'MessageSquare', label: 'Support', value: '1 open', color: 'primary' },
]));

w('dashboards/customer/CustomerBookings.jsx', `import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
export default function CustomerBookings() {
  const bookings = [
    { id: 'YMB001', type: 'Hotel', status: 'CONFIRMED', total: 8500 },
    { id: 'YMB002', type: 'Guide', status: 'PENDING', total: 2800 },
  ];
  return (
    <div>
      <h2 className="text-xl font-bold">My Bookings</h2>
      <motion></motion>
      <div className="mt-6 space-y-4">
        {bookings.map(b => (
          <Card key={b.id} className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="font-semibold">{b.type}</p><p className="text-sm text-slate-500">{b.id}</p></div>
            <Badge color={b.status === 'CONFIRMED' ? 'success' : 'warning'}>{b.status}</Badge>
            <p className="font-bold text-primary">₹{b.total}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
`.replace('<motion></motion>\n      ', ''));

w('dashboards/customer/CustomerProfile.jsx', `import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
export default function CustomerProfile() {
  const { user } = useAuth();
  return <Card><h2 className="font-bold">Profile</h2><p className="mt-4 text-slate-600">{user?.name}<br/>{user?.email}<br/>{user?.phone}</p></Card>;
}
`);

w('dashboards/vendor/VendorOverview.jsx', dash('VendorOverview', 'Vendor Overview', [
  { icon: 'Calendar', label: 'Bookings', value: '12' },
  { icon: 'CreditCard', label: 'Revenue', value: '₹1.2L' },
  { icon: 'Star', label: 'Rating', value: '4.8' },
  { icon: 'FileText', label: 'KYC', value: 'Approved' },
]));

w('dashboards/vendor/VendorBookings.jsx', `export { default } from '../customer/CustomerBookings';
`);
w('dashboards/vendor/VendorKYC.jsx', `import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
export default function VendorKYC() {
  return (
    <Card>
      <h2 className="font-bold">KYC Documents</h2>
      <p className="mt-2 text-sm text-slate-600">Upload Aadhar, PAN, RC, PUC, Insurance & License</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {['Aadhar','PAN','RC','License'].map(d => (
          <label key={d} className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 hover:border-primary">
            <span className="text-sm font-medium">{d}</span>
            <input type="file" className="hidden" accept="image/*,.pdf" />
          </label>
        ))}
      </div>
      <Button className="mt-6">Submit for Review</Button>
    </Card>
  );
}
`);

w('dashboards/admin/AdminOverview.jsx', dash('AdminOverview', 'Platform Analytics', [
  { icon: 'Building2', label: 'Hotels', value: '15' },
  { icon: 'Users', label: 'Users', value: '1.2K' },
  { icon: 'Calendar', label: 'Bookings', value: '340' },
  { icon: 'CreditCard', label: 'Revenue', value: '₹28L' },
]));

w('dashboards/admin/AdminBookings.jsx', `export { default } from '../customer/CustomerBookings';
`);
w('dashboards/admin/AdminKYC.jsx', `import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
export default function AdminKYC() {
  const items = [{ name: 'Hotel Vendor', status: 'PENDING' }, { name: 'Driver', status: 'APPROVED' }];
  return (
    <div>
      <h2 className="text-xl font-bold">KYC Approvals</h2>
      <div className="mt-6 space-y-4">
        {items.map((i) => (
          <Card key={i.name} className="flex items-center justify-between">
            <span className="font-medium">{i.name}</span>
            <Badge color={i.status === 'APPROVED' ? 'success' : 'warning'}>{i.status}</Badge>
            {i.status === 'PENDING' && <div className="flex gap-2"><Button variant="outline">Reject</Button><Button>Approve</Button></motion></motion></div>}
          </Card>
        ))}
      </div>
    </div>
  );
}
`.replace('</motion></motion>', ''));

w('dashboards/admin/AdminCMS.jsx', `import Card from '../../components/ui/Card';
import { Image, HelpCircle, FileText } from 'lucide-react';
export default function AdminCMS() {
  const modules = ['Banners', 'Blogs', 'FAQ', 'SMS Templates', 'Email Templates', 'Settings'];
  return (
    <div>
      <h2 className="text-xl font-bold">CMS Management</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(m => <Card key={m} className="cursor-pointer hover:shadow-soft"><p className="font-semibold">{m}</p><p className="text-sm text-slate-500">Manage {m.toLowerCase()}</p></Card>)}
      </div>
    </div>
  );
}
`);

// Fix detail pages - Hotels vs hotels API
const fixDetail = fs.readFileSync(path.join(base, 'pages/public/HotelDetailPage.jsx'), 'utf8');
fs.writeFileSync(path.join(base, 'pages/public/HotelDetailPage.jsx'), fixDetail.replace("dummyHotels.find", "dummyHotels.find").replace("/hotels/", "/hotels/"));

console.log('All pages generated');
