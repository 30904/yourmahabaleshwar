import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import AdminModal from '../../components/AdminModal';
import RowActions, { buildMasterActions } from '../../components/RowActions';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createCombo,
  updateCombo,
  deleteCombo,
} from '../../../services/enterpriseAdminApi';
import api from '../../../services/api';
import { formatCurrency } from '../../../utils/format';

export default function ProductsCombosAdminPage() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCombo, setEditingCombo] = useState(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { vertical: 'STRAWBERRY', unit: 'pack', price: 299, stock: 50 },
  });
  const comboForm = useForm({
    defaultValues: { originalPrice: 4000, comboPrice: 2999 },
  });

  const load = () => {
    api.get('/admin/products').then((r) => setProducts(r.data.data || [])).catch(() => toast.error('Failed products'));
    api.get('/admin/combos').then((r) => setCombos(r.data.data || [])).catch(() => toast.error('Failed combos'));
  };

  useEffect(() => {
    load();
  }, []);

  const onProduct = async (data) => {
    try {
      const payload = {
        ...data,
        price: Number(data.price),
        stock: Number(data.stock),
        images: data.imageUrl ? [data.imageUrl] : undefined,
        isActive: true,
      };
      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
        toast.success('Product updated');
        setEditingProduct(null);
      } else {
        await createProduct(payload);
        toast.success('Product created');
      }
      reset({ vertical: 'STRAWBERRY', unit: 'pack', price: 299, stock: 50, name: '', shortDescription: '', imageUrl: '' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const onCombo = async (data) => {
    try {
      const payload = {
        name: data.name,
        description: data.description,
        originalPrice: Number(data.originalPrice),
        comboPrice: Number(data.comboPrice),
        images: data.imageUrl ? [data.imageUrl] : undefined,
        items: editingCombo?.items || [
          {
            itemType: 'HOTEL',
            itemId: products[0]?._id || '000000000000000000000000',
            label: data.itemLabel || 'Stay voucher',
            nights: 1,
          },
        ],
        isFeatured: true,
        isActive: true,
      };
      if (editingCombo) {
        await updateCombo(editingCombo._id, payload);
        toast.success('Combo updated');
        setEditingCombo(null);
      } else {
        await createCombo(payload);
        toast.success('Combo created');
      }
      comboForm.reset({ originalPrice: 4000, comboPrice: 2999, name: '', description: '', itemLabel: '', imageUrl: '' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const seed = async () => {
    try {
      await api.post('/admin/phase4/seed-defaults');
      toast.success('Phase 4 defaults seeded');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Seed failed');
    }
  };

  const toggleProduct = async (row) => {
    try {
      await updateProduct(row._id, { isActive: row.isActive === false });
      toast.success(row.isActive === false ? 'Marked active' : 'Marked inactive');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const toggleCombo = async (row) => {
    try {
      await updateCombo(row._id, { isActive: row.isActive === false });
      toast.success(row.isActive === false ? 'Marked active' : 'Marked inactive');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const removeProduct = async (row) => {
    if (!window.confirm(`Deactivate product "${row.name}"?`)) return;
    try {
      await deleteProduct(row._id);
      toast.success('Product deactivated');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const removeCombo = async (row) => {
    if (!window.confirm(`Deactivate combo "${row.name}"?`)) return;
    try {
      await deleteCombo(row._id);
      toast.success('Combo deactivated');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const productCols = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'vertical', label: 'Vertical' },
    { key: 'price', label: 'Price', render: (r) => formatCurrency(r.price) },
    { key: 'stock', label: 'Stock' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (r) => (
        <RowActions
          items={buildMasterActions({
            isActive: r.isActive !== false,
            onView: () => setViewing({ kind: 'product', row: r }),
            onEdit: () => {
              setEditingProduct(r);
              reset({
                name: r.name,
                vertical: r.vertical,
                price: r.price,
                stock: r.stock,
                unit: r.unit || 'pack',
                shortDescription: r.shortDescription || '',
                imageUrl: r.images?.[0] || '',
              });
            },
            onToggleActive: () => toggleProduct(r),
            onDelete: () => removeProduct(r),
          })}
        />
      ),
    },
  ];

  const comboCols = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'comboPrice', label: 'Combo', render: (r) => formatCurrency(r.comboPrice) },
    { key: 'originalPrice', label: 'Was', render: (r) => formatCurrency(r.originalPrice) },
    { key: 'redemptionCount', label: 'Sold' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (r) => (
        <RowActions
          items={buildMasterActions({
            isActive: r.isActive !== false,
            onView: () => setViewing({ kind: 'combo', row: r }),
            onEdit: () => {
              setEditingCombo(r);
              comboForm.reset({
                name: r.name,
                description: r.description || '',
                originalPrice: r.originalPrice,
                comboPrice: r.comboPrice,
                itemLabel: r.items?.[0]?.label || '',
                imageUrl: r.images?.[0] || '',
              });
            },
            onToggleActive: () => toggleCombo(r),
            onDelete: () => removeCombo(r),
          })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Combos"
        subtitle="Phase 4 — Strawberry, Mapro, combo offers"
        actions={
          <button type="button" className="admin-btn-primary" onClick={seed}>
            Seed Phase 4 defaults
          </button>
        }
      />
      <div className="flex gap-2">
        <button type="button" className={tab === 'products' ? 'admin-btn-primary' : 'admin-input'} onClick={() => setTab('products')}>
          Products
        </button>
        <button type="button" className={tab === 'combos' ? 'admin-btn-primary' : 'admin-input'} onClick={() => setTab('combos')}>
          Combos
        </button>
      </div>

      {tab === 'products' && (
        <>
          <form onSubmit={handleSubmit(onProduct)} className="admin-card grid gap-3 p-6 sm:grid-cols-3">
            <input className="admin-input" placeholder="Name" {...register('name', { required: true })} />
            <select className="admin-input" {...register('vertical')}>
              <option value="STRAWBERRY">Strawberry</option>
              <option value="MAPRO">Mapro</option>
            </select>
            <input type="number" className="admin-input" placeholder="Price (₹)" {...register('price')} />
            <input type="number" className="admin-input" placeholder="Stock" {...register('stock')} />
            <select className="admin-input" {...register('unit')}>
              {['kg', 'box', 'pack', 'bottle', 'jar', 'piece'].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <input className="admin-input" placeholder="Image URL" {...register('imageUrl')} />
            <input className="admin-input sm:col-span-2" placeholder="Short description" {...register('shortDescription')} />
            <div className="flex gap-2 sm:col-span-3">
              <button type="submit" className="admin-btn-primary">
                {editingProduct ? 'Update product' : 'Add product'}
              </button>
              {editingProduct && (
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => {
                    setEditingProduct(null);
                    reset({ vertical: 'STRAWBERRY', unit: 'pack', price: 299, stock: 50 });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          <DataTable columns={productCols} data={products} />
        </>
      )}

      {tab === 'combos' && (
        <>
          <form onSubmit={comboForm.handleSubmit(onCombo)} className="admin-card grid gap-3 p-6 sm:grid-cols-3">
            <input className="admin-input" placeholder="Combo name" {...comboForm.register('name', { required: true })} />
            <input type="number" className="admin-input" placeholder="Original price (₹)" {...comboForm.register('originalPrice')} />
            <input type="number" className="admin-input" placeholder="Combo price (₹)" {...comboForm.register('comboPrice')} />
            <input className="admin-input sm:col-span-2" placeholder="Description" {...comboForm.register('description')} />
            <input className="admin-input" placeholder="Item label" {...comboForm.register('itemLabel')} />
            <input className="admin-input sm:col-span-2" placeholder="Image URL" {...comboForm.register('imageUrl')} />
            <div className="flex gap-2 sm:col-span-3">
              <button type="submit" className="admin-btn-primary">
                {editingCombo ? 'Update combo' : 'Add combo'}
              </button>
              {editingCombo && (
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => {
                    setEditingCombo(null);
                    comboForm.reset({ originalPrice: 4000, comboPrice: 2999 });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          <DataTable columns={comboCols} data={combos} />
        </>
      )}

      <AdminModal
        open={!!viewing}
        title={viewing?.row?.name || 'Details'}
        onClose={() => setViewing(null)}
      >
        {viewing?.row && (
          <div className="space-y-2 text-sm text-slate-700">
            <p>{viewing.row.description || viewing.row.shortDescription || '—'}</p>
            <p>
              <span className="font-semibold">Price:</span>{' '}
              {formatCurrency(viewing.row.price || viewing.row.comboPrice)}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{' '}
              {viewing.row.isActive !== false ? 'Active' : 'Inactive'}
            </p>
            {viewing.row.slug && (
              <a
                className="text-primary underline"
                href={`/${viewing.kind === 'combo' ? 'combos' : viewing.row.vertical === 'MAPRO' ? 'mapro' : 'strawberries'}/${viewing.row.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                Open public page
              </a>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
