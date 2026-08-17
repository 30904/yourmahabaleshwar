import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublicBlogs } from '../../services/listingsApi';
import Card from '../../components/ui/Card';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  useEffect(() => { fetchPublicBlogs().then(setBlogs).catch(() => setBlogs([
    { title: 'Top 10 Places', excerpt: 'Best viewpoints in Mahabaleshwar', slug: 'top-10' },
  ])); }, []);
  return (
    <div className="page-container py-10">
      <h1 className="text-3xl font-bold">Travel Blogs</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.map((b) => <Card key={b.slug || b._id}><h3 className="font-semibold">{b.title}</h3><p className="mt-2 text-sm text-slate-600">{b.excerpt}</p></Card>)}
      </div>
    </div>
  );
}
