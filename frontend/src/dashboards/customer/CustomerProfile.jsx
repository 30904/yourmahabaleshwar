import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function CustomerProfile() {
  const { user, loadUser } = useAuth();
  const { register, handleSubmit } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await api.patch('/users/me', data);
      await loadUser?.();
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h2 className="font-bold">Profile</h2>
      <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 max-w-md">
        <Input label="Full name" {...register('name', { required: true })} />
        <Input label="Phone" {...register('phone')} />
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
      </form>
    </Card>
  );
}
