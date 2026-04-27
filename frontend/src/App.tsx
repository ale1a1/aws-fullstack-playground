import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser, User } from './api';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState<User | null>(null);

  const refresh = () => getUsers().then(setUsers).catch(console.error);

  useEffect(() => { refresh(); }, []);

  const handleSubmit = async () => {
    if (!name || !email) return;
    try {
      if (editing) {
        await updateUser(editing.id, name, email);
        setEditing(null);
      } else {
        await createUser(name, email);
      }
      setName('');
      setEmail('');
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (user: User) => {
    setEditing(user);
    setName(user.name);
    setEmail(user.email);
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
    <div>
      <h1>Users</h1>

      <div>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <button onClick={handleSubmit}>{editing ? 'Update' : 'Add'}</button>
        {editing && <button onClick={() => { setEditing(null); setName(''); setEmail(''); }}>Cancel</button>}
      </div>

      <ul>
        {users.map(u => (
          <li key={u.id}>
            {u.name} — {u.email}
            <button onClick={() => handleEdit(u)}>Edit</button>
            <button onClick={() => handleDelete(u.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
