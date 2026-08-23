export const launchQuestionCount = 10;
export const calculateExamTimeLimitMinutes = (questionCount: number) => Math.ceil(questionCount * 120 / 50);
export const launchExamTimeLimitMinutes = calculateExamTimeLimitMinutes(launchQuestionCount);
export const launchMockTimeLimitMinutes = launchExamTimeLimitMinutes;
