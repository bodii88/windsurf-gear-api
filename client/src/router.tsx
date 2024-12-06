import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Login from './components/Login';
import Register from './components/Register';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
]);
