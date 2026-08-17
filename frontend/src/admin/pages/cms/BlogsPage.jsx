import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Calendar, Pencil, Plus, Trash2, Eye, EyeOff, FileText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import RichTextEditor from '../../components/cms/RichTextEditor';
import BlogCoverUpload from '../../components/cms/BlogCoverUpload';
import StatusBadge from '../../components/StatusBadge';
import {
  fetchCmsBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../../../services/enterpriseAdminApi';
import { getMediaUrl } from '../../../utils/mediaUrl';

const emptyForm = {
  title: '',
  excerpt: '',
  tags: '',
  slug: '',
  coverImageUrl: '',
  isPublished: true,
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageMode, setImageMode] = useState('upload');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm({ defaultValues: emptyForm });
  const isPublished = watch('isPublished');

  const load = () =>
    fetchCmsBlogs()
      .then(setBlogs)
      .catch(() => toast.error('Failed to load blogs'));

  useEffect(() => {
    load();
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

  const openCreate = () => {
    setEditing(null);
    reset(emptyForm);
    setContent('');
    clearImage();
    setImageMode('upload');
    setShowForm(true);
  };

  const openEdit = (blog) => {
    setEditing(blog);
    reset({
      title: blog.title,
      excerpt: blog.excerpt || '',
      tags: (blog.tags || []).join(', '),
      slug: blog.slug || '',
      coverImageUrl: blog.coverImage?.startsWith('http') ? blog.coverImage : '',
      isPublished: blog.isPublished,
    });
    setContent(blog.content || '');
    clearImage();
    setImageMode(blog.coverImage?.startsWith('http') ? 'url' : 'upload');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    reset(emptyForm);
    setContent('');
    clearImage();
  };

  const onSubmit = async (data) => {
    if (!data.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!content?.trim() || content === '<p><br></p>') {
      toast.error('Write some content for the blog');
      return;
    }
    if (!editing && imageMode === 'upload' && !imageFile) {
      toast.error('Upload a cover image or switch to URL mode');
      return;
    }
    if (!editing && imageMode === 'url' && !data.coverImageUrl?.trim()) {
      toast.error('Cover image URL is required');
      return;
    }

    setSubmitting(true);
    const payload = {
      title: data.title.trim(),
      excerpt: data.excerpt?.trim(),
      content,
      tags: data.tags,
      slug: data.slug?.trim(),
      isPublished: data.isPublished === true || data.isPublished === 'true',
      coverImageUrl: imageMode === 'url' ? data.coverImageUrl : undefined,
    };

    try {
      if (editing) {
        await updateBlog(editing._id, payload, imageMode === 'upload' ? imageFile : null);
        toast.success('Blog updated');
      } else {
        await createBlog(payload, imageMode === 'upload' ? imageFile : null);
        toast.success('Blog published');
      }
      cancelForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (blog) => {
    if (!window.confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;
    try {
      await deleteBlog(blog._id);
      toast.success('Blog deleted');
      if (editing?._id === blog._id) cancelForm();
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Posts"
        subtitle="Create travel guides and stories for yourmahabaleshwar.com"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'CMS', to: '/admin/cms' }, { label: 'Blogs' }]}
        actions={
          !showForm && (
            <button type="button" className="admin-btn-primary" onClick={openCreate}>
              <Plus size={16} /> New blog post
            </button>
          )
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="admin-card admin-blog-form p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              {editing ? 'Edit blog post' : 'Create new blog post'}
            </h2>
            <button type="button" className="admin-btn-secondary" onClick={cancelForm}>
              Cancel
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <label className="admin-label">
                Title *
                <input className="admin-input text-lg font-semibold" placeholder="Catchy headline…" {...register('title', { required: true })} />
              </label>
              <label className="admin-label">
                Excerpt
                <textarea
                  rows={2}
                  className="admin-input"
                  placeholder="Short summary for cards and SEO (1–2 sentences)"
                  {...register('excerpt')}
                />
              </label>
              <div>
                <label className="admin-label mb-2 block">Content *</label>
                <RichTextEditor value={content} onChange={setContent} placeholder="Write your full article…" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="admin-label">
                  Tags
                  <input className="admin-input" placeholder="travel, monsoon, food" {...register('tags')} />
                </label>
                <label className="admin-label">
                  URL slug
                  <input className="admin-input font-mono text-sm" placeholder="auto-from-title" {...register('slug')} />
                </label>
              </div>
            </div>

            <aside className="space-y-4">
              <BlogCoverUpload
                register={register}
                imageFile={imageFile}
                imagePreview={imagePreview}
                existingUrl={editing?.coverImage}
                imageMode={imageMode}
                onImageMode={setImageMode}
                onImageFile={handleImageFile}
                onClearImage={clearImage}
              />
              <label className="admin-publish-toggle">
                <input type="checkbox" {...register('isPublished')} />
                <div>
                  <span className="font-semibold flex items-center gap-1">
                    {isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                    {isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-slate-500">Visible on public blog listing</span>
                </div>
              </label>
              <button type="submit" disabled={submitting} className="admin-btn-primary w-full">
                {submitting ? 'Saving…' : editing ? 'Update blog' : 'Publish blog'}
              </button>
            </aside>
          </div>
        </form>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="admin-section-title">All posts ({blogs.length})</h2>
        </div>

        {blogs.length === 0 ? (
          <div className="admin-card flex flex-col items-center justify-center p-16 text-center">
            <FileText size={40} className="text-slate-300" />
            <p className="mt-4 font-semibold text-slate-800">No blog posts yet</p>
            <p className="mt-1 text-sm text-slate-500">Run npm run seed:blogs in backend or create your first post.</p>
            <button type="button" className="admin-btn-primary mt-4" onClick={openCreate}>
              <Plus size={16} /> Create post
            </button>
          </div>
        ) : (
          <div className="admin-blog-grid">
            {blogs.map((blog) => (
              <article key={blog._id} className="admin-blog-card admin-card overflow-hidden">
                <div className="admin-blog-card-image">
                  {blog.coverImage ? (
                    <img src={getMediaUrl(blog.coverImage)} alt="" />
                  ) : (
                    <div className="admin-blog-card-placeholder">No cover</div>
                  )}
                  <span className="admin-blog-card-status">
                    <StatusBadge status={blog.isPublished ? 'ACTIVE' : 'INACTIVE'} />
                  </span>
                </div>
                <div className="admin-blog-card-body">
                  <h3 className="line-clamp-2 font-bold text-slate-900">{blog.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{blog.excerpt}</p>
                  {blog.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {blog.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="admin-blog-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                    <Calendar size={12} />
                    {formatDate(blog.publishedAt || blog.createdAt)}
                    {blog.author?.name && ` · ${blog.author.name}`}
                  </p>
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <button type="button" className="admin-btn-secondary flex-1 !py-2" onClick={() => openEdit(blog)}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      className="admin-btn-secondary !px-3 !py-2 text-red-600 hover:border-red-200 hover:bg-red-50"
                      onClick={() => onDelete(blog)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
