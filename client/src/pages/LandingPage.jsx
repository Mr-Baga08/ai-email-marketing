// client/src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaRobot, FaChartLine, FaUsers, FaCheckCircle } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import FeatureCard from '../components/ui/FeatureCard';
import PricingCard from '../components/ui/PricingCard';
import TestimonialCard from '../components/ui/TestimonialCard';
import CTA from '../components/ui/CTA';

const LandingPage = () => {
  // Features section data
  const features = [
    {
      icon: <FaEnvelope size={36} />,
      title: 'Email Marketing',
      description: 'Create personalized email campaigns that drive engagement and conversions. Import contacts, customize templates, and track results.',
      color: 'blue'
    },
    {
      icon: <FaRobot size={36} />,
      title: 'AI-Powered Automation',
      description: 'Let our AI handle customer inquiries 24/7. Automatically categorize, respond, and route emails based on content.',
      color: 'purple'
    },
    {
      icon: <FaChartLine size={36} />,
      title: 'Advanced Analytics',
      description: 'Gain insights with comprehensive email metrics. Track opens, clicks, and conversions to optimize your campaigns.',
      color: 'green'
    },
    {
      icon: <FaUsers size={36} />,
      title: 'Contact Management',
      description: 'Organize contacts into targeted lists. Import from CSV or Excel and segment based on behavior or attributes.',
      color: 'orange'
    }
  ];

  // Pricing plans data
  const pricingPlans = [
    {
      name: 'Basic',
      price: 29,
      period: 'month',
      features: [
        'Up to 1,000 contacts',
        'Basic email campaigns',
        'Standard templates',
        'Basic reporting',
        'Email support'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Premium',
      price: 79,
      period: 'month',
      features: [
        'Up to 10,000 contacts',
        'Advanced segmentation',
        'Custom templates',
        'A/B testing',
        'Advanced analytics',
        'Priority support'
      ],
      cta: 'Get Started',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 249,
      period: 'month',
      features: [
        'Unlimited contacts',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced security',
        'SLA guarantees',
        '24/7 phone support'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  // AI Email Automation add-on
  const aiAddOn = {
    name: 'AI Email Automation',
    price: 1000,
    period: 'month',
    description: 'Add advanced AI capabilities to any plan',
    features: [
      '24/7 inbox monitoring',
      'Automatic email classification',
      'AI-powered responses',
      'Knowledge base integration',
      'Human review workflow',
      'Custom training'
    ],
    cta: 'Add to Your Plan',
    highlight: true
  };

  // Testimonials data
  const testimonials = [
    {
      quote: "This platform revolutionized how we handle customer emails. The AI automation has saved our team countless hours while improving response times.",
      author: "Sarah Johnson",
      title: "Customer Success Manager",
      company: "TechStart Inc."
    },
    {
      quote: "The personalization capabilities are incredible. We've seen a 40% increase in email engagement since switching to this platform.",
      author: "Michael Chen",
      title: "Marketing Director",
      company: "GrowthForce"
    },
    {
      quote: "As a small business owner, I was skeptical about AI handling customer inquiries. But the quality of responses has been impressive, and it's been a game-changer for our team.",
      author: "Jessica Williams",
      title: "Founder & CEO",
      company: "Craft Collective"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Transform Your Email Marketing with AI
              </motion.h1>
              <motion.p 
                className="text-xl mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Send personalized campaigns and automate customer responses with our AI-powered platform. Save time, increase engagement, and drive growth.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Link 
                  to="/register" 
                  className="bg-white text-indigo-700 px-8 py-3 rounded-md font-semibold text-lg mr-4 hover:bg-opacity-90 transition-all"
                >
                  Get Started Free
                </Link>
                <Link 
                  to="/demo" 
                  className="bg-transparent border-2 border-white px-8 py-3 rounded-md font-semibold text-lg hover:bg-white hover:text-indigo-700 transition-all"
                >
                  Watch Demo
                </Link>
              </motion.div>
            </div>
            <div className="md:w-1/2">
              <motion.img 
                src="/images/hero-dashboard.png" 
                alt="Email Marketing Dashboard" 
                className="rounded-lg shadow-2xl"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-gray-50" id="features">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines email marketing with AI automation to give you powerful tools for engaging with your audience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* AI Email Automation Section */}
      <section className="py-20 bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
              <h2 className="text-3xl font-bold mb-6">AI Email Automation</h2>
              <p className="text-xl mb-8">
                Let our advanced AI handle your customer emails 24/7. The system automatically categorizes incoming messages, generates personalized responses, and only involves your team when necessary.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-400 mt-1 mr-3" />
                  <span>Continuous inbox monitoring with real-time processing</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-400 mt-1 mr-3" />
                  <span>Smart email categorization (inquiries, complaints, feedback)</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-400 mt-1 mr-3" />
                  <span>Personalized AI responses based on your knowledge base</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-400 mt-1 mr-3" />
                  <span>Quality assurance checks before sending</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-400 mt-1 mr-3" />
                  <span>Human review workflow for complex cases</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <motion.img 
                src="/images/ai-automation.png" 
                alt="AI Email Automation" 
                className="rounded-lg shadow-2xl"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-20" id="pricing">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works best for your business. All plans include core email marketing features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan, index) => (
              <PricingCard 
                key={index}
                name={plan.name}
                price={plan.price}
                period={plan.period}
                features={plan.features}
                cta={plan.cta}
                popular={plan.popular}
                delay={index * 0.1}
              />
            ))}
          </div>
          
          {/* AI Add-on */}
          <div className="max-w-xl mx-auto">
            <PricingCard 
              name={aiAddOn.name}
              price={aiAddOn.price}
              period={aiAddOn.period}
              description={aiAddOn.description}
              features={aiAddOn.features}
              cta={aiAddOn.cta}
              highlight={aiAddOn.highlight}
            />
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Trusted by businesses of all sizes to improve their email marketing and customer service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard 
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
                title={testimonial.title}
                company={testimonial.company}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <CTA 
        title="Ready to transform your email marketing?"
        subtitle="Get started today and see the difference AI can make."
        buttonText="Start Your Free Trial"
        buttonLink="/register"
      />
      
      <Footer />
    </div>
  );
};

export default LandingPage;