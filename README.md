# BALANCE Dashboard

**Visual Analytics for Young Adult Cancer Survivors' Digital Health Platform**

A comprehensive dashboard system that transforms data from the BALANCE healthy living web platform into effective visualizations, providing researchers with insights into how young adult and adolescent cancer survivors engage with digital health resources.

## 🎯 Project Overview

The BALANCE Dashboard is developed under the NHMRC-funded BALANCE project (BALANCE: Promoting wellBeing in AdoLescent and young Adult cancer survivors) in collaboration with Griffith University and Canteen. This interactive analytics platform helps researchers understand user engagement patterns, content interactions, and platform effectiveness.

## ✨ Key Features

### 📊 **Comprehensive Analytics**
- **User Activity Trends**: Track user registration, login patterns, and engagement over time
- **Content Interaction Analysis**: Visualize how users interact with different content types
- **Module Completion Tracking**: Monitor progress through health and wellbeing modules
- **Session Analytics**: Heat maps showing user activity patterns by day and hour

### 🎨 **Rich Data Visualizations**
- Interactive charts using Recharts library
- Word clouds for content analysis
- Heat maps for temporal activity patterns
- Progress tracking with completion rates
- Geographic and demographic insights

### 👥 **User Management**
- Individual user progress tracking
- Cohort analysis capabilities
- User journey mapping
- Engagement pattern identification

### 🛠 **Administrative Tools**
- System monitoring and logs
- User management interface
- Support ticket system
- Real-time system health indicators

### 🎯 **Specialized Analysis Views**
- **Notes Analytics**: Text analysis, content length distribution, upload trends
- **Course Progress**: Module completion rates, learning pathways
- **User Engagement**: Session duration, visit depth, navigation patterns
- **Comment Analysis**: Feedback patterns and sentiment tracking

## 🏗 Technical Architecture

### **Backend (Django)**
```
dashboard/
├── dashboard_app/
│   ├── models.py          # Data models for WordPress integration
│   ├── views.py           # API endpoints and business logic
│   ├── database_router.py # Multi-database routing
│   └── adapters.py        # Custom authentication adapters
├── settings.py            # Django configuration
└── urls.py               # URL routing
```

### **Frontend (React)**
```
src/
├── components/           # Reusable UI components
│   ├── charts/          # Chart components (UserActivityChart, etc.)
│   ├── settings/        # Settings management components
│   └── support/         # Support system components
├── pages/               # Main page components
├── api/                 # API communication layer
├── styles/              # SCSS styling with theming
└── utils/               # Utility functions
```

### **Database Integration**
- **Primary Database**: MySQL for dashboard-specific data
- **WordPress Database**: Read-only integration for user content
- **Matomo Analytics**: Integration for web analytics data
- **Multi-database routing** for seamless data access

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- MySQL 5.7+
- Access to WordPress database
- Optional: Matomo analytics setup

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/yulinwu/balance-dashboard.git
cd balance-dashboard
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install django mysqlclient django-allauth django-cors-headers djangorestframework
```

4. **Configure databases**
```python
# Update settings.py with your database credentials
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'balance_dashboard',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '3306',
    },
    'wordpress': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'wordpress_db',
        'USER': 'wp_user',
        'PASSWORD': 'wp_password',
        'HOST': 'wp_host',
        'PORT': '3306',
    }
}
```

5. **Run migrations**
```bash
python manage.py migrate
python manage.py createsuperuser
```

6. **Start development server**
```bash
python manage.py runserver
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend  # or wherever your React app is located
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm start
```

The application will be available at `http://localhost:3000` (frontend) and `http://localhost:8000` (backend API).

## 🔧 Configuration

