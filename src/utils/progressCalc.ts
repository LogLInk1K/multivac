/**
 * 时间进度计算工具 - 供客户端 JS 实时调用
 * 所有进度数据在运行时动态计算，不依赖构建时静态值
 */

export interface ProgressItem {
  id: string;
  title: string;
  subtitle: string;
  progress: number;
  footerLeft: string;
  footerRight: string;
  icon: string;
}

export interface YearProgressData {
  yearProgress: number;
  daysLeft: number;
  currentYear: number;
}

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

// 图标 SVG path
const ICONS = {
  year: 'M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3 5H5v6h6V5z',
  quarter: 'M8 1.5a2.5 2.5 0 0 0-2.5 2.5c0 1.5 2.5 3.5 2.5 3.5s2.5-2 2.5-3.5A2.5 2.5 0 0 0 8 1.5zm0 13a2.5 2.5 0 0 1-2.5-2.5c0-1.5 2.5-3.5 2.5-3.5s2.5 2 2.5 3.5A2.5 2.5 0 0 1 8 14.5zM1.5 8a2.5 2.5 0 0 1 2.5-2.5c1.5 0 3.5 2.5 3.5 2.5s-2 2.5-3.5 2.5A2.5 2.5 0 0 1 1.5 8zm13 0a2.5 2.5 0 0 0-2.5-2.5c-1.5 0-3.5 2.5-3.5 2.5s2 2.5 3.5 2.5A2.5 2.5 0 0 0 14.5 8z',
  month: 'M14.53 10.53a7 7 0 0 1-9.06-9.06 7 7 0 1 0 9.06 9.06z',
  week: 'M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1.5A6.5 6.5 0 1 1 8 14.5a3.25 3.25 0 0 1 0-6.5 3.25 3.25 0 0 0 0-6.5zM8 3.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z',
  day: 'M4 6a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm11 9H1l5.5-8 3 4.5L12 9l3 6z',
};

/** 计算年进度数据（首页 MomentsTicker 使用） */
export function calcYearProgress(): YearProgressData {
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear + 1, 0, 1);
  const yearProgress = Math.floor(((now.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100);
  const daysLeft = Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { yearProgress, daysLeft, currentYear };
}

/** 计算所有进度项（progress 页使用） */
export function calcAllProgress(): ProgressItem[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentHour = now.getHours();

  // 年
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear + 1, 0, 1);
  const yearProgress = Math.floor(((now.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100);
  const daysPassed = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // 季度
  const currentQuarter = Math.floor(currentMonth / 3);
  const startOfQuarter = new Date(currentYear, currentQuarter * 3, 1);
  const endOfQuarter = new Date(currentYear, (currentQuarter + 1) * 3, 1);
  const quarterProgress = Math.floor(((now.getTime() - startOfQuarter.getTime()) / (endOfQuarter.getTime() - startOfQuarter.getTime())) * 100);
  const quarterDaysPassed = Math.floor((now.getTime() - startOfQuarter.getTime()) / (1000 * 60 * 60 * 24));
  const quarterDaysLeft = Math.ceil((endOfQuarter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // 月
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 1);
  const monthProgress = Math.floor(((now.getTime() - startOfMonth.getTime()) / (endOfMonth.getTime() - startOfMonth.getTime())) * 100);
  const monthDaysPassed = now.getDate();
  const monthDaysLeft = new Date(currentYear, currentMonth + 1, 0).getDate() - monthDaysPassed;

  // 周
  const dayOffset = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
  const weekProgress = Math.floor(((now.getTime() - startOfWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)) * 100);
  const weekDaysLeft = 7 - (dayOffset + 1);

  // 日
  const dayProgress = Math.floor((currentHour / 24) * 100);

  return [
    {
      id: 'year',
      title: '岁律',
      subtitle: `${currentYear} 年`,
      progress: yearProgress,
      footerLeft: `已过 ${daysPassed} 天`,
      footerRight: `余 ${daysLeft} 天`,
      icon: ICONS.year,
    },
    {
      id: 'quarter',
      title: '时节',
      subtitle: `第 ${currentQuarter + 1} 季度`,
      progress: quarterProgress,
      footerLeft: `已过 ${quarterDaysPassed} 天`,
      footerRight: `余 ${quarterDaysLeft} 天`,
      icon: ICONS.quarter,
    },
    {
      id: 'month',
      title: '月令',
      subtitle: `${currentMonth + 1} 月`,
      progress: monthProgress,
      footerLeft: `已过 ${monthDaysPassed} 天`,
      footerRight: `余 ${monthDaysLeft} 天`,
      icon: ICONS.month,
    },
    {
      id: 'week',
      title: '七曜',
      subtitle: '本周',
      progress: weekProgress,
      footerLeft: `星期${WEEKDAY_NAMES[dayOffset]}`,
      footerRight: `余 ${weekDaysLeft} 天`,
      icon: ICONS.week,
    },
    {
      id: 'day',
      title: '朝暮',
      subtitle: '今日',
      progress: dayProgress,
      footerLeft: `${String(currentHour).padStart(2, '0')}:00`,
      footerRight: '--',
      icon: ICONS.day,
    },
  ];
}
