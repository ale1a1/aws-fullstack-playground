import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, updateUser, deleteUser, User } from '../api';
import styles from './Users.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAGE_SIZE = 7;

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editError, setEditError] = useState('');
  const [page, setPage] = useState(1);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageUsers = users.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleEdit = (user: User) => {
    setEditing(user);
    setName(user.name);
    setEmail(user.email);
    setEditError('');
  };

  const isDirty = editing && (name.trim() !== editing.name || email.trim() !== editing.email);

  const handleUpdate = async () => {
    if (!editing) return;
    if (!name.trim()) { setEditError('Name is required.'); return; }
    if (!EMAIL_RE.test(email)) { setEditError('Please enter a valid email address.'); return; }
    setSaving(true);
    try {
      await updateUser(editing.id, name.trim(), email.trim());
      setEditing(null);
      setName('');
      setEmail('');
      setEditError('');
      await refresh();
    } catch (e) {
      console.error(e);
      setEditError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteUser(id);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelEdit = () => { setEditing(null); setName(''); setEmail(''); setEditError(''); };

  const busy = saving || deletingId !== null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>All Users</h1>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={() => navigate('/')} disabled={busy}>Home</button>
          <button className={styles.btnPrimary} onClick={() => navigate('/add')} disabled={busy}>Add New User</button>
        </div>
      </div>

      {editing && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget && !saving) cancelEdit(); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit User</h2>
              <button className={styles.modalClose} onClick={cancelEdit} disabled={saving} aria-label="Close">✕</button>
            </div>
            {editError && <p className={styles.editError}>{editError}</p>}
            <div className={styles.modalForm}>
              <label htmlFor="edit-name">Name</label>
              <input
                id="edit-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name"
                maxLength={100}
                disabled={saving}
              />
              <label htmlFor="edit-email">Email</label>
              <input
                id="edit-email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                disabled={saving}
              />
            </div>
            <div className={styles.editActions}>
              <button className={styles.btnSecondary} onClick={cancelEdit} disabled={saving}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleUpdate} disabled={saving || !isDirty}>
                {saving ? <span className={styles.spinnerInline} /> : null}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className={styles.loadingCell}>
                <span className={styles.spinner} />
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={4} className={styles.emptyCell}>No users found. Add one!</td>
            </tr>
          ) : pageUsers.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td title={u.name}>{u.name}</td>
              <td title={u.email}>{u.email}</td>
              <td className={styles.rowActions}>
                <button
                  className={styles.btnEdit}
                  onClick={() => handleEdit(u)}
                  disabled={busy || !!editing}
                >Edit</button>
                <button
                  className={styles.btnDelete}
                  onClick={() => handleDelete(u.id)}
                  disabled={busy}
                >
                  {deletingId === u.id ? <span className={styles.spinnerInline} /> : null}
                  {deletingId === u.id ? 'Deleting…' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className={styles.cardList}>
        {loading ? (
          <div className={styles.loadingCards}>
            <span className={styles.spinner} />
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyCards}>No users found. Add one!</div>
        ) : pageUsers.map(u => (
          <div key={u.id} className={styles.card}>
            <div className={styles.cardField}>Name</div>
            <div className={styles.cardValue}>{u.name}</div>
            <div className={styles.cardField}>Email</div>
            <div className={styles.cardValue}>{u.email}</div>
            <div className={styles.cardActions}>
              <button
                className={styles.btnEdit}
                onClick={() => handleEdit(u)}
                disabled={busy || !!editing}
              >Edit</button>
              <button
                className={styles.btnDelete}
                onClick={() => handleDelete(u.id)}
                disabled={busy}
              >
                {deletingId === u.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >← Prev</button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
          >Next →</button>
        </div>
      )}
    </div>
  );
}
