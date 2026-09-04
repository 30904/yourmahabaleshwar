import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import FileDropzone from '../../../components/ui/FileDropzone';
import { uploadStorageFile } from '../../../services/uploadApi';
import { createStaff, fetchStaff, resetStaffPassword, updateStaff } from '../../../services/staffApi';
import { ROLES } from '../../../constants/roles';

const STAFF_ROLE_OPTIONS = [
  { value: ROLES.OFFICE_STAFF_HOTEL, label: 'Office Staff — Hotel' },
  { value: ROLES.OFFICE_STAFF_GUIDE, label: 'Office Staff — Guide' },
  { value: ROLES.MARKETING_STAFF, label: 'Marketing Staff' },
];

const emptyDocs = () => ({
  photo: null,
  aadhaarDoc: null,
  panDoc: null,
  addressProof: null,
});

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: ROLES.OFFICE_STAFF_HOTEL,
  employeeId: '',
  designation: '',
  department: '',
  dateOfBirth: '',
  dateOfJoining: '',
  gender: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  aadhaarNumber: '',
  panNumber: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  notes: '',
};

async function uploadDoc(file, staffKey, docField) {
  if (!file) return undefined;
  const result = await uploadStorageFile(file, {
    category: 'staff-doc',
    staffId: staffKey,
    docField,
  });
  return result.key || result.url;
}

