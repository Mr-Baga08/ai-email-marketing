import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

const FeatureList = ({ features, iconColor = 'text-green-500', textColor = 'text-gray-700' }) => {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-2">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <FaCheckCircle className={`${iconColor} mt-1 mr-2 flex-shrink-0`} />
          <span className={textColor}>{feature}</span>
        </li>
      ))}
    </ul>
  );
};

export default FeatureList;