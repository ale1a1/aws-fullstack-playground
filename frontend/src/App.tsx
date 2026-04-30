import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Users from './pages/Users';
import AddUser from './pages/AddUser';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users" element={<Users />} />
        <Route path="/add" element={<AddUser />} />
      </Routes>
    </BrowserRouter>
  );
}
