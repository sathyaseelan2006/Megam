// ============================================================================
// ANALYTICS SERVICE - Monthly & Yearly Air Quality Analysis
// ============================================================================
// Provides statistical analysis and trends for pollution data over time
// ============================================================================

import { HistoricalDataPoint } from './dataCollectionService';

export interface MonthlyAnalysis {
  month: string; // "YYYY-MM"
  monthName: string; // "January 2025"
  avgAQI: number;
  minAQI: number;
  maxAQI: number;
  avgPM25: number;
  avgPM10: number;
  goodDays: number; // AQI 0-50
  moderateDays: number; // AQI 51-100
  unhealthyDays: number; // AQI 101+
  totalDays: number;
  trend: 'improving' | 'stable' | 'worsening';
  changePercent: number; // compared to previous month
}

export interface YearlyAnalysis {
  year: number;
  avgAQI: number;
  minAQI: number;
  maxAQI: number;
  avgPM25: number;
  avgPM10: number;
  goodDays: number;
  moderateDays: number;
  unhealthyDays: number;
  totalDays: number;
  monthlyBreakdown: MonthlyAnalysis[];
  bestMonth: string;
  worstMonth: string;
  overallTrend: 'improving' | 'stable' | 'worsening';
  yearOverYearChange?: number; // compared to previous year
}

export interface WeeklyAnalysis {
  dayOfWeek: string; // 'Monday', 'Tuesday', etc.
  date: string; // 'YYYY-MM-DD'
  avgAQI: number;
  minAQI: number;
  maxAQI: number;
  avgPM25: number;
  avgPM10: number;
  category: 'good' | 'moderate' | 'unhealthy';
  source: string;
  confidence: number;
}

