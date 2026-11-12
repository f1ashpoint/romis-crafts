import Link from 'next/link';
import SignOut from './SignOut';
export default function AccountNav({ here, name }: { here: string; name: string }) {
  const L = [['/account', 'Orders'], ['/account/wishlist', 'Wishlist'], ['/account/addresses', 'Addresses'], ['/account/profile', 'Profile']];
  return (<><h1>Hello, {name.split(' ')[0]}</h1><nav className="acctnav" aria-label="Account">{L.map(([h, t]) => <Link key={h} href={h} aria-current={h === here ? 'page' : undefined}>{t}</Link>)}<SignOut /></nav></>);
}
