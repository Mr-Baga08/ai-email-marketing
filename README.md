# Email Marketing AI Platform

## 🚀 Overview

Email Marketing AI is a comprehensive platform that combines traditional email marketing capabilities with cutting-edge AI automation. The platform allows businesses to create personalized email campaigns, automate customer responses, and gain insights through advanced analytics. By leveraging artificial intelligence, the system can handle routine inquiries, categorize incoming emails, and generate context-aware responses, freeing up human resources for more complex tasks.

## ✨ Features

### 📧 Email Marketing
- **Campaign Management**: Create, schedule, and track email campaigns
- **Templates**: Pre-designed templates and custom template creation
- **Personalization**: Dynamic content based on recipient data
- **A/B Testing**: Test different subject lines, content, and sending times
- **Scheduled Sending**: Plan campaigns for optimal delivery times
- **Analytics**: Track opens, clicks, bounces, and conversions

### 👤 Contact Management
- **Contact Lists**: Organize contacts into targeted lists
- **Segmentation**: Segment contacts based on behavior or attributes
- **Import/Export**: Bulk import from CSV or Excel files
- **Contact Profiles**: Comprehensive view of contact history and engagement
- **Activity Tracking**: Monitor engagement across campaigns

### 🤖 AI Email Automation
- **Inbox Monitoring**: 24/7 monitoring of customer emails
- **Auto-Classification**: Automatic categorization of incoming emails
- **Smart Responses**: AI-generated replies based on email content
- **Human Review**: Optional human oversight for critical responses
- **Learning System**: Continuous improvement through feedback
- **Knowledge Base Integration**: Leverages company knowledge for accurate responses

### 📊 Analytics & Reporting
- **Campaign Performance**: Detailed metrics on campaign effectiveness
- **Engagement Tracking**: Track user interactions across all touchpoints
- **Conversion Analysis**: Measure and attribute conversions
- **AI Performance Metrics**: Monitor automation efficiency and accuracy
- **Custom Reports**: Create and export customized reports
- **Dashboard**: Visual representation of key performance indicators

### 🧠 Knowledge Base
- **Content Management**: Store and organize company knowledge
- **AI Training Data**: Used to train the AI response system
- **Search & Retrieval**: Quick access to relevant information
- **Version Control**: Track changes and updates to knowledge base entries

### 💼 Subscription Management
- **Multiple Plans**: Basic, Premium, and Enterprise subscription tiers
- **AI Add-on**: Optional AI email automation add-on
- **Billing Integration**: Secure payment processing with Stripe
- **Usage Tracking**: Monitor resource usage across subscription tiers

### 🔧 Settings & Configuration
- **Email Integration**: Connect with various email providers
- **User Preferences**: Customize platform experience
- **AI Settings**: Configure automation parameters and thresholds
- **Notification Preferences**: Set up alerts and report delivery

## 🛠️ Technology Stack

### Frontend
- **React**: Frontend framework for building the user interface
- **React Router**: For navigation and routing
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Framer Motion**: Animation library for UI interactions
- **Recharts**: Charting library for data visualization
- **Axios**: HTTP client for API requests

### Backend
- **Node.js**: JavaScript runtime for the server
- **Express**: Web framework for building the API
- **MongoDB**: NoSQL database for storing application data
- **Mongoose**: MongoDB object modeling tool
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing
- **Nodemailer**: Email sending functionality

### AI & Machine Learning
- **Google Vertex AI**: Advanced AI models for content generation
- **OpenAI API**: Natural language processing capabilities
- **Ollama**: Local AI model hosting
- **Vector Embeddings**: For knowledge base semantic search

### Cloud Services
- **Google Cloud Storage**: For file storage (contact imports, attachments)
- **MongoDB Atlas**: Managed MongoDB service
- **Stripe**: Payment processing

### DevOps
- **Docker**: Containerization for consistent development and deployment
- **GitHub Actions**: CI/CD pipeline
- **Jest**: Testing framework
- **Morgan**: HTTP request logger

## 📊 Database Schema

### Users
- Authentication details
- Subscription information
- Email integration settings
- Preferences

### Campaigns
- Campaign details and content
- Tracking and analytics data
- Scheduling information
- Status and performance metrics

### Contacts
- Contact information
- List memberships
- Engagement history
- Custom attributes

### Contact Lists
- List metadata
- Associated contacts
- Source information
- Tags

### Automated Emails
- Incoming email details
- AI analysis results
- Generated responses
- Review status

### Knowledge Base
- Content entries
- Categories and tags
- Vector embeddings
- Metadata

### Templates
- Email templates
- Categories and usage stats
- Design elements
- Personalization variables

