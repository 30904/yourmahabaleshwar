import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link'],
  [{ align: [] }],
  ['clean'],
];

export default function RichTextEditor({ value, onChange, placeholder }) {
  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR,
    }),
    []
  );

  return (
    <div className="admin-rich-editor">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder || 'Write your article…'}
      />
    </div>
  );
}
