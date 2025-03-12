import React from 'react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon, title, description, color = 'blue', delay = 0 }) => {
  // Get the appropriate color classes based on the color prop
  const getColorClasses = () => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        title: 'text-blue-800'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        title: 'text-purple-800'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        title: 'text-green-800'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        title: 'text-orange-800'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        title: 'text-red-800'
      },
      indigo: {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        title: 'text-indigo-800'
      },
      teal: {
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        iconBg: 'bg-teal-100',
        iconColor: 'text-teal-600',
        title: 'text-teal-800'
      }
    };

    return colorMap[color] || colorMap.blue; // Default to blue if color is not found
  };

  const colorClasses = getColorClasses();

  return (
    <motion.div
      className={`rounded-xl ${colorClasses.bg} border ${colorClasses.border} p-6 shadow-sm transition-all hover:shadow-md`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <div className={`mb-4 inline-flex rounded-lg p-3 ${colorClasses.iconBg}`}>
        <span className={colorClasses.iconColor}>{icon}</span>
      </div>
      
      <h3 className={`mb-3 text-xl font-bold ${colorClasses.title}`}>{title}</h3>
      
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;