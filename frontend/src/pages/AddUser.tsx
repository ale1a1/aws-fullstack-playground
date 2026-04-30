import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../api';
import styles from './AddUser.module.css';

export default function AddUser() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name || !email) {
      setError('Name and email are required.');
      return;
    }
    try {
      await createUser(email, name);
      navigate('/users');
    } catch (e) {
      console.error(e);
      setError('Failed to create user. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Add New User</h1>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.form}>
          <label>Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="John Doe"
          />
          <label>Email</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="john@example.com"
            type="email"
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={() => navigate('/')}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleSubmit}>Add User</button>
        </div>
      </div>
    </div>
  );
}
