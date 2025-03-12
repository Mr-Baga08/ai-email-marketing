// server/controllers/subscriptionController.js
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Subscription plans and features mapping
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      { name: 'basic_email_campaigns', active: true },
      { name: 'contact_management', active: true, limit: 500 },
      { name: 'template_editor', active: true }
    ],
    limits: {
      contactsLimit: 500,
      campaignsPerMonth: 5,
      emailsPerDay: 100
    }
  },
  basic: {
    name: 'Basic',
    price: 29,
    features: [
      { name: 'basic_email_campaigns', active: true },
      { name: 'contact_management', active: true, limit: 1000 },
      { name: 'template_editor', active: true },
      { name: 'basic_reporting', active: true },
      { name: 'email_support', active: true }
    ],
    limits: {
      contactsLimit: 1000,
      campaignsPerMonth: 20,
      emailsPerDay: 500
    }
  },
  premium: {
    name: 'Premium',
    price: 79,
    features: [
      { name: 'basic_email_campaigns', active: true },
      { name: 'advanced_campaigns', active: true },
      { name: 'contact_management', active: true, limit: 10000 },
      { name: 'advanced_segmentation', active: true },
      { name: 'template_editor', active: true },
      { name: 'custom_templates', active: true },
      { name: 'a_b_testing', active: true },
      { name: 'advanced_reporting', active: true },
      { name: 'priority_support', active: true }
    ],
    limits: {
      contactsLimit: 10000,
      campaignsPerMonth: 50,
      emailsPerDay: 2000
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 249,
    features: [
      { name: 'basic_email_campaigns', active: true },
      { name: 'advanced_campaigns', active: true },
      { name: 'contact_management', active: true, limit: null },
      { name: 'advanced_segmentation', active: true },
      { name: 'template_editor', active: true },
      { name: 'custom_templates', active: true },
      { name: 'a_b_testing', active: true },
      { name: 'advanced_reporting', active: true },
      { name: 'priority_support', active: true },
      { name: 'dedicated_account_manager', active: true },
      { name: 'custom_integrations', active: true },
      { name: 'advanced_security', active: true },
      { name: 'sla_guarantees', active: true }
    ],
    limits: {
      contactsLimit: null, // Unlimited
      campaignsPerMonth: null, // Unlimited
      emailsPerDay: null // Unlimited
    }
  }
};

