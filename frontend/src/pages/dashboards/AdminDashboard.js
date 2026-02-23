import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Activity, CheckCircle, XCircle, Eye, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingData, statsData] = await Promise.all([
        adminAPI.getPendingUsers(),
        adminAPI.getDashboardStats()
      ]);
      
      setPendingUsers(pendingData.pendingUsers || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      
      // Check if it's an authorization error
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('You do not have permission to access admin dashboard');
      } else {
        toast.error(error.response?.data?.message || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleApprove = async (userId) => {
    try {
      setActionLoading(true);
      await adminAPI.approveUser(userId);
      toast.success('User approved successfully');
      setShowModal(false);
      setSelectedUser(null);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error(error.response?.data?.message || 'Failed to approve user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId) => {
    try {
      setActionLoading(true);
      await adminAPI.rejectUser(userId);
      toast.success('User rejected');
      setShowModal(false);
      setSelectedUser(null);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error(error.response?.data?.message || 'Failed to reject user');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'student': 'bg-accent/20 text-primary dark:text-accent',
      'shop-owner': 'bg-accent/20 text-primary dark:text-accent',
      'house-owner': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'education-path': 'bg-accent/20 text-primary dark:text-accent',
    };
    return colors[role] || 'bg-accent/20 text-primary dark:text-accent';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100">Admin Dashboard</h1>
          <p className="text-secondary dark:text-gray-400 mt-2">Manage users and platform operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {loading ? '...' : stats?.totalUsers || 0}
                  </p>
                </div>
                <div className="bg-accent/20 p-3 rounded-lg">
                  <Users className="h-8 w-8 text-primary dark:text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {loading ? '...' : stats?.statusCounts?.approved || 0}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <UserCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {loading ? '...' : stats?.statusCounts?.pending || 0}
                  </p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                  <UserX className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Rejected</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {loading ? '...' : stats?.statusCounts?.rejected || 0}
                  </p>
                </div>
                <div className="bg-accent/20 p-3 rounded-lg">
                  <Activity className="h-8 w-8 text-primary dark:text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Pending User Approvals</CardTitle>
              <CardDescription>Review and approve user registration requests</CardDescription>
            </div>
            <span className="bg-accent/20 text-primary dark:text-accent px-3 py-1 rounded-full text-sm font-medium">
              {pendingUsers.length} Pending
            </span>
          </CardHeader>
          <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-secondary dark:text-gray-400">Loading pending users...</p>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="p-8 text-center">
                <UserCheck className="h-12 w-12 text-secondary dark:text-gray-600 mx-auto mb-3" />
                <p className="text-secondary dark:text-gray-400">No pending approvals</p>
                <p className="text-sm text-secondary dark:text-gray-500 mt-1">All users have been reviewed</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-secondary/20 dark:divide-secondary/10">
                <thead className="bg-accent/10 dark:bg-accent/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary dark:text-gray-300 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary dark:text-gray-300 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface dark:bg-surface-dark divide-y divide-secondary/10">
                  {pendingUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-accent/5 dark:hover:bg-accent/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-primary dark:text-gray-100">{user.fullName}</div>
                          <div className="text-sm text-secondary dark:text-gray-400">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary dark:text-gray-200">{user.phoneNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="text-primary dark:text-accent hover:text-primary-hover mr-4"
                        >
                          <Eye className="h-5 w-5 inline" />
                        </button>
                        <button
                          onClick={() => handleApprove(user._id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 mr-4"
                          disabled={actionLoading}
                        >
                          <CheckCircle className="h-5 w-5 inline" />
                        </button>
                        <button
                          onClick={() => handleReject(user._id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          disabled={actionLoading}
                        >
                          <XCircle className="h-5 w-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </CardContent>
        </Card>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-primary/50 dark:bg-primary/70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-secondary/20 dark:border-secondary/10 w-full max-w-2xl shadow-soft-xl rounded-xl bg-surface dark:bg-surface-dark">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-primary dark:text-gray-100">User Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-gray-200"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Personal Information */}
              <div className="bg-surface/50 dark:bg-surface-dark/50 p-4 rounded-lg border border-secondary/20 dark:border-secondary/10">
                <h4 className="font-semibold text-primary dark:text-gray-100 mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-secondary dark:text-gray-400">Full Name</p>
                    <p className="font-medium text-primary dark:text-gray-200">{selectedUser.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary dark:text-gray-400">Role</p>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-surface/50 dark:bg-surface-dark/50 p-4 rounded-lg border border-secondary/20 dark:border-secondary/10">
                <h4 className="font-semibold text-primary dark:text-gray-100 mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-secondary dark:text-gray-500 mr-2" />
                    <span className="text-sm text-primary dark:text-gray-200">{selectedUser.email}</span>
                  </div>
                  {selectedUser.phoneNumber && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-secondary dark:text-gray-500 mr-2" />
                      <span className="text-sm text-primary dark:text-gray-200">{selectedUser.phoneNumber}</span>
                    </div>
                  )}
                  {selectedUser.address && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-secondary dark:text-gray-500 mr-2" />
                      <span className="text-sm text-primary dark:text-gray-200">{selectedUser.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Registration Details */}
              <div className="bg-surface/50 dark:bg-surface-dark/50 p-4 rounded-lg border border-secondary/20 dark:border-secondary/10">
                <h4 className="font-semibold text-primary dark:text-gray-100 mb-3">Registration Details</h4>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-secondary dark:text-gray-500 mr-2" />
                  <span className="text-sm text-primary dark:text-gray-200">Registered on {formatDate(selectedUser.createdAt)}</span>
                </div>
              </div>

              {/* Additional Info based on role */}
              {(selectedUser.role === 'shop-owner' || selectedUser.role === 'house-owner' || selectedUser.role === 'education-path') && (
                <div className="bg-surface/50 dark:bg-surface-dark/50 p-4 rounded-lg border border-secondary/20 dark:border-secondary/10">
                  <h4 className="font-semibold text-primary dark:text-gray-100 mb-3">Additional Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.businessName && (
                      <div>
                        <p className="text-sm text-secondary dark:text-gray-400">Business Name</p>
                        <p className="font-medium text-primary dark:text-gray-200">{selectedUser.businessName}</p>
                      </div>
                    )}
                    {selectedUser.propertyType && (
                      <div>
                        <p className="text-sm text-secondary dark:text-gray-400">Property Type</p>
                        <p className="font-medium text-primary dark:text-gray-200">{selectedUser.propertyType}</p>
                      </div>
                    )}
                    {selectedUser.institutionName && (
                      <div>
                        <p className="text-sm text-secondary dark:text-gray-400">Institution Name</p>
                        <p className="font-medium text-primary dark:text-gray-200">{selectedUser.institutionName}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
              >
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => handleReject(selectedUser._id)}
                disabled={actionLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {actionLoading ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                onClick={() => handleApprove(selectedUser._id)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {actionLoading ? 'Processing...' : 'Approve'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;