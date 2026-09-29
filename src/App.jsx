import React from 'react';
import { BrowserRouter , Routes , Route } from 'react-router-dom';
import Login from '../src/Login.jsx';
import NotFound from '../src/Dashboard.jsx';
import Dashboard from '../src/NotFound.jsx';

const App = () => {
  return (
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Login />} />
      <Route path='/dashboard' element={<NotFound/>} />
      <Route path='*' element={<Dashboard />} />
      </Routes>
      </BrowserRouter>
  )
}

export default App