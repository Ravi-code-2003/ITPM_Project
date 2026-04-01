import React, { useState, useEffect } from 'react';
import { Plus, Vote, Clock, CheckCircle, XCircle, Trash2, Eye, Edit3, TrendingUp } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PollManagement = () => {
  const [polls, setPolls] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    proposals: [
      { foodItemId: '', proposedDiscount: '', description: '' },
      { foodItemId: '', proposedDiscount: '', description: '' }
    ]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pollsRes, foodsRes] = await Promise.all([
        api.get('/shop/polls-new'),
        api.get('/shop/foods')
      ]);
      
      setPolls(pollsRes.data.polls || []);
      setFoods(foodsRes.data.foods || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load polls and food items');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProposalChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      proposals: prev.proposals.map((proposal, i) => 
        i === index ? { ...proposal, [field]: value } : proposal
      )
    }));
  };

  const addProposal = () => {
    if (formData.proposals.length < 5) {
      setFormData(prev => ({
        ...prev,
        proposals: [...prev.proposals, { foodItemId: '', proposedDiscount: '', description: '' }]
      }));
    }
  };

  const removeProposal = (index) => {
    if (formData.proposals.length > 2) {
      setFormData(prev => ({
        ...prev,
        proposals: prev.proposals.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a poll title');
      return;
    }

    const validProposals = formData.proposals.filter(p => p.foodItemId && p.proposedDiscount);
    if (validProposals.length < 2) {
      toast.error('Please add at least 2 valid proposals');
      return;
    }

    try {
      await api.post('/shop/polls-new', {
        ...formData,
        proposals: validProposals
      });
      
      toast.success('Poll created successfully!');
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        proposals: [
          { foodItemId: '', proposedDiscount: '', description: '' },
          { foodItemId: '', proposedDiscount: '', description: '' }
        ]
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create poll');
    }
  };

  const togglePollStatus = async (pollId, currentStatus) => {
    try {
      await api.put(`/shop/polls/${pollId}/status`, {
        isActive: !currentStatus
      });
      toast.success(`Poll ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update poll status');
    }
  };

  const createOfferFromPoll = async (pollId, proposalId) => {
    try {
      const response = await api.post(`/shop/polls/${pollId}/create-offer`, {
        proposalId
      });
      
      toast.success('Offer created successfully from poll results!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create offer');
    }
  };

  const deletePoll = async (pollId) => {
    if (window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      try {
        await api.delete(`/shop/polls/${pollId}`);
        toast.success('Poll deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete poll');
      }
    }
  };

  const getStatusColor = (poll) => {
    if (poll.isExpired) return 'text-gray-500';
    if (!poll.isActive) return 'text-red-500';
    return 'text-green-500';
  };

  const getStatusIcon = (poll) => {
    if (poll.isExpired) return <Clock className="h-4 w-4" />;
    if (!poll.isActive) return <XCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusText = (poll) => {
    if (poll.isExpired) return 'Expired';
    if (!poll.isActive) return 'Inactive';
    return 'Active';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Poll Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Create and manage customer voting polls for offers</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Poll
        </Button>
      </div>

      {/* Create Poll Form */}
      {showCreateForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Poll</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Poll Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="e.g., Choose Tomorrow's Special Offer"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="Optional description for students"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium">Offer Proposals (Min: 2, Max: 5)</label>
                {formData.proposals.length < 5 && (
                  <Button type="button" onClick={addProposal} variant="outline" size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Proposal
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {formData.proposals.map((proposal, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Proposal {index + 1}</h4>
                      {formData.proposals.length > 2 && (
                        <Button
                          type="button"
                          onClick={() => removeProposal(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Food Item *</label>
                        <select
                          value={proposal.foodItemId}
                          onChange={(e) => handleProposalChange(index, 'foodItemId', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                          required
                        >
                          <option value="">Select food item</option>
                          {foods.filter(food => food.status === 'Available').map(food => (
                            <option key={food._id} value={food._id}>
                              {food.name} (LKR {food.price})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium mb-1">Discount % *</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={proposal.proposedDiscount}
                          onChange={(e) => handleProposalChange(index, 'proposedDiscount', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                          placeholder="e.g., 15"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium mb-1">Custom Description</label>
                        <input
                          type="text"
                          value={proposal.description}
                          onChange={(e) => handleProposalChange(index, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700" 
                          placeholder="Optional custom description"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit">Create Poll</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Info Card */}
      {polls.length === 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Vote className="h-4 w-4" />
            <p>No polls created yet. Create your first poll to get customer feedback on offers!</p>
          </div>
        </Card>
      )}

      {/* Polls List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {polls.map(poll => {
          const totalVotes = poll.proposals?.reduce((sum, p) => sum + p.votes, 0) || 0;
          const topProposal = poll.proposals?.sort((a, b) => b.votes - a.votes)[0];
          
          return (
            <Card key={poll._id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {poll.title}
                  </h3>
                  {poll.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {poll.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`flex items-center gap-1 ${getStatusColor(poll)}`}>
                      {getStatusIcon(poll)}
                      {getStatusText(poll)}
                    </div>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {totalVotes} total votes
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!poll.isExpired && (
                    <Button
                      onClick={() => togglePollStatus(poll._id, poll.isActive)}
                      size="sm"
                      variant={poll.isActive ? "outline" : "primary"}
                    >
                      {poll.isActive ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                    </Button>
                  )}
                  <Button
                    onClick={() => deletePoll(poll._id)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Poll Proposals */}
              <div className="space-y-3">
                {poll.proposals?.map((proposal, index) => {
                  const percentage = totalVotes > 0 ? (proposal.votes / totalVotes * 100) : 0;
                  const isTopVoted = proposal._id === topProposal?._id && proposal.votes > 0;
                  
                  return (
                    <div 
                      key={proposal._id} 
                      className={`border rounded-lg p-3 ${
                        isTopVoted 
                          ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">
                              {proposal.foodItemId?.name}
                            </h4>
                            {isTopVoted && (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {proposal.proposedDiscount}% off • LKR {proposal.foodItemId?.price}
                          </p>
                          {proposal.description && (
                            <p className="text-xs text-gray-500 mt-1">{proposal.description}</p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{proposal.votes}</div>
                          <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      {/* Vote Progress Bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isTopVoted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              {totalVotes > 0 && topProposal && poll.isActive && !poll.isExpired && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => createOfferFromPoll(poll._id, topProposal._id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Create Offer from Winner ({topProposal.votes} votes)
                  </Button>
                </div>
              )}
              
              {totalVotes === 0 && poll.isActive && !poll.isExpired && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 text-center">
                    Waiting for student votes...
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PollManagement;