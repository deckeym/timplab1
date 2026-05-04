import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Form from './pages/Form';
import NotFound from './pages/NotFound';
import Login from './auth/Login';
import Register from './auth/Register';
import PrivateRoute from './auth/PrivateRoute';
import AdminRoute from './auth/AdminRoute';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import DnsRecords from './pages/DnsRecords';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/' element={<Navigate to='/dashboard' replace />} />
        <Route path='/dashboard' element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path='/profile' element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path='/dns' element={<PrivateRoute><DnsRecords /></PrivateRoute>} />
        <Route path='/admin' element={<PrivateRoute><AdminRoute><AdminPanel /></AdminRoute></PrivateRoute>} />
        <Route path='/detail/:id' element={<PrivateRoute><Detail /></PrivateRoute>} />
        <Route path='/add' element={<PrivateRoute><Form /></PrivateRoute>} />
        <Route path='/edit/:id' element={<PrivateRoute><Form /></PrivateRoute>} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
