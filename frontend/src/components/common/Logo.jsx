import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';

const variants = {
  navbar: 'block h-9 w-auto max-w-[124px] sm:h-11 sm:max-w-[144px] xl:h-12 xl:max-w-[156px]',
  footer: 'block h-20 w-auto sm:h-24',
  auth: 'block h-24 w-auto sm:h-28 mx-auto',
  sidebar: 'block h-14 w-auto',
  hero: 'block h-28 w-auto sm:h-32 md:h-36 mx-auto',
  sm: 'block h-12 w-auto',
};

export default function Logo({
  variant = 'navbar',
  className = '',
  link = true,
  alt = 'YOURMAHABALESHWAR.COM — Discover, Book, Experience',
}) {
  const img = (
    <img
      src={logoImg}
      alt={alt}
      className={`shrink-0 object-contain object-left ${variants[variant] || variants.navbar} ${className}`}
      loading="eager"
      decoding="async"
    />
  );

  if (!link) {
    return <span className="inline-flex shrink-0 items-center">{img}</span>;
  }

  return (
    <Link to="/" className="inline-flex shrink-0 items-center" aria-label="Go to homepage">
      {img}
    </Link>
  );
}