### Feedback
- AI response feedback
- Rating and improvement suggestions
- Edited responses
- User notes

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or later)
- MongoDB
- npm or yarn
- Google Cloud account (for storage and AI features)
- Stripe account (for payment processing)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/email-marketing-ai.git
cd email-marketing-ai
```

2. Install server dependencies
```bash
npm install
```

3. Install client dependencies
```bash
cd client
npm install
cd ..
```

4. Set up environment variables
- Create a `.env` file in the server directory based on the provided `.env.example`
- Fill in your MongoDB URI, JWT secret, API keys, etc.

5. Start the development server
```bash
npm run dev
```

This will start both the backend server and frontend client in development mode.

### Configuration

The following environment variables need to be configured:

#### Server Configuration
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)

#### MongoDB Configuration
- `MONGODB_URI`: MongoDB connection string

#### JWT Configuration
- `JWT_SECRET`: Secret key for JWT token generation

#### Email Configuration
- `TITAN_EMAIL_USER`: Email service username
- `TITAN_EMAIL_PASS`: Email service password

#### LLM Configuration
- `LLM_API_URL`: URL for the LLM API
- `DEFAULT_LLM_MODEL`: Default AI model to use
- `LLM_CONTEXT_SIZE`: Context window size
- `LLM_MAX_TOKENS`: Maximum tokens for generation

#### Google Cloud Configuration
- `GOOGLE_CLOUD_PROJECT`: GCP project ID
- `CONTACT_UPLOADS_BUCKET`: GCS bucket for contact uploads
- `VERTEX_AI_LOCATION`: GCP region for Vertex AI
- `VERTEX_AI_MODEL`: Vertex AI model name

#### Stripe Configuration
- `STRIPE_SECRET_KEY`: Stripe API key for payments

## 📁 Project Structure

```
email-marketing-ai/
├── client/                  # React frontend
│   ├── public/              # Static files
│   ├── src/                 # Source files
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service calls
│   │   ├── utils/           # Utility functions
│   │   └── styles/          # CSS styles
│   ├── package.json         # Frontend dependencies
│   └── tailwind.config.js   # Tailwind CSS configuration
├── server/                  # Node.js backend
│   ├── config/              # Configuration files
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Express middleware
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   └── index.js             # Entry point
├── .env                     # Environment variables
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Authenticate user
- `GET /api/auth/profile`: Get user profile
- `PUT /api/auth/profile`: Update user profile

### Campaigns
- `GET /api/campaigns`: Get all campaigns
- `POST /api/campaigns`: Create a campaign
- `GET /api/campaigns/:id`: Get campaign details
- `PUT /api/campaigns/:id`: Update campaign
- `DELETE /api/campaigns/:id`: Delete campaign
- `POST /api/campaigns/:id/send`: Send campaign
- `GET /api/campaigns/:id/stats`: Get campaign statistics

### Contacts
- `GET /api/contacts/lists`: Get all contact lists
- `POST /api/contacts/lists`: Create a contact list
- `GET /api/contacts/lists/:id`: Get contact list details
- `PUT /api/contacts/lists/:id`: Update contact list
- `DELETE /api/contacts/lists/:id`: Delete contact list
- `GET /api/contacts/lists/:id/contacts`: Get contacts in a list
- `POST /api/contacts/lists/:id/contacts`: Add contact to a list
- `DELETE /api/contacts/lists/:id/contacts/:contactId`: Remove contact from list
- `POST /api/contacts/upload`: Upload contacts from file

### Automation
- `GET /api/automation/status`: Get automation status
- `POST /api/automation/start`: Start automation service
- `POST /api/automation/stop`: Stop automation service
- `GET /api/automation/history`: Get automation email history
- `GET /api/automation/emails/:id`: Get specific automated email
- `POST /api/automation/emails/:id/send`: Send response to email

### Knowledge Base
- `GET /api/knowledge-base`: Get knowledge base entries
- `POST /api/knowledge-base`: Create entry
- `GET /api/knowledge-base/:id`: Get specific entry
- `PUT /api/knowledge-base/:id`: Update entry
- `DELETE /api/knowledge-base/:id`: Delete entry
- `GET /api/knowledge-base/search`: Search entries

### Integrations
- `POST /api/integrations/email/verify`: Verify email credentials
- `GET /api/integrations/email/status`: Get email integration status
- `DELETE /api/integrations/email`: Disconnect email integration

### Subscriptions
- `GET /api/subscriptions`: Get current subscription
- `PUT /api/subscriptions`: Update subscription
- `DELETE /api/subscriptions`: Cancel subscription
- `GET /api/subscriptions/plans`: Get available plans
- `POST /api/subscriptions/checkout`: Create checkout session

### Feedback
- `POST /api/feedback`: Submit feedback for AI response
- `GET /api/feedback`: Get feedback history
- `GET /api/feedback/stats`: Get feedback statistics

## 📊 Demo Data

The system includes sample data for testing purposes:

- Demo user accounts with various subscription levels
- Sample email campaigns
- Test contact lists
- Example automated email interactions
- Starter knowledge base entries

## 👥 User Roles

1. **Free User**: Basic email campaign features, limited contacts
2. **Basic Plan User**: Expanded email features, up to 1,000 contacts
3. **Premium User**: Advanced features, up to 10,000 contacts, A/B testing
4. **Enterprise User**: Unlimited contacts, dedicated support, custom integrations
5. **AI Add-on User**: Access to AI automation features (available for any plan)
6. **Admin**: Full system access, user management, analytics

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- HTTPS/TLS encryption
- Input validation
- Rate limiting
- Data sanitization
- CSRF protection
- Regular security audits

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@emailmarketingai.com or create an issue in the GitHub repository.
