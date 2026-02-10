'use client';

import { useRouter } from 'next/navigation';
import styles from './home.module.css';
import { useUser } from '../../providers/UserProvider';


export default function Home() {
  const router = useRouter();
  const { user, logout } = useUser();
  async function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className={styles.container}>
      <h2>
        Welcome {user?.name || "friend"}{" "}
        {user?.isAdmin && "👑"}
        {user?.isMechanic && "🔧"}
      </h2>
      <h2>
        {user?.biography || ""}
      </h2>
      <img src="/images/waitingCat.jpg"></img>
      <button
        className="text-black bg-white border border-black outline-none cursor-pointer"
        onClick={handleLogout}
      >
        {user ? "log out" : "login"}
      </button>
    </div>
  );
}