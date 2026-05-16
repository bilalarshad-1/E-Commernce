// components/common/Breadcrumbs.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiChevronRight } from 'react-icons/fi';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <nav className="bg-gray-100 py-3">
      <div className="container mx-auto px-4">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link to="/" className="text-gray-500 hover:text-primary-600 flex items-center gap-1">
              <FiHome className="h-4 w-4" />
              Home
            </Link>
          </li>
          {pathnames.map((name, index) => {
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            
            // Format the breadcrumb name
            let displayName = name.replace(/-/g, ' ');
            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
            
            return (
              <React.Fragment key={name}>
                <FiChevronRight className="h-3 w-3 text-gray-400" />
                <li>
                  {isLast ? (
                    <span className="text-gray-900 font-medium">{displayName}</span>
                  ) : (
                    <Link to={routeTo} className="text-gray-500 hover:text-primary-600">
                      {displayName}
                    </Link>
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};
s
export default Breadcrumbs;