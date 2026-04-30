import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, updateUser, deleteUser, User } from '../api';
import styles from './Users.module.css';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const refresh = () => getUsers().then(setUsers).catch(console.error);

  useEffect(() => { refresh(); }, []);

  const handleEdit = (user: User) => {
    setEditing(user);
    setName(user.name);
    setEmail(user.email);
  };

  const handleUpdate = async () => {
    if (!editing || !name || !email) return;
    try {
      await updateUser(editing.id, name, email);
      setEditing(null);
      setName('');
      setEmail('');
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>All Users</h1>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={() => navigate('/')}>Home</button>
          <button className={styles.btnPrimary} onClick={() => navigate('/add')}>Add New User</button>
        </div>
      </div>

      {editing && (
        <div className={styles.editBox}>
          <h2>Edit User</h2>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          <div className={styles.editActions}>
            <button className={styles.btnPrimary} onClick={handleUpdate}>Save</button>
            <button className={styles.btnSecondary} onClick={() => { setEditing(null); setName(''); setEmail(''); }}>Cancel</button>
          </div>
        </div>
      )}

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
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td className={styles.rowActions}>
                <button className={styles.btnEdit} onClick={() => handleEdit(u)}>Edit</button>
                <button className={styles.btnDelete} onClick={() => handleDelete(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
