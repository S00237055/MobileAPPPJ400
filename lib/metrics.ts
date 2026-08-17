export interface FoodLogEntry {
  calories: number;
  proteinGrams: number;
  carbsGrams?: number;
  fatGrams?: number;
  dateEaten: string;
}

export interface WeeklyTotals {
  weekStart: string;
  rawDate: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WorkoutSetEntry {
  weightKg: number;
  reps: number;
}

export function startOfWeek(input: Date | string): Date {
  const date = new Date(input);
  const day = date.getDay() || 7;
  date.setHours(-24 * (day - 1), 0, 0, 0);
  return date;
}

export function aggregateByWeek(logs: FoodLogEntry[]): WeeklyTotals[] {
  const weeklyData: Record<string, WeeklyTotals> = {};

  logs.forEach((log) => {
    const weekStartDate = startOfWeek(log.dateEaten);
    const weekStart = weekStartDate.toLocaleDateString();

    if (!weeklyData[weekStart]) {
      weeklyData[weekStart] = {
        weekStart,
        rawDate: weekStartDate.toISOString(),
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    }
    weeklyData[weekStart].calories += log.calories;
    weeklyData[weekStart].protein += log.proteinGrams;
    weeklyData[weekStart].carbs += log.carbsGrams || 0;
    weeklyData[weekStart].fat += log.fatGrams || 0;
  });

  return Object.values(weeklyData).sort(
    (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
  );
}

export function sumMacros(logs: FoodLogEntry[]) {
  return {
    calories: logs.reduce((sum, log) => sum + log.calories, 0),
    protein: logs.reduce((sum, log) => sum + log.proteinGrams, 0),
    carbs: logs.reduce((sum, log) => sum + (log.carbsGrams || 0), 0),
    fat: logs.reduce((sum, log) => sum + (log.fatGrams || 0), 0),
  };
}

export function calculateVolume(sets: WorkoutSetEntry[]): number {
  return sets.reduce((total, set) => total + set.weightKg * set.reps, 0);
}

export function calculateTotalReps(sets: WorkoutSetEntry[]): number {
  return sets.reduce((total, set) => total + set.reps, 0);
}


export function parseDurationMinutes(notes?: string | null): number {
  if (!notes || !notes.includes('Duration:')) {
    return 0;
  }

  const match = notes.match(/Duration: (\d+):(\d+)/);
  if (!match) {
    return 0;
  }

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);

  return Math.max(1, Math.ceil(minutes + seconds / 60));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function getSafetyStatus(novaGroup?: number): { label: string; color: string } {
  switch (novaGroup) {
    case 1:
      return { label: '✅ Natural / Unprocessed', color: '#4CAF50' };
    case 2:
      return { label: '⚠️ Processed Culinary Ingredient', color: '#8BC34A' };
    case 3:
      return { label: '⚠️ Processed Food', color: '#FFC107' };
    case 4:
      return { label: '❌ Ultra-Processed', color: '#F44336' };
    default:
      return { label: '❓ Unknown Processing Level', color: '#9E9E9E' };
  }
}

export function resolveProductName(product: {
  product_name_en?: string;
  product_name?: string;
}): string {
  return product.product_name_en || product.product_name || 'Unknown Product';
}

export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 3,
  backoff = 1000
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, backoff * (i + 1)));
    }
  }
}
