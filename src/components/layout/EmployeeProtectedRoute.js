import React from 'react';
import { Navigate } from 'react-router-dom';
import { getEmployeeSession } from '../../utils/employeeSession';

const EmployeeProtectedRoute = ({ children }) => {
  const session = getEmployeeSession();

  if (!session) {
    return <Navigate to="/login-empleado" replace />;
  }

  return children;
};

export default EmployeeProtectedRoute;
