import React, { useState, useEffect } from 'react';
import { Search, Filter, MapIcon, List, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import RoomCard from '../Component/Accommodation/RoomCard';
import RoomDetailModal from '../Component/Accommodation/RoomDetailModal';
import { roomService } from '../services/accommodationService';
import toast from 'react-hot-toast';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AccommodationPage = () => {
  const [rooms, setRooms] = useState([]);
  // Flexible dates state
  const [flexibleDuration, setFlexibleDuration] = useState(''); // '1-6', '6-12', '12+'
  const [flexibleSelectedMonths, setFlexibleSelectedMonths] = useState([]); // Array of selected months
  const [flexibleMonthsDisplay, setFlexibleMonthsDisplay] = useState([
    'February', 'March', 'April', 'May', 'June', 'July'
  ]);

  // Handlers for flexible months navigation
  const handlePrevFlexibleMonth = () => {
    setFlexibleMonthsDisplay(months => {
      const prev = new Date(`${months[0]} 1, 2026`);
      prev.setMonth(prev.getMonth() - 1);
      return Array.from({length: 6}, (_, i) => {
        const d = new Date(prev.getFullYear(), prev.getMonth() + i, 1);
        return d.toLocaleString('en-US', { month: 'long' });
      });
    });
  };
  const handleNextFlexibleMonth = () => {
    setFlexibleMonthsDisplay(months => {
      const next = new Date(`${months[months.length-1]} 1, 2026`);
      next.setMonth(next.getMonth() + 1);
      return Array.from({length: 6}, (_, i) => {
        const d = new Date(next.getFullYear(), next.getMonth() - 5 + i, 1);
        return d.toLocaleString('en-US', { month: 'long' });
      });
    });
  };
  const handleFlexibleMonthToggle = (month) => {
    setFlexibleSelectedMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showMatchFilter, setShowMatchFilter] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false); // Separate state for modal visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDates, setSelectedDates] = useState({ moveIn: '', moveOut: '' });
  const [isFlexible, setIsFlexible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Filter state
  const [filters, setFilters] = useState({
    area: '',
    minRent: '',
    maxRent: '',
    roomType: '',
    gender: '',
    availability: 'AVAILABLE',
    wifi: false,
    parking: false,
    attachedBathroom: false,
    campusId: '',
    moveInDate: '',
    sortBy: 'createdAt',
    order: 'desc',
  });

  // Match filter state
  const [matchFilters, setMatchFilters] = useState({
    maxBudget: '',
    requiredFacilities: {
      wifi: false,
      parking: false,
      attachedBathroom: false,
      furnished: false,
      kitchen: false,
    },
  });

  useEffect(() => {
    fetchCampuses();
    fetchRooms();
  }, []);

  // Auto-search with debounce when area filter changes
  useEffect(() => {
    const timerId = setTimeout(() => {
      if (filters.area !== undefined) {
        fetchRooms();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timerId);
  }, [filters.area]);

  const fetchCampuses = async () => {
    try {
      const response = await roomService.getCampuses();
      setCampuses(response.data || []);
      // Don't auto-select a campus - let user choose
    } catch (error) {
      console.error('Error fetching campuses:', error);
    }
  };

  const fetchRooms = async (customFilters = null) => {
    try {
      setLoading(true);
      const filtersToUse = customFilters || filters;
      const response = await roomService.getAllRooms(filtersToUse);
      setRooms(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch rooms');
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      
      // If campus is changed, automatically sort by distance
      if (field === 'campusId' && value) {
        newFilters.sortBy = 'campusDistance';
        newFilters.order = 'asc';
        // Auto-fetch with new filters
        fetchRooms(newFilters);
      }
      
      return newFilters;
    });
  };

  const handleApplyFilters = () => {
    fetchRooms();
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({
      area: '',
      minRent: '',
      maxRent: '',
      roomType: '',
      gender: '',
      availability: 'AVAILABLE',
      wifi: false,
      parking: false,
      attachedBathroom: false,
      campusId: '',
      moveInDate: '',
      sortBy: 'createdAt',
      order: 'desc',
    });
  };

  const handleSortByDistance = () => {
    setFilters(prev => ({ ...prev, sortBy: 'campusDistance', order: 'asc' }));
    setTimeout(fetchRooms, 100);
  };

  const handleDateSelection = () => {
    if (selectedDates.moveIn) {
      setFilters(prev => ({ ...prev, moveInDate: selectedDates.moveIn }));
      setTimeout(() => fetchRooms(), 100);
      setShowDatePicker(false);
      toast.success(`Showing rooms available from ${new Date(selectedDates.moveIn).toLocaleDateString()}`);
    }
  };

  const handleClearDates = () => {
    setSelectedDates({ moveIn: '', moveOut: '' });
    setFilters(prev => ({ ...prev, moveInDate: '' }));
    setTimeout(() => fetchRooms(), 100);
    setShowDatePicker(false);
  };

  const handleViewDetails = (roomId) => {
    const room = rooms.find(r => r._id === roomId);
    setSelectedRoom(room);
  };

  const calculateMatchScore = (room) => {
    if (!showMatchFilter) return null;

    let score = 0;
    let totalCriteria = 0;

    // Budget match (40%)
    if (matchFilters.maxBudget) {
      totalCriteria += 40;
      if (room.monthlyRent <= Number(matchFilters.maxBudget)) {
        score += 40;
      } else {
        const diff = Math.abs(room.monthlyRent - Number(matchFilters.maxBudget));
        if (diff / Number(matchFilters.maxBudget) <= 0.2) {
          score += 20;
        }
      }
    }

    // Facilities match (60%)
    const requiredFacilities = Object.keys(matchFilters.requiredFacilities).filter(
      key => matchFilters.requiredFacilities[key]
    );

    if (requiredFacilities.length > 0) {
      totalCriteria += 60;
      const matchedFacilities = requiredFacilities.filter(
        fac => room.facilities[fac]
      );
      score += (matchedFacilities.length / requiredFacilities.length) * 60;
    }

    return totalCriteria > 0 ? Math.round(score) : null;
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isInRange = (date, start, end) => {
    if (!start || !end || !date) return false;
    return date >= start && date <= end;
  };

  const handleDateClick = (date) => {
    if (!date) return;
    
    const dateStr = date.toISOString().split('T')[0];
    
    if (!selectedDates.moveIn || (selectedDates.moveIn && selectedDates.moveOut)) {
      // Start new selection
      setSelectedDates({ moveIn: dateStr, moveOut: '' });
    } else {
      // Set end date
      const moveInDate = new Date(selectedDates.moveIn);
      if (date < moveInDate) {
        // If clicked date is before start, make it the new start
        setSelectedDates({ moveIn: dateStr, moveOut: selectedDates.moveIn });
      } else {
        setSelectedDates(prev => ({ ...prev, moveOut: dateStr }));
      }
    }
  };

  const getFilteredRoomsWithMatch = () => {
    if (!showMatchFilter) return rooms;

    return rooms
      .map(room => ({
        ...room,
        matchScore: calculateMatchScore(room),
      }))
      .filter(room => room.matchScore !== null && room.matchScore >= 40) // Only show rooms with 40%+ match
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  };

  const filteredRooms = getFilteredRoomsWithMatch();

  const getMapCenter = () => {
    if (rooms.length === 0) return [6.9271, 79.8612];

    const lats = rooms
      .filter(r => r.location?.coordinates?.coordinates)
      .map(r => r.location.coordinates.coordinates[1]);
    const lngs = rooms
      .filter(r => r.location?.coordinates?.coordinates)
      .map(r => r.location.coordinates.coordinates[0]);

    if (lats.length === 0) return [6.9271, 79.8612];

    return [
      lats.reduce((a, b) => a + b, 0) / lats.length,
      lngs.reduce((a, b) => a + b, 0) / lngs.length,
    ];
  };

  const dummyAccommodations = [
    // Keep old data for reference, but use rooms state for rendering
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white dark:bg-background-dark py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100 mb-2">
            Find Your Perfect Room
          </h1>
          <p className="text-secondary dark:text-gray-400">
            Browse available accommodations near your campus
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 dark:bg-gray-800/40 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Input with Integrated Button */}
            <div className="flex-1 w-full lg:max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by area..."
                  value={filters.area}
                  onChange={(e) => handleFilterChange('area', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchRooms()}
                  className="w-full pl-5 pr-14 py-3 border-2 border-amber-200 dark:border-gray-600 rounded-full bg-amber-50 dark:bg-surface-dark dark:text-gray-100 focus:outline-none focus:border-primary text-base"
                />
                {filters.area && (
                  <button
                    onClick={() => handleFilterChange('area', '')}
                    className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={fetchRooms}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-2 transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  showFilters
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900'
                    : 'bg-amber-50 text-gray-700 border-amber-200 hover:border-amber-300 dark:bg-surface-dark dark:text-gray-300 dark:border-gray-600'
                }`}
              >
                <Filter className="h-4 w-4 inline mr-1" />
                Filters
              </button>
              <button
                onClick={() => {
                  if (showMatchFilter) {
                    setShowMatchFilter(false);
                    fetchRooms();
                  } else {
                    setShowMatchModal(true);
                  }
                }}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  showMatchFilter
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900'
                    : 'bg-amber-50 text-gray-700 border-amber-200 hover:border-amber-300 dark:bg-surface-dark dark:text-gray-300 dark:border-gray-600'
                }`}
              >
                Match My Needs
              </button>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  selectedDates.moveIn
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900'
                    : 'bg-amber-50 text-gray-700 border-amber-200 hover:border-amber-300 dark:bg-surface-dark dark:text-gray-300 dark:border-gray-600'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-1" />
                {selectedDates.moveIn ? new Date(selectedDates.moveIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Dates'}
              </button>
              <button
                onClick={() => setShowMap(!showMap)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  showMap
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900'
                    : 'bg-amber-50 text-gray-700 border-amber-200 hover:border-amber-300 dark:bg-surface-dark dark:text-gray-300 dark:border-gray-600'
                }`}
              >
                {showMap ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
              </button>
              {(filters.area || filters.minRent || filters.maxRent || selectedDates.moveIn) && (
                <button
                  onClick={() => {
                    handleResetFilters();
                    setSelectedDates({ moveIn: '', moveOut: '' });
                    setTimeout(() => fetchRooms(), 100);
                  }}
                  className="px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Date Picker Modal */}
        {showDatePicker && (
            <div 
              className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 overflow-y-auto"
              onClick={() => setShowDatePicker(false)}
            >
              <div 
                className="bg-amber-50 dark:bg-surface-dark rounded-lg shadow-2xl max-w-4xl w-full mx-4 mb-20 border border-amber-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with tabs and close */}
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsFlexible(false)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                        !isFlexible
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'bg-amber-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Choose dates
                    </button>
                    <button
                      onClick={() => setIsFlexible(true)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                        isFlexible
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'bg-amber-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      I'm flexible
                    </button>
                  </div>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Date selection boxes - only show in Choose dates tab */}
                {!isFlexible && (
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3 max-w-md mx-auto">
                      <div className="flex-1 border-2 border-gray-900 dark:border-white rounded p-2 text-center">
                        <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                          MOVE IN
                        </div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white">
                          {selectedDates.moveIn
                            ? new Date(selectedDates.moveIn).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric',
                              })
                            : 'Select date'}
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm">→</div>
                      <div className="flex-1 border-2 border-gray-300 dark:border-gray-600 rounded p-2 text-center">
                        <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                          MOVE OUT
                        </div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white">
                          {selectedDates.moveOut
                            ? new Date(selectedDates.moveOut).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric',
                              })
                            : 'Select date'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Calendar Grid */}
                {!isFlexible && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* First Month */}
                      {[0, 1].map((monthOffset) => {
                        const displayMonth = new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + monthOffset,
                          1
                        );
                        const days = getDaysInMonth(displayMonth);

                        return (
                          <div key={monthOffset}>
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between mb-2">
                              {monthOffset === 0 ? (
                                <button
                                  onClick={() =>
                                    setCurrentMonth(
                                      new Date(
                                        currentMonth.getFullYear(),
                                        currentMonth.getMonth() - 1,
                                        1
                                      )
                                    )
                                  }
                                  className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>
                              ) : (
                                <div className="w-5" />
                              )}
                              <h3 className="text-sm font-semibold flex-1 text-center">
                                {displayMonth.toLocaleDateString('en-US', {
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </h3>
                              {monthOffset === 1 ? (
                                <button
                                  onClick={() =>
                                    setCurrentMonth(
                                      new Date(
                                        currentMonth.getFullYear(),
                                        currentMonth.getMonth() + 1,
                                        1
                                      )
                                    )
                                  }
                                  className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              ) : (
                                <div className="w-5" />
                              )}
                            </div>

                            {/* Day headers */}
                            <div className="grid grid-cols-7 gap-0.5 mb-1">
                              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                                <div
                                  key={day}
                                  className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center py-1"
                                >
                                  {day}
                                </div>
                              ))}
                            </div>

                            {/* Calendar days */}
                            <div className="grid grid-cols-7 gap-0.5">
                              {days.map((date, index) => {
                                if (!date) {
                                  return <div key={`empty-${index}`} />;
                                }

                                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                                const moveInDate = selectedDates.moveIn
                                  ? new Date(selectedDates.moveIn)
                                  : null;
                                const moveOutDate = selectedDates.moveOut
                                  ? new Date(selectedDates.moveOut)
                                  : null;
                                const isSelected =
                                  isSameDay(date, moveInDate) || isSameDay(date, moveOutDate);
                                const inRange = isInRange(date, moveInDate, moveOutDate);

                                return (
                                  <button
                                    key={index}
                                    onClick={() => !isPast && handleDateClick(date)}
                                    disabled={isPast}
                                    className={`
                                      aspect-square p-1 text-xs rounded transition
                                      ${
                                        isPast
                                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                          : 'hover:bg-amber-100 dark:hover:bg-gray-700'
                                      }
                                      ${
                                        isSelected
                                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold'
                                          : ''
                                      }
                                      ${
                                        inRange && !isSelected
                                          ? 'bg-amber-100 dark:bg-gray-700'
                                          : ''
                                      }
                                    `}
                                  >
                                    {date.getDate()}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Flexible dates */}
                {isFlexible && (
                  <FlexibleDatesSection
                    selectedDuration={flexibleDuration}
                    setSelectedDuration={setFlexibleDuration}
                    selectedMonths={flexibleSelectedMonths}
                    onMonthToggle={handleFlexibleMonthToggle}
                    months={flexibleMonthsDisplay}
                    onPrevMonth={handlePrevFlexibleMonth}
                    onNextMonth={handleNextFlexibleMonth}
                  />
                )}

                {/* Footer buttons */}
                <div className="flex items-center justify-between p-3 border-t">
                  <Button variant="secondary" onClick={handleClearDates} className="text-xs py-1.5">
                    Clear dates
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (isFlexible && flexibleDuration && flexibleSelectedMonths.length > 0) {
                        setFilters(prev => ({
                          ...prev,
                          flexible: true,
                          flexibleDuration,
                          flexibleMonths: flexibleSelectedMonths,
                          moveInDate: '', // clear fixed date
                        }));
                        setShowDatePicker(false);
                        setTimeout(() => fetchRooms(), 100);
                        const monthsText = flexibleSelectedMonths.length === 1 
                          ? flexibleSelectedMonths[0] 
                          : `${flexibleSelectedMonths.length} months`;
                        toast.success(`Showing rooms for ${flexibleDuration} months from ${monthsText}`);
                      } else if (!isFlexible) {
                        handleDateSelection();
                      }
                    }}
                    disabled={(!selectedDates.moveIn && !isFlexible) || (isFlexible && (!flexibleDuration || flexibleSelectedMonths.length === 0))}
                    className="text-xs py-1.5"
                  >
                    Select dates
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Filters Modal Overlay */}
          {showFilters && (
            <div 
              className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 overflow-y-auto"
              onClick={() => setShowFilters(false)}
            >
              <div 
                className="bg-amber-50 dark:bg-surface-dark rounded-lg shadow-2xl max-w-2xl w-full mx-4 mb-20 p-8 border border-amber-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Filters</h2>
                  <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700 p-1"><X className="h-5 w-5" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Rent</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minRent}
                    onChange={(e) => handleFilterChange('minRent', e.target.value)}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 dark:bg-surface-dark dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Rent</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxRent}
                    onChange={(e) => handleFilterChange('maxRent', e.target.value)}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 dark:bg-surface-dark dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Room Type</label>
                  <select
                    value={filters.roomType}
                    onChange={(e) => handleFilterChange('roomType', e.target.value)}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 dark:bg-surface-dark dark:border-gray-600"
                  >
                    <option value="">All Types</option>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="studio">Studio</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 dark:bg-surface-dark dark:border-gray-600"
                  >
                    <option value="">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Campus</label>
                  <select
                    value={filters.campusId}
                    onChange={(e) => handleFilterChange('campusId', e.target.value)}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 dark:bg-surface-dark dark:border-gray-600"
                  >
                    <option value="">All Campuses</option>
                    {campuses.map(campus => (
                      <option key={campus.id} value={campus.id}>{campus.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Move-in Date</label>
                  <input
                    type="date"
                    value={filters.moveInDate}
                    onChange={(e) => handleFilterChange('moveInDate', e.target.value)}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 dark:bg-surface-dark dark:border-gray-600"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-2">Facilities</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.wifi}
                        onChange={(e) => handleFilterChange('wifi', e.target.checked)}
                      />
                      <span>WiFi</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.parking}
                        onChange={(e) => handleFilterChange('parking', e.target.checked)}
                      />
                      <span>Parking</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.attachedBathroom}
                        onChange={(e) => handleFilterChange('attachedBathroom', e.target.checked)}
                      />
                      <span>Attached Bathroom</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleApplyFilters}>Apply Filters</Button>
                <Button variant="secondary" onClick={handleResetFilters}>Reset</Button>
                <Button variant="secondary" onClick={handleSortByDistance}>
                  Sort by Distance
                </Button>
              </div>
            </div>
          </div>
        )}

          {/* Match My Needs Modal Overlay */}
          {showMatchModal && (
            <div 
              className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 overflow-y-auto"
              onClick={() => setShowMatchModal(false)}
            >
              <div 
                className="bg-amber-50 dark:bg-surface-dark rounded-lg shadow-2xl max-w-xl w-full mx-4 mb-20 p-8 border border-amber-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Match My Needs</h2>
                  <button onClick={() => setShowMatchModal(false)} className="text-gray-500 hover:text-gray-700 p-1"><X className="h-5 w-5" /></button>
                </div>
                <h3 className="font-semibold mb-3">What are you looking for?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Maximum Budget</label>
                  <input
                    type="number"
                    placeholder="e.g., 15000"
                    value={matchFilters.maxBudget}
                    onChange={(e) => setMatchFilters(prev => ({ ...prev, maxBudget: e.target.value }))}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 dark:bg-surface-dark dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Must-Have Facilities</label>
                  <div className="flex flex-wrap gap-3">
                    {['wifi', 'parking', 'attachedBathroom', 'furnished', 'kitchen'].map(facility => (
                      <label key={facility} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={matchFilters.requiredFacilities[facility]}
                          onChange={(e) => setMatchFilters(prev => ({
                            ...prev,
                            requiredFacilities: {
                              ...prev.requiredFacilities,
                              [facility]: e.target.checked,
                            },
                          }))}
                        />
                        <span className="capitalize">{facility.replace(/([A-Z])/g, ' $1')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => {
                  setShowMatchFilter(true); // Activate match filtering
                  setShowMatchModal(false); // Close modal
                  fetchRooms(); // Refresh with filters
                }} 
                className="mt-3"
              >
                Show Best Matches
              </Button>
              </div>
            </div>
        )}

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-secondary dark:text-gray-400">
            {filteredRooms.length} rooms found
          </p>
        </div>

        {/* Map + List View */}
        {showMap ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="max-h-[800px] overflow-y-auto pr-2">
              {loading ? (
                <p>Loading...</p>
              ) : filteredRooms.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-secondary">No rooms found matching your criteria</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredRooms.map(room => (
                    <RoomCard
                      key={room._id}
                      room={room}
                      onViewDetails={handleViewDetails}
                      showMatchScore={showMatchFilter}
                      matchScore={room.matchScore}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-4 h-[800px]">
              <MapContainer
                center={getMapCenter()}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                className="rounded-lg"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredRooms
                  .filter(room => room.location?.coordinates?.coordinates)
                  .map(room => {
                    const [lng, lat] = room.location.coordinates.coordinates;
                    
                    // Create custom price marker
                    const priceIcon = L.divIcon({
                      className: 'custom-price-marker',
                      html: `
                        <div style="
                          background: white;
                          padding: 4px 8px;
                          border-radius: 8px;
                          font-weight: 600;
                          font-size: 13px;
                          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                          white-space: nowrap;
                          border: 2px solid #3B4261;
                          color: #3B4261;
                        ">
                          Rs. ${(room.monthlyRent / 1000).toFixed(0)}k
                        </div>
                      `,
                      iconSize: [60, 30],
                      iconAnchor: [30, 30],
                    });
                    
                    return (
                      <Marker key={room._id} position={[lat, lng]} icon={priceIcon}>
                        <Popup>
                          <div className="text-sm min-w-[200px]">
                            <p className="font-semibold text-base mb-1">{room.title}</p>
                            <p className="text-green-600 font-bold text-lg mb-1">
                              Rs. {room.monthlyRent.toLocaleString()}/mo
                            </p>
                            <p className="text-gray-600 mb-2">{room.location.area}</p>
                            <button
                              onClick={() => handleViewDetails(room._id)}
                              className="w-full bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
              </MapContainer>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p>Loading...</p>
            ) : filteredRooms.length === 0 ? (
              <Card className="p-8 text-center md:col-span-2 lg:col-span-3">
                <p className="text-secondary">No rooms found matching your criteria</p>
              </Card>
            ) : (
              filteredRooms.map(room => (
                <RoomCard
                  key={room._id}
                  room={room}
                  onViewDetails={handleViewDetails}
                  showMatchScore={showMatchFilter}
                  matchScore={room.matchScore}
                />
              ))
            )}
          </div>
        )}

        {/* Room Detail Modal */}
        {selectedRoom && (
          <RoomDetailModal
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            onRequestSent={() => {
              setSelectedRoom(null);
              toast.success('Viewing request sent successfully');
            }}
          />
        )}
      </div>
    </div>
  );
};

// FlexibleDatesSection component
const FlexibleDatesSection = ({ selectedDuration, setSelectedDuration, selectedMonths, onMonthToggle, months, onPrevMonth, onNextMonth }) => (
  <div className="p-6">
    {/* Stay duration */}
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center">
        How long are you staying?
      </h3>
      <div className="flex gap-3 justify-center">
        {['1-6 months', '6-12 months', '12+ months'].map((label, idx) => {
          const val = idx === 0 ? '1-6' : idx === 1 ? '6-12' : '12+';
          return (
            <button
              key={val}
              className={`px-4 py-2 border-2 rounded-full text-xs font-medium transition ${selectedDuration === val ? 'border-gray-900 dark:border-white bg-amber-100 dark:bg-gray-800' : 'border-amber-200 dark:border-gray-600 bg-amber-50 hover:bg-amber-100 dark:hover:bg-gray-800'}`}
              onClick={() => setSelectedDuration(val)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
    {/* Move-in month selection - MULTIPLE SELECTION */}
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center">
        When are you moving in? {selectedMonths.length > 0 && <span className="text-xs text-gray-500">({selectedMonths.length} selected)</span>}
      </h3>
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        <button className="p-1 hover:bg-amber-100 dark:hover:bg-gray-700 rounded" onClick={onPrevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 grid grid-cols-6 gap-2">
          {months.map((month) => {
            const isSelected = selectedMonths.includes(month);
            return (
              <button
                key={month}
                className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition ${
                  isSelected 
                    ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                    : 'border-amber-200 dark:border-gray-700 bg-amber-50 hover:border-amber-300 dark:hover:border-white'
                }`}
                onClick={() => onMonthToggle(month)}
              >
                <Calendar className={`h-5 w-5 mb-1 ${isSelected ? 'text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400'}`} />
                <span className="text-xs font-medium">{month}</span>
                <span className={`text-[10px] ${isSelected ? 'text-gray-300 dark:text-gray-700' : 'text-gray-500'}`}>2026</span>
              </button>
            );
          })}
        </div>
        <button className="p-1 hover:bg-amber-100 dark:hover:bg-gray-700 rounded" onClick={onNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
);

export default AccommodationPage;
