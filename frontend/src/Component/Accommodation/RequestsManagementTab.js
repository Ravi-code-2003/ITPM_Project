import React, { useState, useEffect } from 'react';
import { User, Check } from 'lucide-react';
import * as yup from 'yup';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import { roomRequestService } from '../../services/accommodationService';
import toast from 'react-hot-toast';

const RESPONSE_STATUSES = ['ACCEPTED', 'REJECTED', 'REQUEST_MORE_INFO'];
const CONTACT_METHODS = ['whatsapp', 'phone', 'email'];

const initialResponseData = {
  status: 'ACCEPTED',
  preferredContactMethod: 'whatsapp',
  availableVisitingTimes: '',
  responseMessage: '',
};

const trimText = (value) => (typeof value === 'string' ? value.trim() : value);

export const bookingResponseValidationSchema = yup.object({
  status: yup
    .string()
    .oneOf(RESPONSE_STATUSES, 'Response must be Accept, Reject, or Request More Info')
    .required('Response is required'),

  preferredContactMethod: yup
    .string()
    .transform(trimText)
    .when('status', {
      is: 'ACCEPTED',
      then: (schema) =>
        schema
          .oneOf(CONTACT_METHODS, 'Preferred Contact Method must be WhatsApp, Phone, or Email')
          .required('Preferred Contact Method is required when Response is Accept'),
      otherwise: (schema) => schema.notRequired(),
    }),

  availableVisitingTimes: yup
    .string()
    .transform(trimText)
    .when('status', {
      is: 'ACCEPTED',
      then: (schema) =>
        schema
          .required('Available Visiting Times is required when Response is Accept')
          .min(5, 'Available Visiting Times must be at least 5 characters')
          .max(100, 'Available Visiting Times cannot exceed 100 characters'),
      otherwise: (schema) => schema.notRequired(),
    }),

  responseMessage: yup
    .string()
    .transform(trimText)
    .max(500, 'Message to Student cannot exceed 500 characters')
    .when('status', {
      is: (status) => status === 'REJECTED' || status === 'REQUEST_MORE_INFO',
      then: (schema) =>
        schema.required('Message to Student is required when Response is Reject or Request More Info'),
      otherwise: (schema) => schema.notRequired(),
    }),
});

