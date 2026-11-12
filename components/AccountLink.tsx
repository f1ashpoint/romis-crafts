'use client';
import Link from 'next/link';
import { useAccount } from './AccountProvider';
export default function AccountLink() {
  const { user, wishlist, ready } = useAccount();
  return (<span className="acctlinks">{user && <Link className="wishlink" href="/account/wishlist" aria-label={`Wishlist, ${wishlist.length} saved`}>♡{wishlist.length > 0 && <b>{wishlist.length}</b>}</Link>}
    <Link className="acctlink" href={user ? '/account' : '/account/login'}>{ready && user ? user.name.split(' ')[0] : 'Sign in'}</Link></span>);
}
