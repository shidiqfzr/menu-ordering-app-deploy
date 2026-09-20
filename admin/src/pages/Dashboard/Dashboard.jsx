import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { 
  MdOutlineTrendingUp, 
  MdOutlineTrendingDown,
  MdAttachMoney, 
  MdReceiptLong, 
  MdRestaurantMenu, 
  MdArrowForward,
  MdOutlineAccessTime,
  MdPayments,
  MdOutlineCalendarToday,
  MdShowChart,
  MdBarChart,
  MdQrCodeScanner,
  MdPointOfSale,
  MdClose
} from 'react-icons/md';
import './Dashboard.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const DATE_RANGE_OPTIONS = [
  { key: 'today', label: 'Hari Ini' },
  { key: '7days', label: '7 Hari Terakhir' },
  { key: '30days', label: '30 Hari Terakhir' },
  { key: 'thisMonth', label: 'Bulan Ini' },
  { key: 'all', label: 'Semua Data' }
];

// Helper date matching (YYYY-MM-DD in local time)
const toLocalDateString = (dateObj) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [chartViewMode, setChartViewMode] = useState('bar'); // 'area', 'bar'
  const [hoveredDay, setHoveredDay] = useState(null);
  const svgRef = useRef(null);
  const loadedPeriodRef = useRef('none');

  const fetchData = async (isSilent = false, targetRange = dateRange, overrideStart = customStartDate, overrideEnd = customEndDate) => {
    if (!isSilent) setLoading(true);
    try {
      let queryParams = 'populateUsers=false';
      if (targetRange === 'today') {
        queryParams += '&days=2';
      } else if (targetRange === '7days') {
        queryParams += '&days=14';
      } else if (targetRange === '30days' || targetRange === 'thisMonth') {
        queryParams += '&days=65';
      } else if (targetRange === 'custom') {
        const start = overrideStart || customStartDate;
        const end = overrideEnd || customEndDate;
        if (start) queryParams += `&startDate=${start}`;
        if (end) queryParams += `&endDate=${end}`;
      } // 'all' passes no date filter, loading historical data

      const [ordersRes, foodsRes] = await Promise.all([
        api.get(`/api/order/list?${queryParams}`),
        foods.length === 0 ? api.get(`/api/food/list`) : Promise.resolve({ data: { success: true, data: foods } })
      ]);

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
        loadedPeriodRef.current = targetRange;
      }
      if (foodsRes.data.success && foodsRes.data.data) {
        setFoods(foodsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (!isSilent) toast.error('Gagal memuat data ringkasan');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false, '7days');
  }, []);

  // When switching date range, set sensible default chart mode and fetch broader range if needed
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    setHoveredDay(null);
    if (newRange === '30days' || newRange === 'thisMonth') {
      setChartViewMode('area');
      if (loadedPeriodRef.current !== '30days' && loadedPeriodRef.current !== 'thisMonth' && loadedPeriodRef.current !== 'all') {
        fetchData(false, newRange);
      }
    } else if (newRange === 'all') {
      setChartViewMode('area');
      if (loadedPeriodRef.current !== 'all') {
        fetchData(false, 'all');
      }
    } else {
      setChartViewMode('bar');
      if (loadedPeriodRef.current === 'today' && newRange === '7days') {
        fetchData(false, '7days');
      }
    }
  };

  // Compute Active Time Boundaries & Description
  const rangeConfig = useMemo(() => {
    const now = new Date();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let start = new Date(todayZero);
    let end = new Date(todayEnd);
    let prevStart = new Date(todayZero);
    let prevEnd = new Date(todayEnd);
    let comparisonLabel = 'vs periode sebelumnya';
    let rangeDescription = '';

    if (dateRange === 'today') {
      start = todayZero;
      end = todayEnd;
      prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      comparisonLabel = 'vs kemarin';
      rangeDescription = `${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} (Hari Ini)`;
    } else if (dateRange === '7days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      end = todayEnd;
      prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 23, 59, 59, 999);
      comparisonLabel = 'vs 7 hari sebelumnya';
      rangeDescription = `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (dateRange === '30days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
      end = todayEnd;
      prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 23, 59, 59, 999);
      comparisonLabel = 'vs 30 hari sebelumnya';
      rangeDescription = `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (dateRange === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = todayEnd;
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 23, 59, 59, 999);
      comparisonLabel = 'vs bulan lalu (periode sama)';
      rangeDescription = `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (dateRange === 'all') {
      start = new Date(0);
      end = new Date(8640000000000000);
      prevStart = new Date(0);
      prevEnd = new Date(0);
      comparisonLabel = 'riwayat keseluruhan';
      rangeDescription = 'Semua transaksi tercatat';
    } else if (dateRange === 'custom') {
      const s = customStartDate 
        ? new Date(customStartDate + 'T00:00:00') 
        : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
      const e = customEndDate 
        ? new Date(customEndDate + 'T23:59:59.999') 
        : todayEnd;
      start = s;
      end = e;
      const diffMs = Math.max(86400000, end.getTime() - start.getTime());
      const diffDays = Math.max(1, Math.round(diffMs / 86400000));
      prevEnd = new Date(start.getTime() - 1);
      prevStart = new Date(start.getTime() - diffDays * 86400000);
      comparisonLabel = `vs ${diffDays} hari sebelumnya`;
      rangeDescription = `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }

    return { start, end, prevStart, prevEnd, comparisonLabel, rangeDescription };
  }, [dateRange, customStartDate, customEndDate]);

  // Derived display dates for the custom date picker
  const displayStartDate = dateRange === 'custom'
    ? customStartDate
    : (dateRange === 'all' ? '' : toLocalDateString(rangeConfig.start));

  const displayEndDate = dateRange === 'custom'
    ? customEndDate
    : (dateRange === 'all' ? '' : toLocalDateString(rangeConfig.end));

  const handleCustomDateChange = (type, value) => {
    const today = toLocalDateString(new Date());
    let start = type === 'start' ? value : (customStartDate || (dateRange !== 'all' ? toLocalDateString(rangeConfig.start) : ''));
    let end = type === 'end' ? value : (customEndDate || (dateRange !== 'all' ? toLocalDateString(rangeConfig.end) : ''));

    if (type === 'start') {
      if (!end) end = today;
      if (value > end) end = value;
      setCustomStartDate(value);
      setCustomEndDate(end);
    } else {
      if (!start) start = value;
      if (value < start) start = value;
      setCustomStartDate(start);
      setCustomEndDate(value);
    }

    setDateRange('custom');
    setChartViewMode('area');
    fetchData(false, 'custom', start, end);
  };

  const handleClearCustomRange = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    handleDateRangeChange('7days');
  };

  // Filtered orders based on selected range
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.date || o.createdAt);
      return orderDate >= rangeConfig.start && orderDate <= rangeConfig.end;
    });
  }, [orders, rangeConfig]);

  // Orders in previous comparison period
  const previousOrders = useMemo(() => {
    if (dateRange === 'all') return [];
    return orders.filter(o => {
      const orderDate = new Date(o.date || o.createdAt);
      return orderDate >= rangeConfig.prevStart && orderDate <= rangeConfig.prevEnd;
    });
  }, [orders, rangeConfig, dateRange]);

  // 1. KPI Calculations (The 3-Card Golden Triad)
  const metrics = useMemo(() => {
    let currentRev = 0;
    let prevRev = 0;
    let currentOrdersCount = filteredOrders.length;

    filteredOrders.forEach((o) => {
      if (o.payment) {
        currentRev += (o.amount || 0);
      }
    });

    previousOrders.forEach((o) => {
      if (o.payment) {
        prevRev += (o.amount || 0);
      }
    });

    const aov = currentOrdersCount > 0 ? Math.round(currentRev / currentOrdersCount) : 0;
    const diff = currentRev - prevRev;
    const growthPercent = prevRev > 0 
      ? Math.round((diff / prevRev) * 100) 
      : (currentRev > 0 ? 100 : 0);

    return {
      currentRevenue: currentRev,
      prevRevenue: prevRev,
      growthPercent,
      isGrowthPositive: diff >= 0,
      currentOrdersCount,
      aov,
      totalFoods: foods.length,
      availableFoods: foods.filter(f => f.available !== false).length
    };
  }, [filteredOrders, previousOrders, foods]);

  // 2. Dynamic Sales Trend Chart
  const salesTrend = useMemo(() => {
    let bars = [];
    let chartTitle = 'Tren Penjualan';
    let chartSubtitle = 'Perkembangan omzet dan volume pesanan';

    if (dateRange === 'today') {
      chartTitle = 'Tren Penjualan Per Jam (Hari Ini)';
      chartSubtitle = 'Aktivitas omzet per blok jam operasional hari ini';
      
      const hourBuckets = [
        { label: '08-10', fullDate: '08:00 - 10:00', start: 8, end: 10 },
        { label: '10-12', fullDate: '10:00 - 12:00', start: 10, end: 12 },
        { label: '12-14', fullDate: '12:00 - 14:00', start: 12, end: 14 },
        { label: '14-16', fullDate: '14:00 - 16:00', start: 14, end: 16 },
        { label: '16-18', fullDate: '16:00 - 18:00', start: 16, end: 18 },
        { label: '18-20', fullDate: '18:00 - 20:00', start: 18, end: 20 },
        { label: '20-22', fullDate: '20:00 - 22:00', start: 20, end: 22 },
      ];

      bars = hourBuckets.map(b => {
        let revenue = 0;
        let orderCount = 0;

        filteredOrders.forEach((o) => {
          const raw = o.date || o.createdAt;
          if (raw) {
            const h = new Date(raw).getHours();
            if (h >= b.start && h < b.end) {
              orderCount += 1;
              if (o.payment) revenue += (o.amount || 0);
            }
          }
        });

        return {
          key: b.label,
          dayLabel: b.label,
          subLabel: 'WIB',
          fullDate: b.fullDate,
          revenue,
          orderCount
        };
      });

    } else if (dateRange === '7days') {
      chartTitle = 'Tren Penjualan 7 Hari Terakhir';
      chartSubtitle = 'Perkembangan omzet dan volume pesanan harian';

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = toLocalDateString(d);
        const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
        const fullDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        let revenue = 0;
        let orderCount = 0;

        filteredOrders.forEach((o) => {
          if (toLocalDateString(o.date || o.createdAt) === dateStr) {
            orderCount += 1;
            if (o.payment) revenue += (o.amount || 0);
          }
        });

        bars.push({
          key: dateStr,
          dayLabel,
          subLabel: fullDate.split(' ')[0],
          fullDate,
          revenue,
          orderCount
        });
      }

    } else if (dateRange === '30days') {
      chartTitle = 'Tren Penjualan 30 Hari Terakhir';
      chartSubtitle = 'Perkembangan omzet harian selama 30 hari ke belakang';

      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = toLocalDateString(d);
        const fullDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        let revenue = 0;
        let orderCount = 0;

        filteredOrders.forEach((o) => {
          if (toLocalDateString(o.date || o.createdAt) === dateStr) {
            orderCount += 1;
            if (o.payment) revenue += (o.amount || 0);
          }
        });

        bars.push({
          key: dateStr,
          dayLabel: d.getDate().toString(),
          subLabel: d.toLocaleDateString('id-ID', { month: 'short' }),
          fullDate,
          revenue,
          orderCount
        });
      }

    } else if (dateRange === 'thisMonth') {
      chartTitle = 'Tren Penjualan Bulan Ini';
      chartSubtitle = 'Aktivitas omzet dari tanggal 1 hingga hari ini';

      const now = new Date();
      const currentDay = now.getDate();

      for (let i = 1; i <= currentDay; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        const dateStr = toLocalDateString(d);
        const fullDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        let revenue = 0;
        let orderCount = 0;

        filteredOrders.forEach((o) => {
          if (toLocalDateString(o.date || o.createdAt) === dateStr) {
            orderCount += 1;
            if (o.payment) revenue += (o.amount || 0);
          }
        });

        bars.push({
          key: dateStr,
          dayLabel: i.toString(),
          subLabel: d.toLocaleDateString('id-ID', { month: 'short' }),
          fullDate,
          revenue,
          orderCount
        });
      }

    } else if (dateRange === 'all') {
      chartTitle = 'Tren Penjualan Keseluruhan';
      chartSubtitle = 'Agregasi omzet 6 bulan terakhir';

      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        const monthLabel = d.toLocaleDateString('id-ID', { month: 'short' });
        const fullDate = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        let revenue = 0;
        let orderCount = 0;

        orders.forEach((o) => {
          const od = new Date(o.date || o.createdAt);
          if (od.getFullYear() === year && od.getMonth() === month) {
            orderCount += 1;
            if (o.payment) revenue += (o.amount || 0);
          }
        });

        bars.push({
          key: `${year}-${month}`,
          dayLabel: monthLabel,
          subLabel: year.toString().slice(-2),
          fullDate,
          revenue,
          orderCount
        });
      }

    } else if (dateRange === 'custom') {
      const s = rangeConfig.start;
      const e = rangeConfig.end;
      const diffMs = Math.max(86400000, e.getTime() - s.getTime());
      const diffDays = Math.max(1, Math.round(diffMs / 86400000));

      chartTitle = 'Tren Penjualan Periode Kustom';
      chartSubtitle = `Aktivitas omzet harian (${rangeConfig.rangeDescription})`;

      const cur = new Date(s);
      let loopLimit = 0;
      while (cur <= e && loopLimit < 90) {
        loopLimit += 1;
        const dateStr = toLocalDateString(cur);
        const fullDate = cur.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const dayLabel = diffDays <= 7 
          ? cur.toLocaleDateString('id-ID', { weekday: 'short' }) 
          : cur.getDate().toString();

        let revenue = 0;
        let orderCount = 0;

        filteredOrders.forEach((o) => {
          if (toLocalDateString(o.date || o.createdAt) === dateStr) {
            orderCount += 1;
            if (o.payment) revenue += (o.amount || 0);
          }
        });

        bars.push({
          key: dateStr,
          dayLabel,
          subLabel: diffDays <= 7 ? fullDate.split(' ')[0] : cur.toLocaleDateString('id-ID', { month: 'short' }),
          fullDate,
          revenue,
          orderCount
        });

        cur.setDate(cur.getDate() + 1);
      }
    }

    const maxRevenue = Math.max(...bars.map(b => b.revenue), 100000);
    return { bars, maxRevenue, chartTitle, chartSubtitle };
  }, [dateRange, filteredOrders, orders, rangeConfig]);

  // Executive Stats Summary for the active chart
  const chartStats = useMemo(() => {
    const bars = salesTrend.bars;
    if (!bars || bars.length === 0) {
      return { totalRev: 0, avgRev: 0, peak: null, totalOrders: 0 };
    }
    const totalRev = bars.reduce((sum, b) => sum + b.revenue, 0);
    const totalOrders = bars.reduce((sum, b) => sum + b.orderCount, 0);
    const avgRev = Math.round(totalRev / bars.length);
    const peak = [...bars].sort((a, b) => b.revenue - a.revenue)[0];

    return { totalRev, avgRev, peak, totalOrders };
  }, [salesTrend.bars]);

  // Clean Milestone Ticks for X-Axis (aligned with bar/point slot centers!)
  const milestoneTicks = useMemo(() => {
    const bars = salesTrend.bars;
    if (!bars || bars.length === 0) return [];
    
    // For 7 days or less, display all items cleanly centered in each slot
    if (bars.length <= 8) {
      return bars.map((b, idx) => ({
        key: idx,
        label: b.dayLabel,
        subLabel: b.subLabel,
        fullDate: b.fullDate,
        percent: ((idx + 0.5) / bars.length) * 100
      }));
    }

    // For 30 days or large data, pick 5 spaced milestone ticks centered in their respective slots
    const tickIndices = [
      0,
      Math.round((bars.length - 1) * 0.25),
      Math.round((bars.length - 1) * 0.5),
      Math.round((bars.length - 1) * 0.75),
      bars.length - 1
    ];

    return tickIndices.map(idx => ({
      key: idx,
      label: bars[idx].fullDate,
      percent: ((idx + 0.5) / bars.length) * 100
    }));
  }, [salesTrend.bars]);

  // Smooth Bezier Curve SVG calculations for Area Chart Mode
  // Smooth Unified SVG calculations for both Area and Bar Chart Mode
  const svgChartData = useMemo(() => {
    const bars = salesTrend.bars;
    if (!bars || bars.length === 0) return null;

    const width = 660;
    const height = 230;
    const padLeft = 58; // Generous space so Y-axis labels never collide with bars
    const padRight = 20;
    const padTop = 24;
    const padBottom = 20;
    const usableW = width - padLeft - padRight;
    const usableH = height - padTop - padBottom;
    const rawMaxRev = salesTrend.maxRevenue;
    // Add 10% breathing room at the top
    const maxRev = Math.max(Math.ceil(rawMaxRev * 1.10), 100000);
    const baselineY = padTop + usableH;

    const count = bars.length;
    const slotWidth = usableW / count;
    // Balanced bar width: comfortable proportion that breathes well
    const barWidth = count <= 8 
      ? Math.min(36, Math.max(18, slotWidth * 0.50))
      : Math.max(5, Math.min(18, slotWidth * 0.68));

    const points = bars.map((b, i) => {
      // Centered cleanly in its slot (safely away from Y-axis text!)
      const x = padLeft + (i + 0.5) * slotWidth;
      const y = padTop + usableH - (b.revenue / Math.max(maxRev, 1)) * usableH;
      const barX = x - barWidth / 2;
      const barHeight = Math.max(3, (b.revenue / Math.max(maxRev, 1)) * usableH);
      const barY = baselineY - barHeight;
      return { 
        ...b, 
        index: i,
        x, 
        y, 
        barX, 
        barY, 
        barWidth, 
        barHeight,
        slotWidth 
      };
    });

    // Average line Y coordinate
    const avgRev = chartStats.avgRev;
    const avgY = padTop + usableH - (avgRev / Math.max(maxRev, 1)) * usableH;

    // Spline curve for Area chart
    let pathD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    if (points.length > 1) {
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? i : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
    }

    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const areaD = `${pathD} L ${lastPoint.x.toFixed(1)} ${baselineY} L ${firstPoint.x.toFixed(1)} ${baselineY} Z`;

    // 4 Horizontal Gridlines (0, 33%, 66%, 100% of maxRev)
    const gridLines = [
      { rev: maxRev, y: padTop },
      { rev: Math.round(maxRev * 0.66), y: padTop + usableH * 0.34 },
      { rev: Math.round(maxRev * 0.33), y: padTop + usableH * 0.67 },
      { rev: 0, y: baselineY }
    ];

    return { 
      points, 
      width, 
      height, 
      usableW, 
      usableH, 
      padLeft, 
      padRight, 
      padTop, 
      baselineY, 
      pathD, 
      areaD, 
      gridLines, 
      avgRev, 
      avgY,
      slotWidth 
    };
  }, [salesTrend.bars, salesTrend.maxRevenue, chartStats.avgRev]);

  // Interactive mouse tracking over Unified SVG Chart with slot-snapping
  const handleSvgMouseMove = (e) => {
    if (!svgRef.current || !svgChartData) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const count = svgChartData.points.length;
    const padLeftPx = (svgChartData.padLeft / svgChartData.width) * rect.width;
    const usableWPx = (svgChartData.usableW / svgChartData.width) * rect.width;
    const relX = mouseX - padLeftPx;
    let idx = Math.floor((relX / usableWPx) * count);
    idx = Math.max(0, Math.min(count - 1, idx));
    setHoveredDay(idx);
  };

  // 3. Top 5 Best-Selling Dishes in Filtered Period
  const topDishes = useMemo(() => {
    const map = {};
    filteredOrders.forEach((order) => {
      if (order.status !== 'Dibatalkan' && order.status !== 'Cancelled') {
        order.items?.forEach((item) => {
          const key = item.name || 'Menu';
          if (!map[key]) {
            map[key] = {
              name: key,
              quantity: 0,
              totalSales: 0,
              image: item.image || null,
              category: item.category || 'Menu'
            };
          }
          map[key].quantity += (item.quantity || 1);
          map[key].totalSales += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    const sorted = Object.values(map).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    const topQty = sorted[0]?.quantity || 1;
    return { list: sorted, topQty };
  }, [filteredOrders]);

  // 4. Peak Ordering Hours Distribution in Filtered Period
  const peakHours = useMemo(() => {
    const buckets = [
      { label: '08:00 - 10:00', sub: 'Pagi', count: 0, start: 8, end: 10 },
      { label: '10:00 - 12:00', sub: 'Siang Awal', count: 0, start: 10, end: 12 },
      { label: '12:00 - 14:00', sub: 'Makan Siang', count: 0, start: 12, end: 14 },
      { label: '14:00 - 16:00', sub: 'Sore Awal', count: 0, start: 14, end: 16 },
      { label: '16:00 - 18:00', sub: 'Sore / Kopi', count: 0, start: 16, end: 18 },
      { label: '18:00 - 20:00', sub: 'Makan Malam', count: 0, start: 18, end: 20 },
      { label: '20:00 - 22:00', sub: 'Malam / Santai', count: 0, start: 20, end: 22 },
    ];

    filteredOrders.forEach((o) => {
      const raw = o.date || o.createdAt;
      if (raw) {
        const hour = new Date(raw).getHours();
        const found = buckets.find(b => hour >= b.start && hour < b.end);
        if (found) found.count += 1;
      }
    });

    const maxCount = Math.max(...buckets.map(b => b.count), 1);
    const busiest = [...buckets].sort((a, b) => b.count - a.count)[0];
    return { buckets, maxCount, busiest };
  }, [filteredOrders]);

  // 5. Payment Methods & Financial Reconciliation in Filtered Period
  const paymentBreakdown = useMemo(() => {
    let onlineCount = 0;
    let cashCount = 0;
    let onlineAmount = 0;
    let cashAmount = 0;

    filteredOrders.forEach((o) => {
      const method = (o.paymentMethod || '').toLowerCase();
      const amt = o.amount || 0;
      const isPaid = Boolean(o.payment);

      if (method.includes('tunai') || method.includes('cash')) {
        cashCount += 1;
        if (isPaid) cashAmount += amt;
      } else {
        onlineCount += 1;
        if (isPaid) onlineAmount += amt;
      }
    });

    const total = filteredOrders.length || 1;
    const onlinePct = Math.round((onlineCount / total) * 100);
    const cashPct = 100 - onlinePct;
    const onlineAov = onlineCount > 0 ? Math.round(onlineAmount / onlineCount) : 0;
    const cashAov = cashCount > 0 ? Math.round(cashAmount / cashCount) : 0;

    return { 
      onlineCount, 
      cashCount, 
      onlineAmount, 
      cashAmount, 
      onlineAov, 
      cashAov, 
      onlinePct, 
      cashPct, 
      total: filteredOrders.length 
    };
  }, [filteredOrders]);


  const activeHoverItem = hoveredDay !== null && salesTrend.bars[hoveredDay] 
    ? salesTrend.bars[hoveredDay] 
    : null;

  const hoverVsAvgPercent = activeHoverItem && chartStats.avgRev > 0
    ? Math.round(((activeHoverItem.revenue - chartStats.avgRev) / chartStats.avgRev) * 100)
    : 0;

  return (
    <div className="dashboard-page">
      {/* ── Top Header with Actions ── */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Ringkasan Operasional Kafe</h2>
          <p className="dashboard-subtitle">Pantau performa penjualan, menu terlaris, dan arus pesanan secara terukur</p>
        </div>

        <div className="dashboard-header-actions">
          <Link to="/orders" className="btn-goto-orders">
            <span>Kelola Pesanan</span>
            <MdArrowForward />
          </Link>
        </div>
      </div>

      {/* ── Filter Bar: Date Range Selector ── */}
      <div className="date-range-filter-bar">
        <div className="range-pills-group" role="tablist" aria-label="Pilihan Rentang Waktu">
          {DATE_RANGE_OPTIONS.map((opt) => {
            const isActive = dateRange === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`range-pill ${isActive ? 'active' : ''}`}
                onClick={() => handleDateRangeChange(opt.key)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className={`dashboard-date-range-box ${dateRange === 'custom' ? 'active' : ''}`} title="Filter rentang tanggal">
          <MdOutlineCalendarToday className="dashboard-date-range-icon" />
          <input
            type="date"
            className="dashboard-date-native-input"
            value={displayStartDate}
            onChange={(e) => handleCustomDateChange('start', e.target.value)}
            max={displayEndDate || toLocalDateString(new Date())}
            title="Tanggal Mulai"
          />
          <span className="dashboard-date-range-sep">–</span>
          <input
            type="date"
            className="dashboard-date-native-input"
            value={displayEndDate}
            onChange={(e) => handleCustomDateChange('end', e.target.value)}
            min={displayStartDate || undefined}
            max={toLocalDateString(new Date())}
            title="Tanggal Akhir"
          />
          {dateRange === 'custom' && (
            <button
              type="button"
              className="dashboard-date-clear-btn"
              onClick={handleClearCustomRange}
              title="Reset ke 7 Hari Terakhir"
            >
              <MdClose className="date-clear-icon" />
            </button>
          )}
        </div>
      </div>

      {/* ── 1. The 3-Card Golden Triad Row ── */}
      <div className="kpi-grid">
        {/* Card 1: Revenue in Selected Range */}
        <div className="kpi-card">
          <div className="kpi-icon revenue">
            <MdAttachMoney />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">
              {dateRange === 'today' ? 'Pendapatan Hari Ini' : 'Total Omzet Penjualan'}
            </span>
            <h3 className="kpi-value">Rp {metrics.currentRevenue.toLocaleString('id-ID')}</h3>
            <div className="kpi-footer">
              {dateRange !== 'all' && (
                <span className={`trend-tag ${metrics.isGrowthPositive ? 'positive' : 'neutral'}`}>
                  {metrics.isGrowthPositive ? <MdOutlineTrendingUp /> : <MdOutlineTrendingDown />}
                  {metrics.growthPercent > 0 ? `+${metrics.growthPercent}%` : `${metrics.growthPercent}%`}
                </span>
              )}
              <span className="trend-caption">
                {rangeConfig.comparisonLabel} {metrics.prevRevenue > 0 ? `(Rp ${metrics.prevRevenue.toLocaleString('id-ID')})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Orders Count in Selected Range */}
        <div className="kpi-card">
          <div className="kpi-icon orders">
            <MdReceiptLong />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">
              {dateRange === 'today' ? 'Pesanan Masuk Hari Ini' : 'Jumlah Pesanan'}
            </span>
            <h3 className="kpi-value">{metrics.currentOrdersCount} <span className="kpi-unit">Transaksi</span></h3>
            <div className="kpi-footer">
              <span className="info-badge">
                {DATE_RANGE_OPTIONS.find(o => o.key === dateRange)?.label || 'Periode'}
              </span>
              <span className="trend-caption">Total semua pemesanan terdata</span>
            </div>
          </div>
        </div>

        {/* Card 3: Average Order Value (AOV) */}
        <div className="kpi-card">
          <div className="kpi-icon aov">
            <MdPayments />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Rata-Rata Nilai Tiket (AOV)</span>
            <h3 className="kpi-value">Rp {metrics.aov.toLocaleString('id-ID')}</h3>
            <div className="kpi-footer">
              <span className="info-badge blue">Per Transaksi</span>
              <span className="trend-caption">Rata-rata belanja pelanggan</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Charts Section (Two Columns) ── */}
      <div className="dashboard-grid-2col">
        {/* Left Column: Modern Revenue Trend Chart Card */}
        <div className="chart-card">
          <div className="card-header">
            <div>
              <h4 className="card-title">{salesTrend.chartTitle}</h4>
              <p className="card-subtitle">{salesTrend.chartSubtitle}</p>
            </div>

            {/* View Mode Segmented Controls: Garis vs Batang */}
            <div className="chart-mode-toggles" role="tablist" aria-label="Pilihan Model Grafik">
              <button 
                type="button" 
                className={`chart-mode-btn ${chartViewMode === 'area' ? 'active' : ''}`}
                onClick={() => setChartViewMode('area')}
                title="Tampilan Grafik Garis Area"
              >
                <MdShowChart />
                <span>Garis</span>
              </button>
              <button 
                type="button" 
                className={`chart-mode-btn ${chartViewMode === 'bar' ? 'active' : ''}`}
                onClick={() => setChartViewMode('bar')}
                title={dateRange === 'all' ? 'Tampilan Diagram Batang Bulanan' : 'Tampilan Diagram Batang Harian'}
              >
                <MdBarChart />
                <span>{dateRange === 'all' ? 'Bulanan' : 'Batang'}</span>
              </button>
            </div>
          </div>

          {/* ── Executive Insight Strip (Smart Metrics Header) ── */}
          <div className="chart-insight-strip">
            {activeHoverItem ? (
              <div className="insight-live-highlight">
                <span className="live-tag">Terpilih</span>
                <span className="live-date">{activeHoverItem.fullDate}:</span>
                <span className="live-rev">Rp {activeHoverItem.revenue.toLocaleString('id-ID')}</span>
                <span className="live-orders">({activeHoverItem.orderCount} transaksi)</span>
              </div>
            ) : (
              <div className="insight-stats-row">
                <div className="insight-stat">
                  <span className="insight-stat-label">Rata-Rata</span>
                  <span className="insight-stat-val">Rp {chartStats.avgRev.toLocaleString('id-ID')}/hari</span>
                </div>
                <div className="insight-stat-divider"></div>
                <div className="insight-stat">
                  <span className="insight-stat-label">Puncak Tertinggi</span>
                  <span className="insight-stat-val highlight">
                    Rp {chartStats.peak ? chartStats.peak.revenue.toLocaleString('id-ID') : '0'}
                    {chartStats.peak && <span className="stat-sub">({chartStats.peak.fullDate})</span>}
                  </span>
                </div>
                <div className="insight-stat-divider"></div>
                <div className="insight-stat">
                  <span className="insight-stat-label">Total Periode</span>
                  <span className="insight-stat-val">Rp {chartStats.totalRev.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Unified Visual Representation (Garis & Batang) ── */}
          {svgChartData && (
            <div className="trend-unified-chart-container">
              <svg 
                ref={svgRef}
                viewBox={`0 0 ${svgChartData.width} ${svgChartData.height}`}
                className="unified-chart-svg"
                preserveAspectRatio="none"
                onMouseMove={handleSvgMouseMove}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <defs>
                  {/* Area Fill Gradient */}
                  <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5722" stopOpacity="0.38" />
                    <stop offset="60%" stopColor="#ff5722" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#ff5722" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Normal Bar Gradient */}
                  <linearGradient id="barNormalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff6f43" />
                    <stop offset="100%" stopColor="#ff4d4f" />
                  </linearGradient>

                  {/* Hovered Bar Gradient */}
                  <linearGradient id="barHoverGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff4757" />
                    <stop offset="100%" stopColor="#e84118" />
                  </linearGradient>

                  {/* Clip path so bars have rounded top caps and perfectly flat bottoms at baselineY */}
                  <clipPath id="chartPlotArea">
                    <rect 
                      x={svgChartData.padLeft} 
                      y={0} 
                      width={svgChartData.usableW} 
                      height={svgChartData.baselineY} 
                    />
                  </clipPath>
                </defs>

                {/* 1. Horizontal Gridlines & Y-Axis Scale */}
                {svgChartData.gridLines.map((gl, i) => (
                  <g key={i}>
                    <line 
                      x1={svgChartData.padLeft} 
                      y1={gl.y} 
                      x2={svgChartData.width - svgChartData.padRight} 
                      y2={gl.y} 
                      stroke="#f1f5f9" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={svgChartData.padLeft - 10} 
                      y={gl.y + 4} 
                      textAnchor="end" 
                      className="svg-y-tick"
                    >
                      {gl.rev >= 1000000 
                        ? `${(gl.rev / 1000000).toFixed(1).replace('.0', '')}jt` 
                        : gl.rev >= 1000 
                        ? `${Math.round(gl.rev / 1000)}rb` 
                        : '0'}
                    </text>
                  </g>
                ))}

                {/* 2. Render Area Chart Mode */}
                {chartViewMode === 'area' && (
                  <g className="svg-area-mode">
                    {/* Area Gradient Fill */}
                    <path 
                      d={svgChartData.areaD} 
                      fill="url(#revenueAreaGrad)" 
                    />

                    {/* Smooth Spline Curve */}
                    <path 
                      d={svgChartData.pathD} 
                      fill="none" 
                      stroke="#ff5722" 
                      strokeWidth="2.8" 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}

                {/* 3. Render Bar Chart Mode (Clean Top-Rounded Bars Standing Firmly on Baseline) */}
                {chartViewMode === 'bar' && (
                  <g className="svg-bar-mode">
                    {svgChartData.points.map((p, idx) => {
                      const isHovered = hoveredDay === idx;
                      const isDimmed = hoveredDay !== null && !isHovered;
                      const cornerRadius = p.barWidth > 14 ? 5 : p.barWidth > 8 ? 3 : 2;

                      return (
                        <g 
                          key={p.key || idx} 
                          onMouseEnter={() => setHoveredDay(idx)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Subtle background slot column highlight */}
                          <rect 
                            x={p.x - p.slotWidth / 2 + 1} 
                            y={svgChartData.padTop} 
                            width={p.slotWidth - 2} 
                            height={svgChartData.usableH} 
                            rx="4" 
                            fill={isHovered ? "rgba(241, 245, 249, 0.85)" : "transparent"} 
                          />

                          {/* Top-rounded bar clipped flat at baselineY */}
                          <rect 
                            x={p.barX} 
                            y={p.barY} 
                            width={p.barWidth} 
                            height={p.barHeight + 8} 
                            rx={cornerRadius} 
                            clipPath="url(#chartPlotArea)"
                            fill={isHovered ? "url(#barHoverGrad)" : "url(#barNormalGrad)"} 
                            opacity={isDimmed ? 0.4 : 1}
                            style={{ transition: 'opacity 0.15s ease, fill 0.15s ease' }}
                          />
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Crisp Baseline Line */}
                <line 
                  x1={svgChartData.padLeft} 
                  y1={svgChartData.baselineY} 
                  x2={svgChartData.width - svgChartData.padRight} 
                  y2={svgChartData.baselineY} 
                  stroke="#cbd5e1" 
                  strokeWidth="1.2" 
                />

                {/* 4. Garis Rata-Rata (Rendered on top of the graph so it's always clearly visible) */}
                {svgChartData.avgRev > 0 && svgChartData.avgY < svgChartData.baselineY && (
                  <g className="svg-avg-group" style={{ pointerEvents: 'none' }}>
                    <line 
                      x1={svgChartData.padLeft} 
                      y1={svgChartData.avgY} 
                      x2={svgChartData.width - svgChartData.padRight} 
                      y2={svgChartData.avgY} 
                      stroke="#475569" 
                      strokeWidth="1.5" 
                      strokeDasharray="5 4" 
                      opacity="0.85" 
                    />
                    <rect 
                      x={svgChartData.width - svgChartData.padRight - 60} 
                      y={svgChartData.avgY - 9} 
                      width="60" 
                      height="18" 
                      rx="4" 
                      fill="#ffffff" 
                      stroke="#64748b" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={svgChartData.width - svgChartData.padRight - 30} 
                      y={svgChartData.avgY + 3.5} 
                      textAnchor="middle" 
                      className="svg-avg-badge-text"
                    >
                      Rata-rata
                    </text>
                  </g>
                )}

                {/* 5. Interactive Scrubber & Hover Dot (On Top) */}
                {chartViewMode === 'area' && hoveredDay !== null && svgChartData.points[hoveredDay] && (
                  <g style={{ pointerEvents: 'none' }}>
                    <line 
                      x1={svgChartData.points[hoveredDay].x} 
                      y1={svgChartData.padTop} 
                      x2={svgChartData.points[hoveredDay].x} 
                      y2={svgChartData.baselineY} 
                      stroke="#cbd5e1" 
                      strokeWidth="1.5" 
                      strokeDasharray="4 3" 
                    />
                    <circle 
                      cx={svgChartData.points[hoveredDay].x} 
                      cy={svgChartData.points[hoveredDay].y} 
                      r="9" 
                      fill="rgba(255, 87, 34, 0.25)" 
                    />
                    <circle 
                      cx={svgChartData.points[hoveredDay].x} 
                      cy={svgChartData.points[hoveredDay].y} 
                      r="4.5" 
                      fill="#ff5722" 
                      stroke="#ffffff" 
                      strokeWidth="2" 
                    />
                  </g>
                )}
              </svg>

              {/* Floating Smart Tooltip */}
              {hoveredDay !== null && activeHoverItem && svgChartData.points[hoveredDay] && (
                <div 
                  className={`smart-chart-tooltip ${
                    hoveredDay < 3 ? 'align-left' : hoveredDay > svgChartData.points.length - 4 ? 'align-right' : 'align-center'
                  }`}
                  style={{
                    left: `${(svgChartData.points[hoveredDay].x / svgChartData.width) * 100}%`,
                    top: `${(Math.min(svgChartData.points[hoveredDay].y, svgChartData.baselineY - 45) / svgChartData.height) * 100}%`
                  }}
                >
                  <div className="tooltip-header">
                    <span className="tooltip-date">{activeHoverItem.fullDate}</span>
                    <span className={`tooltip-tag ${hoverVsAvgPercent >= 0 ? 'above' : 'below'}`}>
                      {hoverVsAvgPercent >= 0 ? `+${hoverVsAvgPercent}%` : `${hoverVsAvgPercent}%`} vs rata-rata
                    </span>
                  </div>
                  <div className="tooltip-body">
                    <div className="tooltip-row">
                      <span className="tooltip-label">Omzet:</span>
                      <span className="tooltip-val-rev">Rp {activeHoverItem.revenue.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">Pesanan:</span>
                      <span className="tooltip-val-orders">{activeHoverItem.orderCount} Transaksi</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Unified Collision-Free Milestone Timeline */}
              <div 
                className="milestone-timeline-container"
                style={{
                  paddingLeft: `${(svgChartData.padLeft / svgChartData.width) * 100}%`,
                  paddingRight: `${(svgChartData.padRight / svgChartData.width) * 100}%`
                }}
              >
                <div className="milestone-timeline-inner">
                  {milestoneTicks.map((tick) => (
                    <div 
                      key={tick.key} 
                      className="milestone-tick"
                      style={{ left: `${tick.percent}%` }}
                    >
                      <span className="tick-label">{tick.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Top 5 Best-Selling Dishes */}
        <div className="chart-card">
          <div className="card-header">
            <div>
              <h4 className="card-title">5 Menu Terlaris</h4>
              <p className="card-subtitle">
                {dateRange === 'today' ? 'Menu paling diminati hari ini' : `Menu favorit (${DATE_RANGE_OPTIONS.find(o => o.key === dateRange)?.label})`}
              </p>
            </div>
            <span className="pill-metric">Total {metrics.availableFoods} Menu Aktif</span>
          </div>

          <div className="top-dishes-list">
            {topDishes.list.length === 0 ? (
              <div className="empty-chart-state">
                <MdRestaurantMenu className="empty-icon" />
                <p>Belum ada data penjualan menu pada rentang waktu ini.</p>
              </div>
            ) : (
              topDishes.list.map((dish, i) => {
                const widthPct = Math.round((dish.quantity / topDishes.topQty) * 100);
                const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal';

                return (
                  <div key={i} className="top-dish-row">
                    <div className={`dish-rank ${rankClass}`}>
                      #{i + 1}
                    </div>

                    <div className="dish-info">
                      <div className="dish-title-line">
                        <span className="dish-name">{dish.name}</span>
                        <span className="dish-sold-qty">{dish.quantity} Porsi Terjual</span>
                      </div>

                      <div className="dish-progress-track">
                        <div 
                          className={`dish-progress-bar rank-${i + 1}`} 
                          style={{ width: `${widthPct}%` }}
                        ></div>
                      </div>

                      <div className="dish-meta-line">
                        <span className="dish-category-tag">{dish.category}</span>
                        <span className="dish-total-rev">Kontribusi: Rp {dish.totalSales.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Operational Insights Row (Clean Balanced 50/50 Grid) ── */}
      <div className="dashboard-grid-2col-equal">
        {/* Widget 1: Peak Hours */}
        <div className="chart-card">
          <div className="card-header">
            <div>
              <h4 className="card-title">Jam Ramai Kafe</h4>
              <p className="card-subtitle">Distribusi waktu masuk pesanan</p>
            </div>
            <MdOutlineAccessTime className="card-header-icon" />
          </div>

          <div className="peak-hours-widget">
            <div className="peak-hours-banner">
              <span className="peak-badge">Paling Padat</span>
              <p className="peak-time-text">{peakHours.busiest?.label || '12:00 - 14:00'}</p>
            </div>

            <div className="hourly-histogram">
              {peakHours.buckets.map((b, idx) => {
                const heightPct = Math.max(12, Math.round((b.count / peakHours.maxCount) * 100));
                const isBusiest = b.label === peakHours.busiest?.label && b.count > 0;

                return (
                  <div key={idx} className="hour-bar-col" title={`${b.label}: ${b.count} Pesanan`}>
                    <div className="hour-bar-track">
                      <div 
                        className={`hour-bar-fill ${isBusiest ? 'busiest' : ''}`}
                        style={{ height: `${heightPct}%` }}
                      ></div>
                    </div>
                    <span className="hour-label">{b.start}:00</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Widget 2: Payment Distribution */}
        <div className="chart-card">
          <div className="card-header">
            <div>
              <h4 className="card-title">Metode Pembayaran</h4>
              <p className="card-subtitle">Pilihan cara bayar pelanggan</p>
            </div>
            <MdPayments className="card-header-icon" />
          </div>

          <div className="payment-breakdown-widget">
            <div className="payment-bar-stacked">
              <div 
                className="payment-slice online" 
                style={{ width: `${paymentBreakdown.onlinePct}%` }}
                title={`Digital / QRIS: ${paymentBreakdown.onlinePct}%`}
              ></div>
              <div 
                className="payment-slice cash" 
                style={{ width: `${paymentBreakdown.cashPct}%` }}
                title={`Tunai di Kasir: ${paymentBreakdown.cashPct}%`}
              ></div>
            </div>

            <div className="payment-legend-list">
              <div className="payment-legend-row">
                <div className="legend-name-group">
                  <span className="color-indicator online"></span>
                  <span className="legend-label">Digital / QRIS</span>
                </div>
                <div className="legend-vals">
                  <b>{paymentBreakdown.onlinePct}%</b>
                  <span>({paymentBreakdown.onlineCount} transaksi)</span>
                </div>
              </div>

              <div className="payment-legend-row">
                <div className="legend-name-group">
                  <span className="color-indicator cash"></span>
                  <span className="legend-label">Tunai di Kasir</span>
                </div>
                <div className="legend-vals">
                  <b>{paymentBreakdown.cashPct}%</b>
                  <span>({paymentBreakdown.cashCount} transaksi)</span>
                </div>
              </div>
            </div>

            {/* Financial Reconciliation Cards */}
            <div className="payment-reconciliation-grid">
              <div className="reconciliation-card digital">
                <div className="reconciliation-header">
                  <MdQrCodeScanner className="reconciliation-icon" />
                  <span>Digital / QRIS</span>
                </div>
                <div className="reconciliation-amount">
                  Rp {paymentBreakdown.onlineAmount.toLocaleString('id-ID')}
                </div>
                <div className="reconciliation-meta">
                  Rata-rata: Rp {paymentBreakdown.onlineAov.toLocaleString('id-ID')}/trx
                </div>
              </div>

              <div className="reconciliation-card cash">
                <div className="reconciliation-header">
                  <MdPointOfSale className="reconciliation-icon" />
                  <span>Tunai Kasir</span>
                </div>
                <div className="reconciliation-amount">
                  Rp {paymentBreakdown.cashAmount.toLocaleString('id-ID')}
                </div>
                <div className="reconciliation-meta">
                  Rata-rata: Rp {paymentBreakdown.cashAov.toLocaleString('id-ID')}/trx
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
