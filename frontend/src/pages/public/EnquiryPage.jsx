import { useForm } from 'react-hook-form';
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
