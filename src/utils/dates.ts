/**
 * Date utilities with strict local calendar handling to avoid UTC shifts
 */

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateString: string): string {
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const d = new Date(year, month, day);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function isConsecutiveDay(prevDateStr: string, currDateStr: string): boolean {
  if (!prevDateStr || !currDateStr) return false;
  if (prevDateStr === currDateStr) return false;

  const prevParts = prevDateStr.split('-').map(Number);
  const currParts = currDateStr.split('-').map(Number);

  const prev = new Date(prevParts[0], prevParts[1] - 1, prevParts[2]);
  const curr = new Date(currParts[0], currParts[1] - 1, currParts[2]);

  const diffMs = curr.getTime() - prev.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays === 1;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
