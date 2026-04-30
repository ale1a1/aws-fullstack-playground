import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Users Manager</h1>
      <p className={styles.subtitle}>A NestJS + AWS learning project</p>
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={() => navigate('/users')}>
          View All Users
        </button>
        <button className={styles.btnSecondary} onClick={() => navigate('/add')}>
          Add New User
        </button>
      </div>
    </div>
  );
}
