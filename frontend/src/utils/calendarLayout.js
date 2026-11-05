/**
 * Calendar layout geometry & collision stacking algorithm
 * 80px per hour, 20px per 15-minute slot
 */

export const HOUR_HEIGHT = 80;
export const SLOT_HEIGHT = 20; // 15 min = 80px / 4
export const TOTAL_MINUTES_IN_DAY = 24 * 60; // 1440
export const TOTAL_DAY_HEIGHT = 24 * HOUR_HEIGHT; // 1920px

export const PRIORITY_CONFIG = {
  5: {
    label: 'High',
    color: '#EF4444',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
    borderClass: 'border-l-[#EF4444]',
    dotClass: 'bg-red-500',
  },
  3: {
    label: 'Medium',
    color: '#F59E0B',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    borderClass: 'border-l-[#F59E0B]',
    dotClass: 'bg-amber-500',
  },
  1: {
    label: 'Low',
    color: '#3B82F6',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    borderClass: 'border-l-[#3B82F6]',
    dotClass: 'bg-blue-500',
  },
  0: {
    label: 'None',
    color: '#9CA3AF',
    badgeClass: 'bg-neutral-500/15 text-neutral-300 border-neutral-600/30',
    borderClass: 'border-l-[#9CA3AF]',
    dotClass: 'bg-neutral-400',
  },
};

export const getPriorityMeta = (priority) => {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[0];
};

/**
 * Snap minutes to 15-minute intervals (clamped between 0 and 1425)
 */
export const snapTo15Minutes = (minutes) => {
  const snapped = Math.round(minutes / 15) * 15;
  return Math.max(0, Math.min(TOTAL_MINUTES_IN_DAY - 15, snapped));
};

/**
 * Convert pixel Y offset to snapped minutes
 */
export const offsetYToSnappedMinutes = (offsetY) => {
  const slotIndex = Math.floor(offsetY / SLOT_HEIGHT);
  const minutes = slotIndex * 15;
  return Math.max(0, Math.min(TOTAL_MINUTES_IN_DAY - 15, minutes));
};

/**
 * Convert minutes to pixel top
 */
export const minutesToPixels = (minutes) => {
  return (minutes / 60) * HOUR_HEIGHT;
};

/**
 * Format a Date object or ISO string to HH:MM (24-hour)
 */
export const formatTime24 = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format a Date object to AM/PM string
 */
export const formatTime12 = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const minStr = m < 10 ? `0${m}` : m;
  return `${hour12}:${minStr} ${ampm}`;
};

/**
 * Format time range "10:00 - 11:30"
 */
export const formatTimeRange = (startDate, dueDate) => {
  const startStr = formatTime24(startDate);
  const endStr = formatTime24(dueDate);
  if (!startStr) return '';
  return endStr ? `${startStr} - ${endStr}` : startStr;
};

/**
 * Check if two dates represent the exact same calendar day
 */
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Create a new Date with hours and minutes set on a given base date
 */
export const setHoursAndMinutes = (baseDate, totalMinutes) => {
  const d = new Date(baseDate);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  d.setHours(hours, mins, 0, 0);
  return d;
};

/**
 * Get array of 7 dates for the Monday-to-Sunday week containing targetDate
 */
export const getWeekDays = (targetDate) => {
  const d = new Date(targetDate);
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    days.push(nextDay);
  }
  return days;
};

/**
 * Collision Stacking Algorithm
 * Groups overlapping events in a single day into clusters,
 * assigns lanes 0..k-1, and calculates widthPercent & leftPercent
 */
export const computeDayLayout = (events, dayDate) => {
  if (!events || events.length === 0) return [];

  const dayStart = new Date(dayDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayDate);
  dayEnd.setHours(23, 59, 59, 999);

  const dayEvents = events.filter((evt) => {
    if (!evt.startDate) return false;
    const start = new Date(evt.startDate);
    const due = evt.dueDate ? new Date(evt.dueDate) : new Date(start.getTime() + 30 * 60000);
    return start <= dayEnd && due >= dayStart;
  });

  if (dayEvents.length === 0) return [];

  // Normalize event time boundaries for this 24-hour day
  const normalized = dayEvents.map((evt) => {
    const start = new Date(evt.startDate);
    let due = evt.dueDate ? new Date(evt.dueDate) : new Date(start.getTime() + 30 * 60000);

    let startMinutes = isSameDay(start, dayDate)
      ? start.getHours() * 60 + start.getMinutes()
      : 0;

    let endMinutes = isSameDay(due, dayDate)
      ? due.getHours() * 60 + due.getMinutes()
      : 1440;

    if (endMinutes <= startMinutes) {
      endMinutes = Math.min(1440, startMinutes + 15);
    }

    return {
      event: evt,
      startMinutes,
      endMinutes,
      durationMinutes: endMinutes - startMinutes,
    };
  });

  // Sort by startMinutes ascending, then by duration descending
  normalized.sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    return b.durationMinutes - a.durationMinutes;
  });

  // Cluster overlapping events
  const clusters = [];
  let currentCluster = [];
  let clusterEnd = -1;

  normalized.forEach((item) => {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endMinutes;
    } else if (item.startMinutes < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMinutes);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.endMinutes;
    }
  });
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Assign lanes within each cluster
  const layout = [];

  clusters.forEach((cluster) => {
    const lanes = [];

    cluster.forEach((item) => {
      let placedLane = -1;

      for (let l = 0; l < lanes.length; l++) {
        if (lanes[l] <= item.startMinutes) {
          placedLane = l;
          lanes[l] = item.endMinutes;
          break;
        }
      }

      if (placedLane === -1) {
        placedLane = lanes.length;
        lanes.push(item.endMinutes);
      }

      item.lane = placedLane;
    });

    const totalLanes = lanes.length;
    const widthPercent = 100 / totalLanes;

    cluster.forEach((item) => {
      const top = (item.startMinutes / 60) * HOUR_HEIGHT;
      const height = Math.max(20, (item.durationMinutes / 60) * HOUR_HEIGHT);
      const leftPercent = item.lane * widthPercent;

      layout.push({
        event: item.event,
        startMinutes: item.startMinutes,
        endMinutes: item.endMinutes,
        durationMinutes: item.durationMinutes,
        top,
        height,
        leftPercent,
        widthPercent,
        lane: item.lane,
        totalLanes,
      });
    });
  });

  return layout;
};
