import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa';
import PropTypes from 'prop-types';

const PricingCard = ({
  name,
  price,
  period = 'month',
  description = '',
  features = [],
  cta = 'Get Started',
  ctaLink = '/register',
  popular = false,
  highlight = false,
  delay = 0
}) => {
  return (
    <motion.div
      className={`
        relative rounded-lg overflow-hidden
        ${highlight ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200' : 'bg-white border border-gray-200'}
        ${popular ? 'shadow-xl' : 'shadow-md'}
        transition-all duration-300 hover:shadow-lg hover:translate-y-[-4px]
      `}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      {/* Popular badge */}
      {popular && (
        <div className="absolute top-0 right-0 left-0 bg-indigo-600 text-white text-sm font-medium text-center py-1">
          Most Popular
        </div>
      )}

      <div className={`p-6 ${popular ? 'pt-10' : ''}`}>
        {/* Plan name and description */}
        <h3 className={`text-xl font-bold mb-1 ${highlight ? 'text-purple-800' : 'text-gray-900'}`}>
          {name}
        </h3>
        
        {description && (
          <p className={`text-sm mb-4 ${highlight ? 'text-purple-600' : 'text-gray-500'}`}>
            {description}
          </p>
        )}
        
        {/* Price */}
        <div className="flex items-baseline mb-5">
          <span className="text-4xl font-extrabold">
            ${typeof price === 'number' ? price.toLocaleString() : price}
          </span>
          <span className="text-gray-500 ml-1 text-lg">/{period}</span>
        </div>
        
        {/* Features list */}
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <FaCheck className={`mt-1 mr-2 flex-shrink-0 ${highlight ? 'text-purple-500' : 'text-green-500'}`} />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* CTA button */}
        <Link
          to={ctaLink}
          className={`
            block w-full py-3 px-4 text-center rounded-md font-medium 
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
            ${highlight
              ? 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500'
              : popular
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500'
                : 'bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500'
            }
          `}
        >
          {cta}
        </Link>
      </div>
    </motion.div>
  );
};

PricingCard.propTypes = {
  name: PropTypes.string.isRequired,
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  period: PropTypes.string,
  description: PropTypes.string,
  features: PropTypes.arrayOf(PropTypes.string),
  cta: PropTypes.string,
  ctaLink: PropTypes.string,
  popular: PropTypes.bool,
  highlight: PropTypes.bool,
  delay: PropTypes.number
};

export default PricingCard;