export interface PollutantTrend {
  pollutant: string;
  currentAvg: number;
  previousAvg: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

/**
 * Categorize AQI value
 */
const categorizeAQI = (aqi: number): 'good' | 'moderate' | 'unhealthy' => {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  return 'unhealthy';
};

/**
 * Calculate trend between two values
 */
const calculateTrend = (current: number, previous: number): 'improving' | 'stable' | 'worsening' => {
  const change = ((current - previous) / previous) * 100;
  if (change < -5) return 'improving';
  if (change > 5) return 'worsening';
  return 'stable';
};

/**
 * Group historical data by month
 */
const groupByMonth = (data: HistoricalDataPoint[]): Map<string, HistoricalDataPoint[]> => {
  const grouped = new Map<string, HistoricalDataPoint[]>();
  
  data.forEach(point => {
    const month = point.date.substring(0, 7); // "YYYY-MM"
    if (!grouped.has(month)) {
      grouped.set(month, []);
    }
    grouped.get(month)!.push(point);
  });
  
  return grouped;
};

/**
 * Calculate monthly statistics
 */
const calculateMonthlyStats = (
  month: string,
  data: HistoricalDataPoint[],
  previousMonthAvg?: number
): MonthlyAnalysis => {
  const aqiValues = data.map(d => d.aqi);
  const pm25Values = data.map(d => d.pm25).filter(v => v > 0);
  const pm10Values = data.map(d => d.pm10).filter(v => v > 0);
  
  const avgAQI = aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length;
  const minAQI = Math.min(...aqiValues);
  const maxAQI = Math.max(...aqiValues);
  const avgPM25 = pm25Values.length > 0 ? pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length : 0;
  const avgPM10 = pm10Values.length > 0 ? pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length : 0;
  
  // Count days by category
  const goodDays = data.filter(d => categorizeAQI(d.aqi) === 'good').length;
  const moderateDays = data.filter(d => categorizeAQI(d.aqi) === 'moderate').length;
  const unhealthyDays = data.filter(d => categorizeAQI(d.aqi) === 'unhealthy').length;
  
  // Calculate trend
  let trend: 'improving' | 'stable' | 'worsening' = 'stable';
  let changePercent = 0;
  if (previousMonthAvg) {
    changePercent = ((avgAQI - previousMonthAvg) / previousMonthAvg) * 100;
    trend = calculateTrend(avgAQI, previousMonthAvg);
  }
  
  // Format month name
  const date = new Date(month + '-01');
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  return {
    month,
    monthName,
    avgAQI: Math.round(avgAQI),
    minAQI: Math.round(minAQI),
    maxAQI: Math.round(maxAQI),
    avgPM25: Math.round(avgPM25),
    avgPM10: Math.round(avgPM10),
    goodDays,
    moderateDays,
    unhealthyDays,
    totalDays: data.length,
    trend,
    changePercent: Math.round(changePercent * 10) / 10
  };
};

/**
 * Analyze monthly trends from historical data
 */
export const analyzeMonthlyTrends = (data: HistoricalDataPoint[]): MonthlyAnalysis[] => {
  const grouped = groupByMonth(data);
  const months = Array.from(grouped.keys()).sort();
  
  const analyses: MonthlyAnalysis[] = [];
  let previousMonthAvg: number | undefined;
  
  for (const month of months) {
    const monthData = grouped.get(month)!;
    const analysis = calculateMonthlyStats(month, monthData, previousMonthAvg);
    analyses.push(analysis);
    previousMonthAvg = analysis.avgAQI;
  }
  
  return analyses;
};

/**
 * Analyze yearly trends from historical data
 */
export const analyzeYearlyTrends = (data: HistoricalDataPoint[]): YearlyAnalysis[] => {
  // Group by year
  const yearGroups = new Map<number, HistoricalDataPoint[]>();
  
  data.forEach(point => {
    const year = parseInt(point.date.substring(0, 4));
    if (!yearGroups.has(year)) {
      yearGroups.set(year, []);
    }
    yearGroups.get(year)!.push(point);
  });
  
  const years = Array.from(yearGroups.keys()).sort();
  const yearlyAnalyses: YearlyAnalysis[] = [];
  
  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const yearData = yearGroups.get(year)!;
    
    // Calculate yearly stats
    const aqiValues = yearData.map(d => d.aqi);
    const pm25Values = yearData.map(d => d.pm25).filter(v => v > 0);
    const pm10Values = yearData.map(d => d.pm10).filter(v => v > 0);
    
    const avgAQI = aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length;
    const minAQI = Math.min(...aqiValues);
    const maxAQI = Math.max(...aqiValues);
    const avgPM25 = pm25Values.length > 0 ? pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length : 0;
    const avgPM10 = pm10Values.length > 0 ? pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length : 0;
    
    const goodDays = yearData.filter(d => categorizeAQI(d.aqi) === 'good').length;
    const moderateDays = yearData.filter(d => categorizeAQI(d.aqi) === 'moderate').length;
    const unhealthyDays = yearData.filter(d => categorizeAQI(d.aqi) === 'unhealthy').length;
    
    // Get monthly breakdown
    const monthlyBreakdown = analyzeMonthlyTrends(yearData);
    
    // Find best and worst months
    const sortedMonths = [...monthlyBreakdown].sort((a, b) => a.avgAQI - b.avgAQI);
    const bestMonth = sortedMonths[0]?.monthName || 'N/A';
    const worstMonth = sortedMonths[sortedMonths.length - 1]?.monthName || 'N/A';
    
    // Calculate overall trend
    let overallTrend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (monthlyBreakdown.length >= 2) {
      const firstHalf = monthlyBreakdown.slice(0, Math.floor(monthlyBreakdown.length / 2));
      const secondHalf = monthlyBreakdown.slice(Math.floor(monthlyBreakdown.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.avgAQI, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.avgAQI, 0) / secondHalf.length;
      
      overallTrend = calculateTrend(secondHalfAvg, firstHalfAvg);
    }
    
    // Year-over-year change
    let yearOverYearChange: number | undefined;
    if (i > 0) {
      const previousYearAvg = yearlyAnalyses[i - 1].avgAQI;
      yearOverYearChange = ((avgAQI - previousYearAvg) / previousYearAvg) * 100;
    }
    
    yearlyAnalyses.push({
      year,
      avgAQI: Math.round(avgAQI),
      minAQI: Math.round(minAQI),
      maxAQI: Math.round(maxAQI),
      avgPM25: Math.round(avgPM25),
      avgPM10: Math.round(avgPM10),
      goodDays,
      moderateDays,
      unhealthyDays,
      totalDays: yearData.length,
      monthlyBreakdown,
      bestMonth,
      worstMonth,
      overallTrend,
      yearOverYearChange: yearOverYearChange ? Math.round(yearOverYearChange * 10) / 10 : undefined
    });
  }
  
  return yearlyAnalyses;
};

/**
 * Analyze pollutant trends
 */
export const analyzePollutantTrends = (
  currentData: HistoricalDataPoint[],
  previousData: HistoricalDataPoint[]
): PollutantTrend[] => {
  const pollutants = ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co'];
  const trends: PollutantTrend[] = [];
  
  for (const pollutant of pollutants) {
    const currentValues = currentData
      .map(d => d[pollutant as keyof HistoricalDataPoint] as number)
      .filter(v => v > 0);
    const previousValues = previousData
      .map(d => d[pollutant as keyof HistoricalDataPoint] as number)
      .filter(v => v > 0);
    
    if (currentValues.length === 0 || previousValues.length === 0) continue;
    
    const currentAvg = currentValues.reduce((a, b) => a + b, 0) / currentValues.length;
    const previousAvg = previousValues.reduce((a, b) => a + b, 0) / previousValues.length;
    const changePercent = ((currentAvg - previousAvg) / previousAvg) * 100;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (changePercent > 5) trend = 'up';
    else if (changePercent < -5) trend = 'down';
    
    trends.push({
      pollutant: pollutant.toUpperCase(),
      currentAvg: Math.round(currentAvg * 10) / 10,
      previousAvg: Math.round(previousAvg * 10) / 10,
      changePercent: Math.round(changePercent * 10) / 10,
      trend,
      unit: pollutant === 'co' ? 'mg/m³' : 'µg/m³'
    });
  }
  
  return trends;
};

/**
 * Analyze weekly (last 7 days) day-by-day breakdown
 */
export const analyzeWeeklyTrends = (data: HistoricalDataPoint[]): WeeklyAnalysis[] => {
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const last7Days = data.filter(d => d.timestamp > sevenDaysAgo);
  
  const weeklyAnalysis: WeeklyAnalysis[] = [];
  
  // Get the last 7 days
  const endDate = new Date();
  for (let i = 6; i >= 0; i--) {
    const currentDate = new Date(endDate);
    currentDate.setDate(currentDate.getDate() - i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Find data for this specific day
    const dayData = last7Days.filter(d => d.date === dateStr);
    
    if (dayData.length > 0) {
      const point = dayData[0]; // Should only be one point per day
      
      weeklyAnalysis.push({
        dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
        date: dateStr,
        avgAQI: point.aqi,
        minAQI: point.aqi,
        maxAQI: point.aqi,
        avgPM25: point.pm25,
        avgPM10: point.pm10,
        category: categorizeAQI(point.aqi),
        source: point.source,
        confidence: point.confidence
      });
    } else {
      // No data for this day - show placeholder
      weeklyAnalysis.push({
        dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
        date: dateStr,
        avgAQI: 0,
        minAQI: 0,
        maxAQI: 0,
        avgPM25: 0,
        avgPM10: 0,
        category: 'good',
        source: 'N/A',
        confidence: 0
      });
    }
  }
  
  return weeklyAnalysis;
};

/**
 * Get quick summary for a location
 */
export const getQuickSummary = (data: HistoricalDataPoint[]): {
  last7Days: { avgAQI: number; avgPM25: number; avgPM10: number; trend: string };
  last30Days: { avgAQI: number; avgPM25: number; avgPM10: number; trend: string };
  last12Months: { avgAQI: number; avgPM25: number; avgPM10: number; trend: string };
  bestTime: string;
  worstTime: string;
} => {
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = now - (365 * 24 * 60 * 60 * 1000);
  
  const last7Days = data.filter(d => d.timestamp > sevenDaysAgo);
  const last30Days = data.filter(d => d.timestamp > thirtyDaysAgo);
  const last12Months = data.filter(d => d.timestamp > twelveMonthsAgo);
  
  const avg7Days = last7Days.length > 0
    ? last7Days.reduce((sum, d) => sum + d.aqi, 0) / last7Days.length
    : 0;
  
  const pm25_7Days = last7Days.filter(d => d.pm25 > 0);
  const avgPM25_7Days = pm25_7Days.length > 0
    ? pm25_7Days.reduce((sum, d) => sum + d.pm25, 0) / pm25_7Days.length
    : 0;
  
  const pm10_7Days = last7Days.filter(d => d.pm10 > 0);
  const avgPM10_7Days = pm10_7Days.length > 0
    ? pm10_7Days.reduce((sum, d) => sum + d.pm10, 0) / pm10_7Days.length
    : 0;

  const avg30Days = last30Days.length > 0
    ? last30Days.reduce((sum, d) => sum + d.aqi, 0) / last30Days.length
    : 0;
  
  const pm25_30Days = last30Days.filter(d => d.pm25 > 0);
  const avgPM25_30Days = pm25_30Days.length > 0
    ? pm25_30Days.reduce((sum, d) => sum + d.pm25, 0) / pm25_30Days.length
    : 0;
  
  const pm10_30Days = last30Days.filter(d => d.pm10 > 0);
  const avgPM10_30Days = pm10_30Days.length > 0
    ? pm10_30Days.reduce((sum, d) => sum + d.pm10, 0) / pm10_30Days.length
    : 0;
  
  const avg12Months = last12Months.length > 0
    ? last12Months.reduce((sum, d) => sum + d.aqi, 0) / last12Months.length
    : 0;
  
  const pm25_12Months = last12Months.filter(d => d.pm25 > 0);
  const avgPM25_12Months = pm25_12Months.length > 0
    ? pm25_12Months.reduce((sum, d) => sum + d.pm25, 0) / pm25_12Months.length
    : 0;
  
  const pm10_12Months = last12Months.filter(d => d.pm10 > 0);
  const avgPM10_12Months = pm10_12Months.length > 0
    ? pm10_12Months.reduce((sum, d) => sum + d.pm10, 0) / pm10_12Months.length
    : 0;
  
  // Determine trends
  // Weekly trend (compare first half of the week vs second half)
  const weekMid = Math.floor(last7Days.length / 2);
  const firstWeek = last7Days.slice(0, weekMid);
  const lastWeek = last7Days.slice(weekMid);
  const trend7 = firstWeek.length > 0 && lastWeek.length > 0
    ? calculateTrend(
        lastWeek.reduce((sum, d) => sum + d.aqi, 0) / lastWeek.length,
        firstWeek.reduce((sum, d) => sum + d.aqi, 0) / firstWeek.length
      )
    : 'stable';

  const first15Days = last30Days.slice(0, 15);
  const last15Days = last30Days.slice(-15);
  const trend30 = first15Days.length > 0 && last15Days.length > 0
    ? calculateTrend(
        last15Days.reduce((sum, d) => sum + d.aqi, 0) / last15Days.length,
        first15Days.reduce((sum, d) => sum + d.aqi, 0) / first15Days.length
      )
    : 'stable';
  
  // Find best and worst months
  const monthlyAnalyses = analyzeMonthlyTrends(last12Months);
  const sortedMonths = [...monthlyAnalyses].sort((a, b) => a.avgAQI - b.avgAQI);
  const bestTime = sortedMonths[0]?.monthName || 'N/A';
  const worstTime = sortedMonths[sortedMonths.length - 1]?.monthName || 'N/A';
  
  return {
    last7Days: {
      avgAQI: Math.round(avg7Days),
      avgPM25: Math.round(avgPM25_7Days * 10) / 10,
      avgPM10: Math.round(avgPM10_7Days * 10) / 10,
      trend: trend7
    },
    last30Days: {
      avgAQI: Math.round(avg30Days),
      avgPM25: Math.round(avgPM25_30Days * 10) / 10,
      avgPM10: Math.round(avgPM10_30Days * 10) / 10,
      trend: trend30
    },
    last12Months: {
      avgAQI: Math.round(avg12Months),
      avgPM25: Math.round(avgPM25_12Months * 10) / 10,
      avgPM10: Math.round(avgPM10_12Months * 10) / 10,
      trend: sortedMonths.length > 1 ? 
        calculateTrend(sortedMonths[sortedMonths.length - 1].avgAQI, sortedMonths[0].avgAQI) : 'stable'
    },
    bestTime,
    worstTime
  };
};
