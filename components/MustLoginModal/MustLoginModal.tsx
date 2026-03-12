import { useRouter } from "next/navigation";
import styles from './MustLoginModal.module.css'
import commonStyles from '../../app/styles/common.module.css';

interface MustLoginModalProps {
  message?: string;
  onClose?: () => void;
}

export default function MustLoginModal({ message = "Log in to access this feature.", onClose }: MustLoginModalProps) {
  const router = useRouter();
  return (
    <div
      className={commonStyles.modalBackdrop}
      onClick={onClose}
    >
      <div className={commonStyles.formContainer} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.heading}>{message}</h2>
        <h3 className={styles.divider}>Already have an account?</h3>
        <button className={commonStyles.primaryBtn} type="button" onClick={async () => router.push("/login")}> Login </button>
        <h3 className={styles.divider}>New</h3>
        <button className={commonStyles.secondaryBtn} type="button" onClick={async () => router.push("/signUp")}> Create Account </button>
      </div>
    </div>
  )
}