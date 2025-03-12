import React from 'react';
import { Check } from 'lucide-react';

/**
 * StepIndicator component for showing progress through multiple steps
 * 
 * @param {Object} props - Component properties
 * @param {number} props.currentStep - The current active step
 * @param {string[]} props.steps - Array of step labels
 * @param {string} [props.className] - Additional CSS classes
 */
const StepIndicator = ({ 
  currentStep, 
  steps, 
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-between w-full ${className}`}>
      {steps.map((step, index) => {
        // Determine step status
        const isPastStep = index < currentStep;
        const isCurrentStep = index === currentStep;
        const isUpcomingStep = index > currentStep;

        return (
          <div 
            key={index} 
            className="flex-1 flex items-center"
          >
            {/* Step Circle */}
            <div 
              className={`
                relative 
                w-10 
                h-10 
                rounded-full 
                flex 
                items-center 
                justify-center 
                transition-all 
                duration-300
                ${isPastStep ? 'bg-green-500 text-white' : ''}
                ${isCurrentStep ? 'bg-blue-500 text-white ring-4 ring-blue-200' : ''}
                ${isUpcomingStep ? 'bg-gray-200 text-gray-500' : ''}
              `}
            >
              {isPastStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="font-bold">{index + 1}</span>
              )}
            </div>

            {/* Step Connector (except for last step) */}
            {index < steps.length - 1 && (
              <div 
                className={`
                  flex-1 
                  h-1 
                  mx-2 
                  transition-colors 
                  duration-300
                  ${isPastStep ? 'bg-green-500' : 'bg-gray-200'}
                `}
              />
            )}

            {/* Step Label */}
            <div 
              className={`
                absolute 
                -bottom-6 
                left-1/2 
                transform 
                -translate-x-1/2 
                text-xs 
                text-center 
                w-max
                ${isCurrentStep ? 'font-semibold text-blue-600' : ''}
                ${isPastStep ? 'text-green-600' : ''}
                ${isUpcomingStep ? 'text-gray-500' : ''}
              `}
            >
              {step}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;