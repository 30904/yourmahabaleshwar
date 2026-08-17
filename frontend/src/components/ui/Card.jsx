export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={`card ${padding ? 'p-5 sm:p-6' : ''} ${className}`}>{children}</div>
  );
}
