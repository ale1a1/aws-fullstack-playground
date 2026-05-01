import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.badge}>NestJS + AWS</div>
        <h1 className={styles.title}>Users Manager</h1>
        <p className={styles.subtitle}>
          A full-stack demo app for managing users. Built with NestJS on the backend and deployed
          on AWS Lambda, it lets you create, view, edit, and delete user records through a REST API.
        </p>

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>👤</span>
            <div>
              <strong>User CRUD</strong>
              <p>Create, read, update and delete user records with name and email.</p>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>☁️</span>
            <div>
              <strong>Serverless Backend</strong>
              <p>NestJS API deployed as AWS Lambda behind API Gateway.</p>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🗄️</span>
            <div>
              <strong>Persistent Storage</strong>
              <p>Data stored in a relational database — no data lost between sessions.</p>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => navigate('/users')}>
            View All Users
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate('/add')}>
            Add New User
          </button>
        </div>
      </div>
    </div>
  );
}
