import { useRouter } from "next/navigation";
import styles from './MustLoginModal.module.css'

interface MustLoginModalProps {
  message?: string;
  onClose?: () => void;
}

export default function MustLoginModal({ message = "Log in to access this feature.", onClose }: MustLoginModalProps) {
  const router = useRouter();
  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
    >
      <div className={styles.modalForm} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.formHeader}>{message}</h2>
        <h3 className={styles.formSubHeader}>Already have an account?</h3>
        <button className={styles.primaryBtn} type="button" onClick={async () => router.push("/login")}> Login </button>
        <h3 className={styles.formSubHeader}>New?</h3>
        <button className={styles.secondaryBtn} type="button" onClick={async () => router.push("/signUp")}> Create Account </button>
      </div>
    </div>
  )
}