import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService, auditService } from '../services/api';
import { FiUsers, FiActivity, FiShield, FiTrendingUp } from 'react-icons/fi';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    recentActivities: [],
    userGrowth: 0,
    activeSessions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, auditRes] = await Promise.all([
        userService.getUsers({ limit: 100 }),
        auditService.getAuditLogs({ limit: 10 })
      ]);

      setStats({
        totalUsers: usersRes.data.count || 0,
        recentActivities: auditRes.data.data || [],
        userGrowth: 12, // This would come from actual calculations
        activeSessions: 8
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: FiUsers,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions,
      icon: FiActivity,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'increase'
    },
    {
      title: 'User Growth',
      value: `${stats.userGrowth}%`,
      icon: FiTrendingUp,
      color: 'bg-purple-500',
      change: '+2%',
      changeType: 'increase'
    },
    {
      title: 'Security Score',
      value: '98%',
      icon: FiShield,
      color: 'bg-yellow-500',
      change: 'Excellent',
      changeType: 'neutral'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-primary-100">
          Here's what's happening with your admin dashboard today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.change && (
                  <p className={`text-xs mt-2 ${
                    stat.changeType === 'increase' ? 'text-green-600' : 
                    stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </p>
                )}
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          <p className="text-sm text-gray-600 mt-1">Latest system activities and user actions</p>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action} - {activity.entity}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.userEmail} • {activity.details?.action || activity.details?.login || 'No details'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {format(new Date(activity.timestamp), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(activity.timestamp), 'hh:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent activities found
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full btn-primary text-left">
              + Add New User
            </button>
            <button className="w-full btn-secondary text-left">
              📊 Generate Report
            </button>
            <button className="w-full btn-secondary text-left">
              🔍 View Audit Logs
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="text-sm font-medium text-green-600">● Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-sm font-medium text-green-600">● Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-sm text-gray-900">Today, 02:00 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;