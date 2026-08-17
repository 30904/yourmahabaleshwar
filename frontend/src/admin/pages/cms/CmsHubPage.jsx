import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import BannerForm from '../../components/cms/BannerForm';
import { fetchCmsBanners, createBanner, fetchCmsFaqs, createFaq } from '../../../services/enterpriseAdminApi';
import { getMediaUrl } from '../../../utils/mediaUrl';

export default function CmsHubPage({ tab = 'banners' }) {
  const [banners, setBanners] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageMode, setImageMode] = useState('upload');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { title: '', subtitle: '', imageUrl: '' },
  });

  useEffect(() => {
    fetchCmsBanners().then(setBanners);
    fetchCmsFaqs().then(setFaqs);
  }, []);

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageFile = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onBanner = async (data) => {
    if (imageMode === 'upload' && !imageFile) {
      toast.error('Please upload a banner image');
      return;
    }
    if (imageMode === 'url' && !data.imageUrl?.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    setSubmitting(true);
    try {
      await createBanner(
        {
          title: data.title,
          subtitle: data.subtitle,
          imageUrl: imageMode === 'url' ? data.imageUrl : undefined,
        },
        imageMode === 'upload' ? imageFile : null
      );
      toast.success('Banner added');
      reset();
      clearImage();
      setImageMode('upload');
      fetchCmsBanners().then(setBanners);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add banner');
    } finally {
      setSubmitting(false);
    }
  };

  const onFaq = async (data) => {
    await createFaq(data);
    toast.success('FAQ added');
    reset();
    fetchCmsFaqs().then(setFaqs);
  };

  const titles = { banners: 'Homepage Banners', faqs: 'FAQs', seo: 'SEO Settings' };

  return (
    <div className="space-y-6">
      <PageHeader title={titles[tab] || 'CMS Hub'} subtitle="Content management" />
      {tab === 'banners' && (
        <>
          <form onSubmit={handleSubmit(onBanner)} className="admin-card space-y-4 p-6">
            <BannerForm
              register={register}
              errors={errors}
              imageFile={imageFile}
              imagePreview={imagePreview}
              onImageFile={handleImageFile}
              onClearImage={clearImage}
              imageMode={imageMode}
              onImageMode={setImageMode}
            />
            <button type="submit" disabled={submitting} className="admin-btn-primary w-full sm:w-auto">
              {submitting ? 'Uploading...' : 'Add Banner'}
            </button>
          </form>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((b) => (
              <div key={b._id} className="admin-card overflow-hidden">
                <img src={getMediaUrl(b.image)} alt="" className="h-36 w-full object-cover" />
                <div className="p-4">
                  <p className="font-semibold text-slate-900">{b.title}</p>
                  <p className="text-sm text-slate-500">{b.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === 'faqs' && (
        <>
          <form onSubmit={handleSubmit(onFaq)} className="admin-card grid gap-3 p-4">
            <input className="admin-input" placeholder="Question" {...register('question')} />
            <textarea className="admin-input" rows={2} placeholder="Answer" {...register('answer')} />
            <button type="submit" className="admin-btn-primary w-fit">Add FAQ</button>
          </form>
          <div className="space-y-2">
            {faqs.map((f) => (
              <div key={f._id} className="admin-card p-4">
                <p className="font-medium">{f.question}</p>
                <p className="text-sm text-slate-600">{f.answer}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


