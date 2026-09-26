import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import DashboardChart from '../components/dashboard/DashboardChart';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState('Tháng này');

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-screen-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: '#1a1a2e' }}>
              Tổng quan hệ thống
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Theo dõi các số liệu hoạt động chính</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: '#475569' }}>Thời gian:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-medium border outline-none bg-white transition-colors hover:bg-slate-50 cursor-pointer"
              style={{ borderColor: '#e2e8f0', color: '#1a1a2e' }}>
              <option>Hôm nay</option>
              <option>Tuần này</option>
              <option>Tháng này</option>
              <option>Năm học 25-26</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
          <StatCard
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5" />}
            label="Sự kiện đang diễn ra"
            value="12"
            change="2"
            changePositive={true}
            color="#4f46e5"
            bg="#eef2ff"
          />
          <StatCard
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />}
            label="Tổng người tham gia"
            value="1,452"
            change="12%"
            changePositive={true}
            color="#0891b2"
            bg="#ecfeff"
          />
          <StatCard
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />}
            label="Tỉ lệ điểm danh"
            value="85.4%"
            change="3.1%"
            changePositive={true}
            color="#059669"
            bg="#dcfce7"
          />
          <StatCard
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />}
            label="Đánh giá trung bình"
            value="4.8/5"
            change="0.2"
            changePositive={false}
            color="#d97706"
            bg="#fef3c7"
          />
        </div>

        <DashboardChart />
      </div>
    </DashboardLayout>
  );
}