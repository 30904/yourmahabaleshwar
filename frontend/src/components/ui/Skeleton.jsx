export default function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}
