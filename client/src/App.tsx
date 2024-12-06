import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
  Navigate
} from 'react-router-dom';
import ItemsGrid from './components/ItemsGrid';
import LocationManager from './components/LocationManager';
import CategoryManager from './components/CategoryManager';
import ItemManager from './components/ItemManager';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';

function App() {
  const isAuthenticated = localStorage.getItem('token') !== null;

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<Layout />}>
        <Route path="/" element={isAuthenticated ? <ItemsGrid /> : <Navigate to="/login" />} />
        <Route path="/locations" element={isAuthenticated ? <LocationManager /> : <Navigate to="/login" />} />
        <Route path="/categories" element={isAuthenticated ? <CategoryManager /> : <Navigate to="/login" />} />
        <Route path="/items" element={isAuthenticated ? <ItemManager /> : <Navigate to="/login" />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

export default App;