### Environment Variables
```bash
# Django settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database settings
DB_NAME=balance_dashboard
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost

# WordPress database
WP_DB_NAME=wordpress_db
WP_DB_USER=wp_user
WP_DB_PASSWORD=wp_password
WP_DB_HOST=wp_host

# Email settings (for notifications)
EMAIL_HOST=your_email_host
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### WordPress Integration
The dashboard reads data from WordPress tables:
- `bl_users` - User accounts
- `bl_posts` - User-generated content
- `bl_postmeta` - Content metadata
- `bl_comments` - User feedback
- `bl_usermeta` - User preferences and progress

## 📊 API Documentation

### Authentication Endpoints
```
POST /api/login/          # User authentication
POST /api/logout/         # User logout
POST /api/signup/         # User registration
```

### Analytics Endpoints
```
GET /api/user-activity-trends/     # User activity over time
GET /api/visit-duration/           # Session duration analysis
GET /api/popular-content/          # Most accessed content
GET /api/course-progress-analysis/ # Learning progress data
```

### User Management
```
GET /api/user-info/               # Current user information
GET /api/wordpress-users/         # WordPress user list
GET /api/module-completion-status/ # User progress tracking
```

### Content Analytics
```
GET /api/note-text-analysis/      # Text content analysis
GET /api/user-content-interaction/ # Interaction patterns
GET /api/analytics/comment-sources/ # Comment flow analysis
```

## 🎨 Theming and Customization

The dashboard supports multiple themes:
- **Light Theme**: Default clean interface
- **Dark Theme**: Dark mode for reduced eye strain
- **System Theme**: Follows OS preference

Themes are implemented using CSS custom properties and can be extended in `/src/styles/themes.scss`.

## 🔐 Security Features

- **CSRF Protection**: Built-in Django CSRF middleware
- **Authentication**: Session-based authentication with token support
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive form validation
- **SQL Injection Protection**: Django ORM prevents SQL injection
- **XSS Protection**: Content sanitization and CSP headers

## 📱 Responsive Design

The dashboard is fully responsive and optimized for:
- **Desktop**: Full-featured interface with side navigation
- **Tablet**: Adaptive layout with collapsible sidebar
- **Mobile**: Touch-optimized interface with mobile navigation


## 📈 Performance Monitoring

The dashboard includes built-in performance monitoring:
- **System Resource Usage**: CPU, memory, disk space
- **Database Performance**: Query optimization and connection monitoring
- **User Experience Metrics**: Page load times, interaction delays
- **Error Tracking**: Comprehensive logging and error reporting

## 🚀 Deployment

### Production Deployment

1. **Configure production settings**
```python
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com']
SECURE_SSL_REDIRECT = True
```

2. **Build frontend**
```bash
npm run build
```

3. **Collect static files**
```bash
python manage.py collectstatic
```

4. **Setup web server** (nginx + gunicorn recommended)


## 🤝 Contributing

This project is currently maintained as an individual academic project. If you're interested in contributing or have suggestions, please feel free to:

1. **Open an issue** for bug reports or feature requests
2. **Fork the repository** and submit pull requests
3. **Contact me directly** for collaboration opportunities

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint configuration for JavaScript/React
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure responsive design compatibility

## 📝 License

This project is developed as part of academic research under the NHMRC-funded BALANCE project framework. For licensing and usage inquiries, please contact the developer.

## 👤 Developer

**Yulin Wu**
- **University**: University of Queensland
- **Email**: s4565901@student.uq.edu.au
- **Project Context**: Individual academic project supporting the BALANCE research initiative

*This dashboard was developed to support researchers in understanding user engagement with digital health platforms for young adult cancer survivors.*

## 📞 Support

For technical support and questions:
- **Email**: s4565901@student.uq.edu.au


## 🔄 Changelog

### Version 1.0.0 (Current)
- Initial release with core analytics features
- WordPress integration
- User management system
- Responsive design implementation
- Multi-theme support

### Planned Features
- **Advanced ML Analytics**: Predictive user engagement models
- **Real-time Notifications**: Live updates for critical metrics
- **Export Capabilities**: PDF reports and data export
- **API Extensions**: Enhanced REST API with GraphQL support


### University of Queensland
