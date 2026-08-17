import { useForm } from 'react-hook-form';
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
