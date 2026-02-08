export function getStudentType(studentId: string): 'natural' | 'social' {
  // Mock implementation: Replace with actual database or API call
  const studentDatabase = {
    'student1': 'natural',
    'student2': 'social',
    // Add more students as needed
  };

  return studentDatabase[studentId] || 'natural'; // Default to 'natural' for simplicity
}

export function validateStudentAccess(studentId: string, requestedType: 'natural' | 'social'): boolean {
  const studentType = getStudentType(studentId);
  return studentType === requestedType;
}