import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, 
  FiUsers, 
  FiClipboard, 
  FiSettings, 
  FiShield, 
  FiActivity,
  FiBarChart2
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: FiHome, roles: ['super-admin', 'admin', 'manager', 'employee'] },
    { path: '/users', name: 'Users', icon: FiUsers, roles: ['super-admin', 'admin', 'manager'] },
    { path: '/audit-logs', name: 'Audit Logs', icon: FiClipboard, roles: ['super-admin', 'admin'] },
    { path: '/analytics', name: 'Analytics', icon: FiBarChart2, roles: ['super-admin', 'admin'] },
    { path: '/settings', name: 'Settings', icon: FiSettings, roles: ['super-admin', 'admin'] },
  ];

  const filteredMenu = menuItems.filter(item => 
    !item.roles || hasRole(item.roles)
  );

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 bg-primary-600">
            <div className="flex items-center space-x-2">
              <FiShield className="h-8 w-8 text-white" />
              <span className="text-white font-bold text-xl">AdminPanel</span>
            </div>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 mt-1">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {filteredMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={onClose}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>© 2024 AdminPanel</p>
              <p className="mt-1">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;