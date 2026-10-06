import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const PIE_COLORS = [
  '#4f46e5',
  '#0891b2',
  '#7c3aed',
  '#059669',
  '#d97706',
  '#db2777',
  '#65a30d',
];

export default function DashboardChart({
  analytics,
}) {
  if (!analytics) {
    return null;
  }

  // =========================================================
  // BAR CHART
  // Gói 6: Tỷ lệ lấp đầy + tỷ lệ check-in
  // =========================================================
  const attendanceData = [
    {
      name: 'Lấp đầy',
      value: Number(
        analytics.fillRate ?? 0
      ),
    },
    {
      name: 'Check-in',
      value: Number(
        analytics.checkInRate ?? 0
      ),
    },
  ];

  // =========================================================
  // PIE CHART
  // Phân bổ người đăng ký theo khoa
  // =========================================================
  const facultyData = Array.isArray(
    analytics.facultyDistribution
  )
    ? analytics.facultyDistribution
    : [];

  // =========================================================
  // LINE CHART
  // Xu hướng đăng ký theo tháng
  // =========================================================
  const monthlyData = Array.isArray(
    analytics.monthlyRegistrations
  )
    ? analytics.monthlyRegistrations
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">

      {/* =====================================================
          BAR CHART
      ===================================================== */}
      <div
        className="lg:col-span-2 bg-white rounded-2xl p-5 lg:p-6 shadow-sm border"
        style={{
          borderColor: '#f1f5f9',
        }}
      >
        <h2
          className="font-semibold text-base mb-1"
          style={{
            fontFamily:
              'var(--font-display)',
            color: '#1a1a2e',
          }}
        >
          Tỷ lệ tham dự
        </h2>

        <p
          className="text-xs mb-5"
          style={{
            color: '#94a3b8',
          }}
        >
          {analytics.eventName ||
            'Sự kiện đang chọn'}
        </p>

        <ResponsiveContainer
          width="100%"
          height={240}
        >
          <BarChart
            data={attendanceData}
            barCategoryGap="40%"
            margin={{
              top: 10,
              right: 10,
              left: -10,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{
                fontSize: 11,
                fill: '#94a3b8',
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={[0, 100]}
              tick={{
                fontSize: 10,
                fill: '#94a3b8',
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                `${value}%`
              }
            />

            <Tooltip
              formatter={(value) => [
                `${value}%`,
                'Tỷ lệ',
              ]}
              contentStyle={{
                borderRadius: 10,
                border: 'none',
                boxShadow:
                  '0 4px 16px rgba(0,0,0,0.08)',
                fontSize: 12,
              }}
            />

            <Bar
              dataKey="value"
              fill="#4f46e5"
              radius={[5, 5, 0, 0]}
              maxBarSize={90}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* CHI TIẾT */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <p
              className="text-xs"
              style={{
                color: '#94a3b8',
              }}
            >
              Sức chứa
            </p>

            <p
              className="font-semibold mt-1"
              style={{
                color: '#1a1a2e',
              }}
            >
              {analytics.capacity ?? 0}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p
              className="text-xs"
              style={{
                color: '#94a3b8',
              }}
            >
              Đã đăng ký
            </p>

            <p
              className="font-semibold mt-1"
              style={{
                color: '#1a1a2e',
              }}
            >
              {analytics.registrations ?? 0}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p
              className="text-xs"
              style={{
                color: '#94a3b8',
              }}
            >
              Đã check-in
            </p>

            <p
              className="font-semibold mt-1"
              style={{
                color: '#1a1a2e',
              }}
            >
              {analytics.checkIns ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          PIE CHART - PHÂN BỔ THEO KHOA
      ===================================================== */}
      <div
        className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border"
        style={{
          borderColor: '#f1f5f9',
        }}
      >
        <h2
          className="font-semibold text-base mb-1"
          style={{
            fontFamily:
              'var(--font-display)',
            color: '#1a1a2e',
          }}
        >
          Phân bổ theo khoa
        </h2>

        <p
          className="text-xs mb-3"
          style={{
            color: '#94a3b8',
          }}
        >
          Tỷ lệ người đăng ký theo khoa
        </p>

        {facultyData.length > 0 ? (
          <>
            <ResponsiveContainer
              width="100%"
              height={160}
            >
              <PieChart>
                <Pie
                  data={facultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {facultyData.map(
                    (item, index) => (
                      <Cell
                        key={`${item.name}-${index}`}
                        fill={
                          PIE_COLORS[
                            index %
                              PIE_COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  formatter={(
                    value,
                    name,
                    props
                  ) => {
                    const count =
                      props?.payload
                        ?.count ?? 0;

                    return [
                      `${value}% (${count} lượt)`,
                      'Đăng ký',
                    ];
                  }}
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow:
                      '0 4px 16px rgba(0,0,0,0.08)',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 mt-2">
              {facultyData.map(
                (item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background:
                            PIE_COLORS[
                              index %
                                PIE_COLORS.length
                            ],
                        }}
                      />

                      <span
                        className="text-xs truncate"
                        style={{
                          color:
                            '#475569',
                        }}
                        title={item.name}
                      >
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-xs"
                        style={{
                          color:
                            '#94a3b8',
                        }}
                      >
                        {item.count ?? 0}
                      </span>

                      <span
                        className="text-xs font-medium"
                        style={{
                          fontFamily:
                            'var(--font-mono)',
                          color:
                            '#1a1a2e',
                        }}
                      >
                        {item.value ?? 0}%
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        ) : (
          <div
            className="flex items-center justify-center h-48 text-sm"
            style={{
              color: '#94a3b8',
            }}
          >
            Chưa có dữ liệu khoa
          </div>
        )}
      </div>

      {/* =====================================================
          LINE CHART - XU HƯỚNG ĐĂNG KÝ
      ===================================================== */}
      <div
        className="lg:col-span-3 bg-white rounded-2xl p-5 lg:p-6 shadow-sm border"
        style={{
          borderColor: '#f1f5f9',
        }}
      >
        <h2
          className="font-semibold text-base mb-1"
          style={{
            fontFamily:
              'var(--font-display)',
            color: '#1a1a2e',
          }}
        >
          Xu hướng đăng ký theo thời gian
        </h2>

        <p
          className="text-xs mb-5"
          style={{
            color: '#94a3b8',
          }}
        >
          Lượt đăng ký theo tháng của sự kiện
        </p>

        {monthlyData.length > 0 ? (
          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <LineChart
              data={monthlyData}
              margin={{
                top: 10,
                right: 12,
                left: -16,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{
                  fontSize: 11,
                  fill: '#94a3b8',
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 11,
                  fill: '#94a3b8',
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value) => [
                  `${value} lượt`,
                  'Đăng ký',
                ]}
                contentStyle={{
                  borderRadius: 10,
                  border: 'none',
                  boxShadow:
                    '0 4px 16px rgba(0,0,0,0.08)',
                  fontSize: 12,
                }}
              />

              <Line
                type="monotone"
                dataKey="registrations"
                stroke="#4f46e5"
                strokeWidth={2.5}
                dot={{
                  fill: '#4f46e5',
                  r: 4,
                  strokeWidth: 2,
                  stroke: '#ffffff',
                }}
                activeDot={{
                  r: 6,
                  fill: '#4f46e5',
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div
            className="flex items-center justify-center h-52 text-sm"
            style={{
              color: '#94a3b8',
            }}
          >
            Chưa có dữ liệu đăng ký theo tháng
          </div>
        )}
      </div>

    </div>
  );
}