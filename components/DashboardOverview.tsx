import React from 'react';
import { Line } from 'react-chartjs-2';

const DashboardOverview: React.FC = () => {
  const metrics = [
    { label: 'Total Students', value: 1200 },
    { label: 'Total Teachers', value: 75 },
    { label: 'Active Courses', value: 50 },
    { label: 'Total Assignments', value: 300 },
  ];

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Student Enrollment Trends',
        data: [100, 200, 300, 400, 500],
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div className="p-8 bg-white border border-slate-100 rounded-m3-2xl shadow-m3-2">
      <h2 className="text-xl font-bold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="p-4 bg-gray-100 rounded-lg shadow">
            <p className="text-sm text-gray-500">{metric.label}</p>
            <p className="text-2xl font-bold">{metric.value}</p>
          </div>
        ))}
      </div>
      <div>
        <h3 className="text-lg font-bold mb-4">Visual Analytics</h3>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default DashboardOverview;