import React from 'react';
import { 
  LineChart as RechartLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

/**
 * LineChart component for displaying time-series or comparative data
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data points to be plotted
 * @param {Array} [props.lines] - Configuration for multiple lines
 * @param {Object} [props.options] - Additional chart configuration options
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.height] - Chart height
 */ 
const LineChart = ({ 
  data = [], 
  lines = [
    { dataKey: 'value', stroke: '#8884d8', name: 'Value' }
  ],
  options = {},
  className = '',
  height = 300
}) => {
  // Default options with ability to override
  const defaultOptions = {
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
    animationDuration: 500,
    animationEasing: 'ease',
    showGridLines: true,
    showTooltip: true,
    showLegend: true,
  };

  const chartOptions = { ...defaultOptions, ...options };

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartLineChart
          data={data}
          margin={chartOptions.margin}
        >
          {chartOptions.showGridLines && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(0,0,0,0.1)"
            />
          )}
          
          <XAxis 
            dataKey="name" 
            tick={{ fill: 'rgba(0,0,0,0.6)' }}
          />
          
          <YAxis 
            tick={{ fill: 'rgba(0,0,0,0.6)' }}
          />
          
          {chartOptions.showTooltip && (
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
              }}
            />
          )}
          
          {chartOptions.showLegend && (
            <Legend 
              verticalAlign="top" 
              height={36}
            />
          )}
          
          {lines.map((line, index) => (
            <Line
              key={line.dataKey || index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke || `hsl(${index * 60}, 70%, 50%)`}
              name={line.name}
              activeDot={{ r: 8 }}
              {...line.props}
            />
          ))}
        </RechartLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;