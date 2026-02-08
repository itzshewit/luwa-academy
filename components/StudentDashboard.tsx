import React from 'react';

const StudentDashboard: React.FC = () => {
  const overviewCards = [
    { label: 'Total Courses Enrolled', value: 5 },
    { label: 'Pending Assignments', value: 3 },
    { label: 'Current GPA', value: '3.8' },
    { label: 'Attendance Percentage', value: '92%' },
    { label: 'Study Streak', value: '15 days' },
  ];

  const activityStream = [
    'New announcement: Midterm exams next week.',
    'Assignment graded: Math Homework #3.',
    'New course material added: Physics Chapter 4.',
    'Upcoming event: Science Fair on March 15.',
  ];

  const todaysSchedule = [
    { time: '9:00 AM', event: 'Math Class (Live)', link: '#' },
    { time: '11:00 AM', event: 'Physics Study Session', link: '#' },
    { time: '2:00 PM', event: 'Assignment Due: History Essay', link: '#' },
  ];

  const progressOverview = [
    { course: 'Mathematics', progress: 80 },
    { course: 'Physics', progress: 60 },
    { course: 'English', progress: 90 },
  ];

  const quickActions = [
    { label: 'Submit Assignment', action: () => alert('Submit Assignment') },
    { label: 'Join Live Class', action: () => alert('Join Live Class') },
    { label: 'View Grades', action: () => alert('View Grades') },
    { label: 'Message Teacher', action: () => alert('Message Teacher') },
    { label: 'Access Library', action: () => alert('Access Library') },
  ];

  const badges = [
    { id: 1, name: 'Assignment Master', description: 'Completed 10 assignments on time' },
    { id: 2, name: 'Perfect Attendance', description: '100% attendance this month' },
    { id: 3, name: 'Top Scorer', description: 'Achieved the highest score in a quiz' },
  ];

  const greeting = `Welcome back, Scholar! Keep up the great work!`;

  return (
    <div className="p-8 bg-white border border-slate-100 rounded-m3-2xl shadow-m3-2 space-y-8">
      {/* Personalized Greeting */}
      <div className="p-4 bg-blue-100 rounded-lg shadow">
        <h2 className="text-xl font-bold text-blue-700">{greeting}</h2>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        {overviewCards.map((card, index) => (
          <div key={index} className="p-4 bg-gray-100 rounded-lg shadow">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Activity Stream */}
      <div>
        <h3 className="text-lg font-bold mb-4">Activity Stream</h3>
        <ul className="list-disc pl-5">
          {activityStream.map((activity, index) => (
            <li key={index} className="text-sm text-gray-700 mb-2">
              {activity}
            </li>
          ))}
        </ul>
      </div>

      {/* Today's Schedule */}
      <div>
        <h3 className="text-lg font-bold mb-4">Today's Schedule</h3>
        <ul className="space-y-2">
          {todaysSchedule.map((item, index) => (
            <li key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg shadow">
              <span className="text-sm font-bold text-gray-700">{item.time}</span>
              <a href={item.link} className="text-sm text-blue-500 underline">{item.event}</a>
            </li>
          ))}
        </ul>
      </div>

      {/* Progress Overview */}
      <div>
        <h3 className="text-lg font-bold mb-4">Progress Overview</h3>
        <div className="space-y-4">
          {progressOverview.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                <span>{item.course}</span>
                <span>{item.progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gamification - Badges */}
      <div>
        <h3 className="text-lg font-bold mb-4">Achievements</h3>
        <ul className="space-y-3">
          {badges.map((badge) => (
            <li key={badge.id} className="p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg">
              <p className="text-sm font-bold text-yellow-700">🏆 {badge.name}</p>
              <p className="text-xs text-yellow-600">{badge.description}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="p-4 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;