// @desc   Get current user subscription
// @route  GET /api/subscriptions
// @access Private
exports.getSubscription = async (req, res) => {
  try {
    // Get user with subscription details
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      subscription: user.subscription,
      plan: PLANS[user.subscription.plan] || PLANS.free
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Update user subscription
// @route  PUT /api/subscriptions
// @access Private
exports.updateSubscription = async (req, res) => {
  try {
    const { plan, aiEmailAutomation } = req.body;

    // Validate plan
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    // Get user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user already has a paid subscription, we'd handle this through Stripe
    // This would involve creating or updating a subscription through the Stripe API
    // For now, we'll just update the subscription in the database

    // Update subscription
    user.subscription = {
      plan,
      status: 'active',
      features: PLANS[plan].features,
      aiEmailAutomation: aiEmailAutomation === true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      limits: PLANS[plan].limits
    };

    await user.save();

    res.json({
      message: 'Subscription updated successfully',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Check if a feature is enabled for the user
// @route  GET /api/subscriptions/features/:featureName
// @access Private
exports.checkFeature = async (req, res) => {
  try {
    const { featureName } = req.params;

    // Get user with subscription details
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check special case for AI Email Automation
    if (featureName === 'aiEmailAutomation') {
      return res.json({
        enabled: user.subscription.aiEmailAutomation === true
      });
    }

    // Check if feature is in the features array
    const feature = user.subscription.features.find(f => f.name === featureName);
    
    res.json({
      enabled: feature ? feature.active : false,
      limit: feature ? feature.limit : null
    });
  } catch (error) {
    console.error('Error checking feature:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Create checkout session for subscription
// @route  POST /api/subscriptions/checkout
// @access Private
exports.createCheckoutSession = async (req, res) => {
  try {
    const { plan, aiEmailAutomation } = req.body;

    // Validate plan
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    // Skip payment for free plan
    if (plan === 'free') {
      // Update user's subscription directly
      await User.findByIdAndUpdate(req.user.id, {
        subscription: {
          plan: 'free',
          status: 'active',
          features: PLANS.free.features,
          aiEmailAutomation: false,
          startDate: new Date(),
          limits: PLANS.free.limits
        }
      });

      return res.json({
        success: true,
        message: 'Free plan activated',
        redirectUrl: '/dashboard'
      });
    }

    // Get current user for metadata
    const user = await User.findById(req.user.id);

    // Create line items for Stripe
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${PLANS[plan].name} Plan`,
            description: `Monthly subscription to the ${PLANS[plan].name} plan`
          },
          unit_amount: PLANS[plan].price * 100, // Convert to cents
          recurring: {
            interval: 'month'
          }
        },
        quantity: 1
      }
    ];

    // Add AI Email Automation if selected
    if (aiEmailAutomation) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'AI Email Automation',
            description: 'Monthly subscription to AI Email Automation feature'
          },
          unit_amount: 100000, // $1,000 in cents
          recurring: {
            interval: 'month'
          }
        },
        quantity: 1
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      customer_email: user.email,
      metadata: {
        userId: user._id.toString(),
        plan,
        aiEmailAutomation: aiEmailAutomation ? 'true' : 'false'
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Handle webhook from Stripe
// @route  POST /api/subscriptions/webhook
// @access Public (but verified with Stripe signature)
exports.handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleCheckoutSessionCompleted(session);
      break;
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      await handleSubscriptionUpdated(subscription);
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      await handleSubscriptionDeleted(deletedSubscription);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};

// Helper function to handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session) {
  try {
    // Get metadata
    const { userId, plan, aiEmailAutomation } = session.metadata;

    // Get plan features
    const planFeatures = PLANS[plan]?.features || PLANS.free.features;
    const planLimits = PLANS[plan]?.limits || PLANS.free.limits;

    // Update user subscription
    await User.findByIdAndUpdate(userId, {
      subscription: {
        plan,
        status: 'active',
        features: planFeatures,
        aiEmailAutomation: aiEmailAutomation === 'true',
        startDate: new Date(),
        customerId: session.customer,
        subscriptionId: session.subscription,
        limits: planLimits
      }
    });

    console.log(`Subscription updated for user ${userId}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

// Helper function to handle customer.subscription.updated event
async function handleSubscriptionUpdated(subscription) {
  try {
    // Find user by Stripe customer ID
    const user = await User.findOne({ 'subscription.customerId': subscription.customer });

    if (!user) {
      console.error('User not found for customer ID:', subscription.customer);
      return;
    }

    // Update subscription status based on Stripe status
    let status = 'active';
    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
      status = 'past_due';
    } else if (subscription.status === 'canceled') {
      status = 'cancelled';
    } else if (subscription.status === 'incomplete_expired') {
      status = 'inactive';
    }

    // Update user subscription
    user.subscription.status = status;
    user.subscription.endDate = new Date(subscription.current_period_end * 1000);

    await user.save();
    console.log(`Subscription status updated for user ${user._id}: ${status}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Helper function to handle customer.subscription.deleted event
async function handleSubscriptionDeleted(subscription) {
  try {
    // Find user by Stripe customer ID
    const user = await User.findOne({ 'subscription.customerId': subscription.customer });

    if (!user) {
      console.error('User not found for customer ID:', subscription.customer);
      return;
    }

    // Downgrade user to free plan
    user.subscription = {
      plan: 'free',
      status: 'active',
      features: PLANS.free.features,
      aiEmailAutomation: false,
      startDate: new Date(),
      limits: PLANS.free.limits
    };

    await user.save();
    console.log(`User ${user._id} downgraded to free plan due to subscription cancellation`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// @desc   Cancel subscription
// @route  POST /api/subscriptions/cancel
// @access Private
exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a subscription
    if (!user.subscription.subscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    // Cancel subscription in Stripe
    await stripe.subscriptions.del(user.subscription.subscriptionId);

    // Update user's subscription status
    user.subscription.status = 'cancelled';
    await user.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get subscription usage stats
// @route  GET /api/subscriptions/usage
// @access Private
exports.getUsageStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get subscription limits
    const { limits } = user.subscription;

    // Here you would query your database to get actual usage stats
    // For this example, we'll just return mock data
    const usageStats = {
      contacts: {
        used: 450,
        limit: limits.contactsLimit === null ? 'Unlimited' : limits.contactsLimit,
        percentage: limits.contactsLimit ? Math.round((450 / limits.contactsLimit) * 100) : 0
      },
      campaigns: {
        used: 3,
        limit: limits.campaignsPerMonth === null ? 'Unlimited' : limits.campaignsPerMonth,
        percentage: limits.campaignsPerMonth ? Math.round((3 / limits.campaignsPerMonth) * 100) : 0
      },
      emails: {
        used: 75,
        limit: limits.emailsPerDay === null ? 'Unlimited' : limits.emailsPerDay,
        percentage: limits.emailsPerDay ? Math.round((75 / limits.emailsPerDay) * 100) : 0
      }
    };

    res.json({
      success: true,
      usageStats
    });
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};