// TestimonialCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaQuoteLeft } from 'react-icons/fa';

const TestimonialCard = ({ quote, author, title, company, delay = 0 }) => {
  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow-md"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      <div className="mb-4 text-indigo-500">
        <FaQuoteLeft size={24} />
      </div>
      
      <p className="text-gray-700 mb-6 italic">"{quote}"</p>
      
      <div className="mt-auto">
        <p className="font-semibold text-gray-900">{author}</p>
        <p className="text-sm text-gray-600">
          {title}{company && `, ${company}`}
        </p>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;