const RequestsManagementTab = ({ onUpdate }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseData, setResponseData] = useState(initialResponseData);
  const [responseErrors, setResponseErrors] = useState({});

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await roomRequestService.getOwnerRequests(filter !== 'ALL' ? filter : null);
      setRequests(response.data || []);
      onUpdate && onUpdate();
    } catch (error) {
      toast.error('Failed to fetch requests');
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (request) => {
    setRespondingTo(request._id);
    setResponseData(initialResponseData);
    setResponseErrors({});
  };

  const handleResponseFieldChange = (field, value) => {
    if (field === 'status') {
      setResponseData((prev) => ({
        ...prev,
        status: value,
        preferredContactMethod: value === 'ACCEPTED' ? (prev.preferredContactMethod || 'whatsapp') : '',
        availableVisitingTimes: value === 'ACCEPTED' ? prev.availableVisitingTimes : '',
      }));

      setResponseErrors((prev) => ({
        ...prev,
        status: '',
        preferredContactMethod: '',
        availableVisitingTimes: '',
        responseMessage: '',
      }));
      return;
    }

    setResponseData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setResponseErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const getFieldClassName = (field) => {
    const base = 'w-full px-3 py-2 border rounded-lg focus:ring-2 dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100';
    const valid = 'border-secondary/30 focus:ring-primary';
    const invalid = 'border-red-500 focus:ring-red-500';
    return `${base} ${responseErrors[field] ? invalid : valid}`;
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();

    try {
      const trimmedPayload = {
        status: responseData.status,
        preferredContactMethod: trimText(responseData.preferredContactMethod),
        availableVisitingTimes: trimText(responseData.availableVisitingTimes),
        responseMessage: trimText(responseData.responseMessage),
      };

      const validated = await bookingResponseValidationSchema.validate(trimmedPayload, {
        abortEarly: false,
      });

      const payload = {
        status: validated.status,
        preferredContactMethod: validated.status === 'ACCEPTED' ? validated.preferredContactMethod : undefined,
        availableVisitingTimes: validated.status === 'ACCEPTED' ? validated.availableVisitingTimes : '',
        responseMessage: validated.responseMessage || '',
      };

      await roomRequestService.respondToRequest(respondingTo, payload);
      toast.success('Response sent successfully');
      setRespondingTo(null);
      setResponseData(initialResponseData);
      setResponseErrors({});
      fetchRequests();
    } catch (error) {
      if (error.name === 'ValidationError') {
        const formErrors = {};
        error.inner.forEach((validationError) => {
          if (validationError.path && !formErrors[validationError.path]) {
            formErrors[validationError.path] = validationError.message;
          }
        });
        setResponseErrors(formErrors);
        toast.error('Please fix the highlighted fields');
        return;
      }

      toast.error(error.response?.data?.details || error.response?.data?.message || 'Failed to respond to request');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      REQUEST_MORE_INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.PENDING}`}>
        {status.replaceAll('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Filter */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-primary dark:text-gray-100">
            Booking Requests
          </h2>
          <p className="text-sm text-secondary dark:text-gray-400 mt-1">
            Manage student booking requests for your rooms
          </p>
        </div>
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'REQUEST_MORE_INFO'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.replaceAll('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="mx-auto h-12 w-12 text-secondary dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-primary dark:text-gray-100 mb-2">
              No requests found
            </h3>
            <p className="text-secondary dark:text-gray-400">
              {filter === 'PENDING'
                ? 'No pending requests at the moment'
                : `No ${filter.toLowerCase()} requests`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request._id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-primary dark:text-gray-100">
                        {request.room?.title}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-secondary dark:text-gray-400">
                      {request.room?.location?.area} • Rs. {request.room?.monthlyRent?.toLocaleString()}/month
                    </p>
                  </div>
                  <div className="text-right text-sm text-secondary dark:text-gray-400">
                    <p>{new Date(request.createdAt).toLocaleDateString()}</p>
                    <p>{new Date(request.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* Student Info */}
                <div className="bg-background dark:bg-background-dark rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-primary dark:text-gray-300 mb-1">
                        Student Name
                      </p>
                      <p className="text-sm text-secondary dark:text-gray-400">
                        {request.student?.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary dark:text-gray-300 mb-1">
                        Email
                      </p>
                      <p className="text-sm text-secondary dark:text-gray-400">
                        {request.student?.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary dark:text-gray-300 mb-1">
                        Phone
                      </p>
                      <p className="text-sm text-secondary dark:text-gray-400">
                        {request.studentContact?.phone}
                      </p>
                    </div>
                    {request.studentContact?.whatsapp && (
                      <div>
                        <p className="text-sm font-medium text-primary dark:text-gray-300 mb-1">
                          WhatsApp
                        </p>
                        <p className="text-sm text-secondary dark:text-gray-400">
                          {request.studentContact.whatsapp}
                        </p>
                      </div>
                    )}
                  </div>
                  {request.message && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-primary dark:text-gray-300 mb-1">
                        Message
                      </p>
                      <p className="text-sm text-secondary dark:text-gray-400">
                        {request.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Owner Response (if exists) */}
                {request.ownerResponse && request.ownerResponse.respondedAt && (
                  <div className="bg-accent/10 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-primary dark:text-gray-300 mb-2">
                      Your Response
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="text-secondary dark:text-gray-400">
                        <strong>Preferred Contact:</strong> {request.ownerResponse.preferredContactMethod}
                      </p>
                      {request.ownerResponse.availableVisitingTimes && (
                        <p className="text-secondary dark:text-gray-400">
                          <strong>Available Times:</strong> {request.ownerResponse.availableVisitingTimes}
                        </p>
                      )}
                      {request.ownerResponse.responseMessage && (
                        <p className="text-secondary dark:text-gray-400">
                          <strong>Message:</strong> {request.ownerResponse.responseMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {request.status === 'PENDING' && (
                  <div>
                    {respondingTo === request._id ? (
                      <form onSubmit={handleSubmitResponse} className="space-y-4">
                        {responseData.status !== 'ACCEPTED' && (
                          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-700 dark:text-blue-300">
                            Preferred Contact Method and Available Visiting Times are only needed when response is Accept.
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                              Response *
                            </label>
                            <select
                              value={responseData.status}
                              onChange={(e) => handleResponseFieldChange('status', e.target.value)}
                              className={getFieldClassName('status')}
                            >
                              <option value="ACCEPTED">Accept</option>
                              <option value="REJECTED">Reject</option>
                              <option value="REQUEST_MORE_INFO">Request More Info</option>
                            </select>
                            {responseErrors.status && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{responseErrors.status}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                              Preferred Contact Method {responseData.status === 'ACCEPTED' ? '*' : '(Disabled)'}
                            </label>
                            <select
                              value={responseData.preferredContactMethod}
                              onChange={(e) => handleResponseFieldChange('preferredContactMethod', e.target.value)}
                              disabled={responseData.status !== 'ACCEPTED'}
                              className={`${getFieldClassName('preferredContactMethod')} ${
                                responseData.status !== 'ACCEPTED' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                              }`}
                            >
                              <option value="whatsapp">WhatsApp</option>
                              <option value="phone">Phone</option>
                              <option value="email">Email</option>
                            </select>
                            {responseErrors.preferredContactMethod && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{responseErrors.preferredContactMethod}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                            Available Visiting Times {responseData.status === 'ACCEPTED' ? '*' : '(Disabled)'}
                          </label>
                          <input
                            type="text"
                            value={responseData.availableVisitingTimes}
                            onChange={(e) => handleResponseFieldChange('availableVisitingTimes', e.target.value)}
                            disabled={responseData.status !== 'ACCEPTED'}
                            className={`${getFieldClassName('availableVisitingTimes')} ${
                              responseData.status !== 'ACCEPTED' ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                            }`}
                            placeholder="e.g., Weekdays 2-5 PM, Weekends anytime"
                          />
                          {responseErrors.availableVisitingTimes && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{responseErrors.availableVisitingTimes}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                            Message to Student {responseData.status === 'ACCEPTED' ? '(Optional)' : '*'}
                          </label>
                          <textarea
                            value={responseData.responseMessage}
                            onChange={(e) => handleResponseFieldChange('responseMessage', e.target.value)}
                            rows="2"
                            className={getFieldClassName('responseMessage')}
                            placeholder={responseData.status === 'ACCEPTED' ? 'Any additional information...' : 'Required message for student'}
                          />
                          {responseErrors.responseMessage && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{responseErrors.responseMessage}</p>
                          )}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseErrors({});
                              setResponseData(initialResponseData);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">
                            Submit Response
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRespond(request)}
                          icon={<Check className="h-4 w-4" />}
                        >
                          Respond to Request
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestsManagementTab;
