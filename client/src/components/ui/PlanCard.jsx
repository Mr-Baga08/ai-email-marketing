import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';

const PlanCard = ({
  id,
  name,
  price,
  period = 'month',
  features = [],
  recommended = false,
  selected = false,
  onSelect,
  cta = 'Select Plan',
  highlight = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className={`
        relative rounded-lg shadow-md overflow-hidden transition-all duration-300
        ${selected ? 'ring-2 ring-indigo-500 shadow-lg transform scale-[1.02]' : 'hover:shadow-lg'}
        ${highlight ? 'border-2 border-purple-400 bg-purple-50' : 'border border-gray-200 bg-white'}
      `}
      onClick={() => onSelect && onSelect(id)}
    >
      {/* Recommended badge */}
      {recommended && (
        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
          Recommended
        </div>
      )}

      {/* Plan header */}
      <div className={`pt-6 pb-4 px-6 ${highlight ? 'bg-purple-100' : ''}`}>
        <h3 className={`text-xl font-bold mb-1 ${highlight ? 'text-purple-800' : 'text-gray-900'}`}>
          {name}
        </h3>
        
        {/* Price */}
        <div className="flex items-baseline mb-2">
          <span className="text-3xl font-extrabold">
            ${typeof price === 'number' ? price.toLocaleString() : price}
          </span>
          <span className="text-gray-500 ml-1">/{period}</span>
        </div>
        
        {/* Description (optional) */}
        {highlight && (
          <p className="text-sm text-purple-700 mb-2">Add advanced AI capabilities to any plan</p>
        )}
      </div>

      {/* Features list */}
      <div className="px-6 pb-8">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <FaCheck className={`mt-1 mr-2 flex-shrink-0 ${highlight ? 'text-purple-600' : 'text-indigo-500'}`} />
              <span className="text-gray-700 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Call to action */}
      <div className="px-6 pb-6 pt-2">
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect && onSelect(id);
          }}
          className={`
            w-full rounded-md py-2 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2
            ${selected ? 'bg-indigo-700 hover:bg-indigo-800 text-white focus:ring-indigo-500' : 
              highlight ? 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500' :
              'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 focus:ring-indigo-500'}
          `}
        >
          {cta}
        </button>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute inset-x-0 top-0 h-1 bg-indigo-500"></div>
      )}
    </motion.div>
  );
};

PlanCard.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  period: PropTypes.string,
  features: PropTypes.arrayOf(PropTypes.string),
  recommended: PropTypes.bool,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  cta: PropTypes.string,
  highlight: PropTypes.bool
};

export default PlanCard;