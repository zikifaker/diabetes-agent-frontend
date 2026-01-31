export const EXERCISE_TYPE_OPTIONS = [
  { value: 'aerobic', label: '有氧' },
  { value: 'strength', label: '力量' },
  { value: 'flexibility', label: '柔韧' },
  { value: 'other', label: '其他' }
]

export const EXERCISE_INTENSITY_OPTIONS = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中等' },
  { value: 'high', label: '高' }
]

export function getExerciseTypeLabel(value) {
  const found = EXERCISE_TYPE_OPTIONS.find(opt => opt.value === value)
  return found.label
}

export function getExerciseIntensityLabel(value) {
  const found = EXERCISE_INTENSITY_OPTIONS.find(opt => opt.value === value)
  return found.label
}
