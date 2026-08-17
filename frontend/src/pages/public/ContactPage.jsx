import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import api from '../../services/api';

export default function ContactPage() {
  const { register, handleSubmit, reset } = useForm();
  const onSubmit = async (d) => {
    try {
      await api.post('/enquiries', { ...d, type: 'GENERAL' });
      toast.success('Message sent — we will reply within 24 hours');
      reset();
    } catch {
      toast.error('Failed to send');
    }
  };

  const contacts = [
    { icon: Phone, title: 'Phone', value: '+91 98765 43210' },
    { icon: Mail, title: 'Email', value: 'hello@yourmahabaleshwar.com', href: 'mailto:hello@yourmahabaleshwar.com' },
    { icon: MapPin, title: 'Office', value: 'Main Road, Mahabaleshwar, MH 412806' },
    { icon: Clock, title: 'Hours', value: '24/7 customer support' },
  ];

  return (
    <div className="bg-background pb-16">
      <div className="bg-primary py-12 text-white">
        <div className="page-container">
          <h1 className="text-3xl font-bold">Contact us</h1>
          <p className="mt-2 max-w-xl text-blue-100">Our Mahabaleshwar team is here 24/7 for booking help, changes and support.</p>
        </div>
      </div>
      <div className="page-container -mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          {contacts.map((c) => (
            <div key={c.title} className="card flex gap-4 p-5">
              <c.icon className="shrink-0 text-primary" size={24} />
              <div>
                <p className="font-semibold text-slate-900">{c.title}</p>
                {c.href ? (
                  <a href={c.href} className="text-sm text-primary hover:underline">{c.value}</a>
                ) : (
                  <p className="text-sm text-slate-600">{c.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="card lg:col-span-2 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <MessageCircle size={22} className="text-primary" /> Send a message
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input className="input-field mt-1" {...register('name', { required: true })} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <input className="input-field mt-1" {...register('phone', { required: true })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea className="input-field mt-1 min-h-[120px]" {...register('message')} />
            </div>
            <Button type="submit">Send message</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