export default function StaffCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [newPassword, setNewPassword] = useState('');
  const [docFiles, setDocFiles] = useState(emptyDocs());
  const [existingDocs, setExistingDocs] = useState({});

  const { register, handleSubmit, reset, watch } = useForm({ defaultValues: defaultForm });
  const watchEmail = watch('email');

  useEffect(() => {
    if (!editId) {
      setEditing(null);
      setNewPassword('');
      setDocFiles(emptyDocs());
      setExistingDocs({});
      reset(defaultForm);
      setLoadingEdit(false);
      return;
    }

    setLoadingEdit(true);
    fetchStaff(editId)
      .then((row) => {
        const profile = row.profile || {};
        setEditing(row);
        setNewPassword('');
        setDocFiles(emptyDocs());
        setExistingDocs(profile.documents || {});
        reset({
          ...defaultForm,
          name: row.name || '',
          email: row.email || '',
          phone: row.phone || '',
          role: row.role || ROLES.OFFICE_STAFF_HOTEL,
          employeeId: profile.employeeId || '',
          designation: profile.designation || '',
          department: profile.department || '',
          dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : '',
          dateOfJoining: profile.dateOfJoining ? String(profile.dateOfJoining).slice(0, 10) : '',
          gender: profile.gender || '',
          addressLine1: profile.address?.line1 || '',
          addressLine2: profile.address?.line2 || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          pincode: profile.address?.pincode || '',
          aadhaarNumber: profile.aadhaarNumber || '',
          panNumber: profile.panNumber || '',
          emergencyName: profile.emergencyContact?.name || '',
          emergencyPhone: profile.emergencyContact?.phone || '',
          emergencyRelation: profile.emergencyContact?.relation || '',
          notes: profile.notes || '',
          password: '',
        });
      })
      .catch(() => {
        toast.error('Failed to load staff member');
        navigate('/admin/staff-management', { replace: true });
      })
      .finally(() => setLoadingEdit(false));
  }, [editId, navigate, reset]);

  const staffKey = useMemo(
    () => editing?._id || watchEmail?.trim().toLowerCase() || 'new',
    [editing, watchEmail]
  );

  const buildPayload = async (data) => {
    const documents = { ...existingDocs };
    for (const [field, file] of Object.entries(docFiles)) {
      if (file) {
        documents[field] = await uploadDoc(file, staffKey, field);
      }
    }

    return {
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim(),
      role: data.role,
      employeeId: data.employeeId?.trim(),
      designation: data.designation?.trim(),
      department: data.department?.trim(),
      dateOfBirth: data.dateOfBirth || undefined,
      dateOfJoining: data.dateOfJoining || undefined,
      gender: data.gender || undefined,
      address: {
        line1: data.addressLine1?.trim(),
        line2: data.addressLine2?.trim(),
        city: data.city?.trim(),
        state: data.state?.trim(),
        pincode: data.pincode?.trim(),
      },
      aadhaarNumber: data.aadhaarNumber?.trim(),
      panNumber: data.panNumber?.trim(),
      emergencyContact: {
        name: data.emergencyName?.trim(),
        phone: data.emergencyPhone?.trim(),
        relation: data.emergencyRelation?.trim(),
      },
      notes: data.notes?.trim(),
      documents,
    };
  };

  const onSubmit = async (data) => {
    if (!editing && (!data.password || data.password.length < 6)) {
      toast.error('Set a login password (min 6 characters)');
      return;
    }

    setSaving(true);
    try {
      const payload = await buildPayload(data);
      if (editing) {
        await updateStaff(editing._id, payload);
        if (newPassword && newPassword.length >= 6) {
          await resetStaffPassword(editing._id, newPassword);
        }
        toast.success('Staff updated');
        navigate('/admin/staff-management');
      } else {
        await createStaff({ ...payload, password: data.password, isActive: true });
        toast.success('Staff created with login credentials');
        navigate('/admin/staff-management');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loadingEdit) {
    return (
      <div className="admin-card p-12 text-center text-slate-500">Loading staff details…</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? 'Edit Staff' : 'Staff'}
        subtitle={
          editing
            ? 'Update profile details or reset password'
            : 'Register office staff, upload documents, and set login credentials'
        }
        actions={
          <Link to="/admin/staff-management" className="admin-btn-secondary">
            Staff management
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="admin-card space-y-6 p-6">
        <div>
          <h3 className="admin-card-title">{editing ? `Edit — ${editing.name}` : 'Staff registration'}</h3>
          <p className="text-sm text-slate-500">
            {editing
              ? 'Update profile details or reset password. Inactive staff cannot log in.'
              : 'Fill the registration form and set username (email) + password for staff login.'}
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <h4 className="sm:col-span-2 lg:col-span-3 text-sm font-semibold text-slate-800">Login credentials</h4>
          <input className="admin-input" placeholder="Full name *" {...register('name', { required: true })} />
          <input
            className="admin-input"
            placeholder="Email (username) *"
            type="email"
            disabled={!!editing}
            {...register('email', { required: true })}
          />
          <input className="admin-input" placeholder="Phone" {...register('phone')} />
          {!editing ? (
            <input
              className="admin-input"
              placeholder="Password *"
              type="password"
              {...register('password', { minLength: 6 })}
            />
          ) : (
            <input
              className="admin-input"
              placeholder="New password (optional)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          )}
          <select className="admin-input" {...register('role')}>
            {STAFF_ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <h4 className="sm:col-span-2 lg:col-span-3 text-sm font-semibold text-slate-800">Employment details</h4>
          <input className="admin-input" placeholder="Employee ID" {...register('employeeId')} />
          <input className="admin-input" placeholder="Designation" {...register('designation')} />
          <input className="admin-input" placeholder="Department" {...register('department')} />
          <label className="text-sm text-slate-600">
            Date of birth
            <input type="date" className="admin-input mt-1" {...register('dateOfBirth')} />
          </label>
          <label className="text-sm text-slate-600">
            Date of joining
            <input type="date" className="admin-input mt-1" {...register('dateOfJoining')} />
          </label>
          <label className="text-sm text-slate-600">
            Gender
            <select className="admin-input mt-1" {...register('gender')}>
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <h4 className="sm:col-span-2 lg:col-span-3 text-sm font-semibold text-slate-800">Address</h4>
          <input className="admin-input sm:col-span-2" placeholder="Address line 1" {...register('addressLine1')} />
          <input className="admin-input sm:col-span-2" placeholder="Address line 2" {...register('addressLine2')} />
          <input className="admin-input" placeholder="City" {...register('city')} />
          <input className="admin-input" placeholder="State" {...register('state')} />
          <input className="admin-input" placeholder="PIN code" {...register('pincode')} />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <h4 className="sm:col-span-2 lg:col-span-3 text-sm font-semibold text-slate-800">Identity</h4>
          <input className="admin-input" placeholder="Aadhaar number" {...register('aadhaarNumber')} />
          <input className="admin-input" placeholder="PAN number" {...register('panNumber')} />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <h4 className="sm:col-span-2 text-sm font-semibold text-slate-800">Documents (drag & drop)</h4>
          <FileDropzone
            label="Photo"
            value={docFiles.photo}
            existingUrl={existingDocs.photo}
            onChange={(file) => setDocFiles((d) => ({ ...d, photo: file }))}
            onClearExisting={() => setExistingDocs((d) => ({ ...d, photo: undefined }))}
          />
          <FileDropzone
            label="Aadhaar document"
            value={docFiles.aadhaarDoc}
            existingUrl={existingDocs.aadhaarDoc}
            onChange={(file) => setDocFiles((d) => ({ ...d, aadhaarDoc: file }))}
            onClearExisting={() => setExistingDocs((d) => ({ ...d, aadhaarDoc: undefined }))}
          />
          <FileDropzone
            label="PAN document"
            value={docFiles.panDoc}
            existingUrl={existingDocs.panDoc}
            onChange={(file) => setDocFiles((d) => ({ ...d, panDoc: file }))}
            onClearExisting={() => setExistingDocs((d) => ({ ...d, panDoc: undefined }))}
          />
          <FileDropzone
            label="Address proof"
            value={docFiles.addressProof}
            existingUrl={existingDocs.addressProof}
            onChange={(file) => setDocFiles((d) => ({ ...d, addressProof: file }))}
            onClearExisting={() => setExistingDocs((d) => ({ ...d, addressProof: undefined }))}
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <h4 className="sm:col-span-2 lg:col-span-3 text-sm font-semibold text-slate-800">Emergency contact</h4>
          <input className="admin-input" placeholder="Contact name" {...register('emergencyName')} />
          <input className="admin-input" placeholder="Contact phone" {...register('emergencyPhone')} />
          <input className="admin-input" placeholder="Relation" {...register('emergencyRelation')} />
          <textarea className="admin-input sm:col-span-2 lg:col-span-3" rows={3} placeholder="Notes" {...register('notes')} />
        </section>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create staff'}
          </button>
          {editing && (
            <Link to="/admin/staff-management" className="admin-btn-secondary">
              Cancel
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
