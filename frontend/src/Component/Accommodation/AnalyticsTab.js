import React, { useState, useEffect } from 'react';
import { TrendingUp, Eye, Home, Users, BarChart3, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { roomService, roomRequestService } from '../../services/accommodationService';

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const toStartOfDay = (dateInput) => {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getCurrentWeekRequestTrend = (requests = []) => {
  const now = new Date();
  const weekStart = toStartOfDay(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const rows = WEEKDAY_LABELS.map((dayLabel, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      dayLabel,
      dateLabel: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
      count: 0,
      isToday: index === now.getDay(),
    };
  });

  requests.forEach((request) => {
    if (!request?.createdAt) return;
    const createdAt = toStartOfDay(request.createdAt);
    if (createdAt >= weekStart && createdAt <= weekEnd) {
      const dayIndex = createdAt.getDay();
      rows[dayIndex].count += 1;
    }
  });

  const weeklyTotal = rows.reduce((sum, row) => sum + row.count, 0);
  const todayCount = rows[now.getDay()]?.count || 0;
  const chartScale = Math.max(...rows.map((row) => row.count), 1);

  return {
    rows,
    weeklyTotal,
    todayCount,
    averagePerDay: Number((weeklyTotal / 7).toFixed(1)),
    chartScale,
  };
};

const AnalyticsTab = () => {
  const [analytics, setAnalytics] = useState({
    totalRooms: 0,
    availableRooms: 0,
    notAvailableRooms: 0,
    totalViews: 0,
    totalRequests: 0,
    mostViewedRoom: null,
    roomsWithViews: [],
    requestStatusCounts: {
      PENDING: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      REQUEST_MORE_INFO: 0,
    },
    weeklyTrend: {
      rows: WEEKDAY_LABELS.map((dayLabel) => ({
        dayLabel,
        dateLabel: '',
        count: 0,
        isToday: false,
      })),
      weeklyTotal: 0,
      todayCount: 0,
      averagePerDay: 0,
      chartScale: 1,
    },
  });
  const [loading, setLoading] = useState(true);

  const requestStatusItems = [
    { key: 'PENDING', label: 'Pending', hex: '#f59e0b', swatchClass: 'bg-amber-500' },
    { key: 'ACCEPTED', label: 'Accepted', hex: '#22c55e', swatchClass: 'bg-green-500' },
    { key: 'REJECTED', label: 'Rejected', hex: '#ef4444', swatchClass: 'bg-red-500' },
    { key: 'REQUEST_MORE_INFO', label: 'Need Info', hex: '#3b82f6', swatchClass: 'bg-blue-500' },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [roomsResponse, requestsResponse] = await Promise.all([
        roomService.getMyRooms(),
        roomRequestService.getOwnerRequests(),
      ]);

      const rooms = roomsResponse.data || [];
      const requests = requestsResponse.data || [];

      // Calculate analytics
      const availableRooms = rooms.filter(r => r.availability === 'AVAILABLE');
      const notAvailableRooms = rooms.filter(r => r.availability === 'NOT_AVAILABLE');
      const totalViews = rooms.reduce((sum, room) => sum + (room.viewsCount || 0), 0);
      const requestStatusCounts = {
        PENDING: 0,
        ACCEPTED: 0,
        REJECTED: 0,
        REQUEST_MORE_INFO: 0,
      };

      requests.forEach((request) => {
        if (requestStatusCounts[request.status] !== undefined) {
          requestStatusCounts[request.status] += 1;
        }
      });

      const weeklyTrend = getCurrentWeekRequestTrend(requests);

      // Find most viewed room
      const roomsWithViews = rooms
        .filter(r => r.viewsCount > 0)
        .map(r => ({
          id: r._id,
          title: r.title,
          views: r.viewsCount || 0,
          requests: requests.filter(req => req.room?._id === r._id).length,
        }))
        .sort((a, b) => b.views - a.views);

      const mostViewedRoom = roomsWithViews.length > 0 ? roomsWithViews[0] : null;

      setAnalytics({
        totalRooms: rooms.length,
        availableRooms: availableRooms.length,
        notAvailableRooms: notAvailableRooms.length,
        totalViews,
        totalRequests: requests.length,
        mostViewedRoom,
        roomsWithViews: roomsWithViews.slice(0, 5), // Top 5
        requestStatusCounts,
        weeklyTrend,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalyticsReportPdf = () => {
    try {
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginX = 42;
      const maxContentWidth = pageWidth - marginX * 2;
      const today = new Date();
      let y = 44;

      const ensureSpace = (heightNeeded = 24) => {
        if (y + heightNeeded > pageHeight - 40) {
          pdf.addPage();
          y = 44;
        }
      };

      const addSectionTitle = (title) => {
        ensureSpace(24);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.text(title, marginX, y);
        y += 18;
      };

      const addBodyLine = (line) => {
        ensureSpace(18);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        const lines = pdf.splitTextToSize(line, maxContentWidth);
        pdf.text(lines, marginX, y);
        y += lines.length * 14;
      };

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(19);
      pdf.text('House Owner Analytics Summary Report', marginX, y);
      y += 24;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(95, 95, 95);
      pdf.text(`Generated on ${today.toLocaleDateString()} at ${today.toLocaleTimeString()}`, marginX, y);
      y += 20;
      pdf.setTextColor(20, 20, 20);

      addSectionTitle('Overview');
      addBodyLine(`Total Rooms Posted: ${analytics.totalRooms}`);
      addBodyLine(`Total Views: ${analytics.totalViews}`);
      addBodyLine(`Total Requests Received: ${analytics.totalRequests}`);
      addBodyLine(`Average Views per Room: ${analytics.totalRooms > 0 ? Math.round(analytics.totalViews / analytics.totalRooms) : 0}`);
      y += 6;

      addSectionTitle('Availability Summary');
      addBodyLine(`Available Rooms: ${analytics.availableRooms}`);
      addBodyLine(`Not Available Rooms: ${analytics.notAvailableRooms}`);
      y += 6;

      addSectionTitle('Request Status Breakdown');
      addBodyLine(`Pending: ${analytics.requestStatusCounts.PENDING}`);
      addBodyLine(`Accepted: ${analytics.requestStatusCounts.ACCEPTED}`);
      addBodyLine(`Rejected: ${analytics.requestStatusCounts.REJECTED}`);
      addBodyLine(`Request More Info: ${analytics.requestStatusCounts.REQUEST_MORE_INFO}`);
      y += 6;

      if (analytics.mostViewedRoom) {
        addSectionTitle('Most Viewed Room');
        addBodyLine(`Title: ${analytics.mostViewedRoom.title}`);
        addBodyLine(`Views: ${analytics.mostViewedRoom.views}`);
        addBodyLine(`Requests: ${analytics.mostViewedRoom.requests}`);
        const conversionRate = analytics.mostViewedRoom.views > 0
          ? Math.round((analytics.mostViewedRoom.requests / analytics.mostViewedRoom.views) * 100)
          : 0;
        addBodyLine(`Conversion Rate: ${conversionRate}%`);
        y += 6;
      }

      addSectionTitle('Top Performing Rooms');
      if (analytics.roomsWithViews.length === 0) {
        addBodyLine('No room view data available yet.');
      } else {
        analytics.roomsWithViews.forEach((room, index) => {
          addBodyLine(`${index + 1}. ${room.title} | Views: ${room.views} | Requests: ${room.requests}`);
        });
      }
      y += 6;

      addSectionTitle('This Week Request Trend');
      analytics.weeklyTrend.rows.forEach((row) => {
        addBodyLine(`${row.dayLabel} (${row.dateLabel}): ${row.count} request(s)`);
      });
      addBodyLine(`Weekly Total: ${analytics.weeklyTrend.weeklyTotal}`);
      addBodyLine(`Average Per Day: ${analytics.weeklyTrend.averagePerDay}`);
      addBodyLine(`Today: ${analytics.weeklyTrend.todayCount}`);

      pdf.save(`house-owner-analytics-report-${today.toISOString().slice(0, 10)}.pdf`);
      toast.success('Analytics PDF report generated');
    } catch (error) {
      console.error('Error generating analytics PDF:', error);
      toast.error('Failed to generate analytics PDF report');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary dark:text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  const totalStatusRequests = requestStatusItems.reduce(
    (sum, item) => sum + (analytics.requestStatusCounts[item.key] || 0),
    0
  );

  let progressAngle = 0;
  const pieGradientSegments = requestStatusItems
    .map((item) => {
      const value = analytics.requestStatusCounts[item.key] || 0;
      if (value <= 0 || totalStatusRequests <= 0) return null;
      const start = progressAngle;
      const end = progressAngle + (value / totalStatusRequests) * 360;
      progressAngle = end;
      return `${item.hex} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
    })
    .filter(Boolean);

  const pieChartStyle = {
    background:
      pieGradientSegments.length > 0
        ? `conic-gradient(${pieGradientSegments.join(', ')})`
        : '#e5e7eb',
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary dark:text-gray-400">Total Rooms Posted</p>
                <p className="text-3xl font-bold text-primary dark:text-gray-100 mt-2">
                  {analytics.totalRooms}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Home className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary dark:text-gray-400">Total Views</p>
                <p className="text-3xl font-bold text-primary dark:text-gray-100 mt-2">
                  {analytics.totalViews}
                </p>
                <p className="text-xs text-secondary dark:text-gray-500 mt-1">
                  Across all rooms
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Eye className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary dark:text-gray-400">Requests Received</p>
                <p className="text-3xl font-bold text-primary dark:text-gray-100 mt-2">
                  {analytics.totalRequests}
                </p>
                <p className="text-xs text-secondary dark:text-gray-500 mt-1">
                  All time
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary dark:text-gray-400">Avg Views/Room</p>
                <p className="text-3xl font-bold text-primary dark:text-gray-100 mt-2">
                  {analytics.totalRooms > 0
                    ? Math.round(analytics.totalViews / analytics.totalRooms)
                    : 0}
                </p>
                <p className="text-xs text-secondary dark:text-gray-500 mt-1">
                  Average engagement
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Other Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border border-purple-200 dark:border-purple-700 bg-white dark:bg-surface-dark shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              <CardTitle>This Week</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-purple-50/80 dark:bg-purple-900/20 border border-purple-200/80 dark:border-purple-800/40 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-purple-700 dark:text-purple-300 font-semibold">Avg/day</p>
                <p className="mt-2 text-lg font-bold text-primary dark:text-gray-100">{analytics.weeklyTrend.averagePerDay}</p>
                <p className="text-xs text-secondary dark:text-gray-400 mt-1">requests</p>
              </div>
              <div className="rounded-2xl bg-purple-100/70 dark:bg-purple-900/25 border border-purple-300/80 dark:border-purple-700/40 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-purple-800 dark:text-purple-200 font-semibold">Today</p>
                <p className="mt-2 text-lg font-bold text-primary dark:text-gray-100">{analytics.weeklyTrend.todayCount}</p>
                <p className="text-xs text-secondary dark:text-gray-400 mt-1">requests</p>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-200 dark:border-purple-700 p-4 bg-white dark:bg-background-dark/40">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary dark:text-gray-400 mb-3">
                <span>Weekly Trend</span>
                <span>{analytics.weeklyTrend.weeklyTotal} requests</span>
              </div>
              <div className="flex items-end gap-2 h-36">
                {analytics.weeklyTrend.rows.map((row) => {
                  const height = Math.max(8, (row.count / analytics.weeklyTrend.chartScale) * 100);
                  return (
                    <div key={`${row.dayLabel}_${row.dateLabel}`} className="flex-1 h-full flex flex-col items-center gap-2">
                      <div className="w-full flex-1 flex items-end">
                        <div className="w-full rounded-sm bg-purple-500 dark:bg-purple-400" style={{ height: `${height}%` }} />
                      </div>
                      <div className={`text-center ${row.isToday ? 'text-purple-700 dark:text-purple-300' : 'text-secondary dark:text-gray-500'}`}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em]">{row.dayLabel}</p>
                        <p className="text-[10px] mt-0.5">{row.count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              fullWidth
              variant="outline"
              size="sm"
              icon={<Calendar className="h-4 w-4" />}
              onClick={generateAnalyticsReportPdf}
              className="!bg-white !border-purple-500 !text-purple-700 dark:!text-purple-300 dark:!border-purple-400 dark:!bg-background-dark/40 hover:!bg-white hover:!text-purple-700 dark:hover:!bg-background-dark/40 dark:hover:!text-purple-300"
            >
              Generate Analysis Report
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark shadow-sm">
          <CardHeader>
            <CardTitle>Request Status Pie Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative h-44 w-44 rounded-full border-8 border-white dark:border-gray-800 shadow-inner" style={pieChartStyle}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Total</p>
                    <p className="text-lg font-bold text-primary dark:text-gray-100">{totalStatusRequests}</p>
                  </div>
                </div>
              </div>

              <div className="w-full mt-5 space-y-2">
                {requestStatusItems.map((item) => {
                  const count = analytics.requestStatusCounts[item.key] || 0;
                  const percentage = totalStatusRequests > 0 ? Math.round((count / totalStatusRequests) * 100) : 0;
                  return (
                    <div key={item.key} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.swatchClass}`}></span>
                        <span className="text-sm text-primary dark:text-gray-100">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary dark:text-gray-100">{count}</p>
                        <p className="text-[10px] text-secondary dark:text-gray-400">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Availability Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-primary dark:text-gray-100">Available Rooms</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary dark:text-gray-100">
                  {analytics.availableRooms}
                </p>
                <p className="text-sm text-secondary dark:text-gray-400">
                  {analytics.totalRooms > 0
                    ? Math.round((analytics.availableRooms / analytics.totalRooms) * 100)
                    : 0}% of total
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium text-primary dark:text-gray-100">Not Available</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary dark:text-gray-100">
                  {analytics.notAvailableRooms}
                </p>
                <p className="text-sm text-secondary dark:text-gray-400">
                  {analytics.totalRooms > 0
                    ? Math.round((analytics.notAvailableRooms / analytics.totalRooms) * 100)
                    : 0}% of total
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Viewed Room */}
      {analytics.mostViewedRoom && (
        <Card>
          <CardHeader>
            <CardTitle>🏆 Most Viewed Room</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/5 dark:to-accent/5 rounded-lg">
              <h3 className="text-xl font-bold text-primary dark:text-gray-100 mb-2">
                {analytics.mostViewedRoom.title}
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Views</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {analytics.mostViewedRoom.views}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Requests</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {analytics.mostViewedRoom.requests}
                  </p>
                </div>
              </div>
              {analytics.mostViewedRoom.requests > 0 && (
                <p className="text-sm text-secondary dark:text-gray-400 mt-3">
                  Conversion rate:{' '}
                  <span className="font-semibold text-primary dark:text-accent">
                    {Math.round(
                      (analytics.mostViewedRoom.requests / analytics.mostViewedRoom.views) * 100
                    )}%
                  </span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Rooms */}
      {analytics.roomsWithViews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Performing Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.roomsWithViews.map((room, index) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-4 bg-background dark:bg-surface-dark rounded-lg border border-secondary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 dark:bg-accent/10 rounded-full">
                      <span className="font-bold text-primary dark:text-accent">#{index + 1}</span>
                    </div>
                    <span className="font-medium text-primary dark:text-gray-100">{room.title}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-secondary dark:text-gray-400">Views</p>
                      <p className="font-bold text-primary dark:text-gray-100">{room.views}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-secondary dark:text-gray-400">Requests</p>
                      <p className="font-bold text-primary dark:text-gray-100">{room.requests}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {analytics.totalRooms === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 text-secondary dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-2">
              No Analytics Data Yet
            </h3>
            <p className="text-secondary dark:text-gray-400">
              Start posting rooms to see your analytics and performance metrics here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsTab;
