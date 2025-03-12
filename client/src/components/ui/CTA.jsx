import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CTA = ({ 
  title = "Ready to get started?", 
  subtitle = "Join thousands of businesses using our platform", 
  buttonText = "Start Now", 
  buttonLink = "/register", 
  secondaryButton 
}) => {
  return (
    <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
      <div className="container mx-auto px-6">
        <motion.div 
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {subtitle && <p className="text-lg md:text-xl mb-8 opacity-90">{subtitle}</p>}
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              to={buttonLink} 
              className="bg-white text-indigo-700 px-8 py-3 rounded-md font-semibold text-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
            >
              {buttonText}
            </Link>
            
            {secondaryButton && (
              <Link 
                to={secondaryButton.link} 
                className="bg-transparent border-2 border-white px-8 py-3 rounded-md font-semibold text-lg hover:bg-white hover:text-indigo-700 transition-all"
              >
                {secondaryButton.text}
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA; 
