import React, { useState } from 'react';
import { 
  PieChart as RechartPieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

/**
 * PieChart component for visualizing proportional data
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.data - Array of data points to be plotted
 * @param {Object} [props.options] - Additional chart configuration options
 * @param {string} [props.className] - Additional CSS classes for the chart container
 * @param {number} [props.height] - Height of the chart
 * @param {function} [props.onSegmentClick] - Click handler for pie segments
 */
const PieChart = ({ 
  data = [], 
  options = {},
  className = '',
  height = 300,
  onSegmentClick
}) => {
  // State to track active segment
  const [activeIndex, setActiveIndex] = useState(null);

  // Default chart configuration options
  const defaultOptions = {
    innerRadius: '40%',
    outerRadius: '70%',
    showTooltip: true,
    showLegend: true,
    animationDuration: 400,
    animationEasing: 'ease',
    title: ''
  };

  // Merge default options with provided options
  const chartOptions = { ...defaultOptions, ...options };

  // Color palette with good contrast
  const COLORS = [
    '#0088FE', // Blue
    '#00C49F', // Turquoise
    '#FFBB28', // Yellow
    '#FF8042', // Orange
    '#8884D8', // Purple
    '#FF4560', // Pink
    '#475569', // Slate
  ];

  // Handle segment click
  const handleSegmentClick = (data, index) => {
    setActiveIndex(activeIndex === index ? null : index);
    
    if (onSegmentClick) {
      onSegmentClick(data, index);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {chartOptions.title && (
        <h3 className="text-center text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          {chartOptions.title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartPieChart>
          <Pie
            data={data}
            innerRadius={chartOptions.innerRadius}
            outerRadius={chartOptions.outerRadius}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
            activeIndex={activeIndex}
            activeShape={{
              stroke: 'black',
              strokeWidth: 2,
              fillOpacity: 0.8
            }}
            onClick={handleSegmentClick}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          
          {/* Conditional Tooltip */}
          {chartOptions.showTooltip && (
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
              }}
              formatter={(value, name, props) => [
                `${value} (${((value / props.payload.total) * 100).toFixed(1)}%)`, 
                name
              ]}
            />
          )}
          
          {/* Conditional Legend */}
          {chartOptions.showLegend && (
            <Legend 
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ 
                paddingTop: '20px',
                color: 'rgba(0,0,0,0.7)' 
              }}
            />
          )}
        </RechartPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;