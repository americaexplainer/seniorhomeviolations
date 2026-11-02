/**
 * Safety Report Card Grade Calculator
 *
 * Composite score (0-100) based on:
 *   - CMS Overall Rating (1-5 stars):          25 points
 *   - Health Inspection Rating (1-5):           20 points
 *   - Staffing Rating (1-5):                    15 points
 *   - Health citation severity score vs state:  15 points
 *   - Fire safety citation count vs state:      10 points
 *   - Fine penalty magnitude:                   15 points
 */

export interface GradeInput {
  overallRating: number;       // 1-5 (0 = missing)
  healthRating: number;        // 1-5 (0 = missing)
  staffingRating: number;      // 1-5 (0 = missing)
  healthCitationCount: number;
  healthSeverityScore: number; // weighted sum of severity codes
  fireCitationCount: number;
  totalFines: number;
  stateAvgHealthDeficiencies: number;
  stateAvgFireDeficiencies: number;
  stateAvgFineAmount: number;
}

/** Map CMS scope/severity code to a numeric weight */
export function severityWeight(code: string): number {
  if (!code) return 1;
  const c = code.toUpperCase();
  if ('ABC'.includes(c)) return 1;
  if ('DEF'.includes(c)) return 2;
  if ('GHI'.includes(c)) return 4;
  if ('JKL'.includes(c)) return 8;
  return 1;
}

export function calculateScore(input: GradeInput): number {
  // 1. CMS Overall Rating → 0-25 points
  const overallPts = input.overallRating > 0
    ? (input.overallRating / 5) * 25
    : 10; // default to middle if missing

  // 2. Health Inspection Rating → 0-20 points
  const healthPts = input.healthRating > 0
    ? (input.healthRating / 5) * 20
    : 8;

  // 3. Staffing Rating → 0-15 points
  const staffingPts = input.staffingRating > 0
    ? (input.staffingRating / 5) * 15
    : 6;

  // 4. Health citation severity vs state average → 0-15 points
  //    Fewer/less severe = more points
  const stateAvgDef = Math.max(input.stateAvgHealthDeficiencies, 1);
  const citationRatio = input.healthCitationCount / stateAvgDef;
  const citationPts = Math.max(0, Math.min(15, 15 * (1 - (citationRatio - 1) * 0.3)));

  // 5. Fire safety vs state average → 0-10 points
  const stateAvgFire = Math.max(input.stateAvgFireDeficiencies, 1);
  const fireRatio = input.fireCitationCount / stateAvgFire;
  const firePts = Math.max(0, Math.min(10, 10 * (1 - (fireRatio - 1) * 0.3)));

  // 6. Fines → 0-15 points (no fines = full points, scales down)
  let finePts = 15;
  if (input.totalFines > 0) {
    const stateAvgFine = Math.max(input.stateAvgFineAmount, 1);
    const fineRatio = input.totalFines / stateAvgFine;
    finePts = Math.max(0, 15 * (1 - fineRatio * 0.25));
  }

  return Math.round(
    Math.max(0, Math.min(100, overallPts + healthPts + staffingPts + citationPts + firePts + finePts))
  );
}

export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'F';

export function scoreToGrade(score: number): Grade {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D+';
  if (score >= 45) return 'D';
  if (score >= 40) return 'D-';
  return 'F';
}

export function gradeColor(grade: Grade): string {
  if (grade.startsWith('A')) return 'text-green-700 bg-green-100 border-green-300';
  if (grade.startsWith('B')) return 'text-blue-700 bg-blue-100 border-blue-300';
  if (grade.startsWith('C')) return 'text-amber-700 bg-amber-100 border-amber-300';
  if (grade.startsWith('D')) return 'text-orange-700 bg-orange-100 border-orange-300';
  return 'text-red-700 bg-red-100 border-red-300';
}

export function gradeBgClass(grade: Grade): string {
  if (grade.startsWith('A')) return 'bg-green-600';
  if (grade.startsWith('B')) return 'bg-blue-600';
  if (grade.startsWith('C')) return 'bg-amber-500';
  if (grade.startsWith('D')) return 'bg-orange-500';
  return 'bg-red-600';
}
