import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../api';
import styles from './AddUser.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddUser() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): string => {
    if (!name.trim()) return 'Name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!EMAIL_RE.test(email)) return 'Please enter a valid email address.';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      await createUser(name.trim(), email.trim());
      navigate('/users');
    } catch (e) {
      console.error(e);
      setError('Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Add New User</h1>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.form}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="John Doe"
            maxLength={100}
            disabled={loading}
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="john@example.com"
            type="email"
            disabled={loading}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={() => navigate('/')} disabled={loading}>
            Cancel
          </button>
          <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
            {loading ? <span className={styles.spinnerInline} /> : null}
            {loading ? 'Adding…' : 'Add User'}
          </button>
        </div>
      </div>
    </div>
  );
}
