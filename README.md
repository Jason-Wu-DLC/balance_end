## Overview
An interactive web dashboard providing visual analytics for the BALANCE project. This dashboard transforms platform usage data into effective visualizations to help researchers understand user engagement patterns.
## Project Goals

Data Visualization: Transform complex usage data into intuitive visual representations
Research Support: Provide researchers with insights into user behavior and platform effectiveness
Real-time Analytics: Monitor user engagement, content interaction, and learning progress
User Experience: Support young adult and adolescent cancer survivors through data-driven insights

## Features
## Analytics & Visualization

User Activity Trends: Track user engagement over time with customizable intervals
Content Interaction Analysis: Monitor how users engage with different content types
Course Progress Tracking: Visualize learning progression and completion rates
Session Activity Heatmaps: Understand user activity patterns by time and date
Popular Content Analytics: Identify most accessed and effective content

## User Management

WordPress Integration: Seamless connection with existing BALANCE platform
Role-based Access Control: Admin, staff, and user permission levels
User Progress Monitoring: Individual user journey tracking
Security Questions: Enhanced account recovery system

## Interface & Experience

Responsive Design: Works across desktop, tablet, and mobile devices
Dark/Light Themes: Customizable interface preferences
Interactive Charts: Built with Recharts for smooth, interactive visualizations
Real-time Updates: Live data refresh capabilities

## Technical Features

Multi-database Support: Django + WordPress database integration
RESTful API: Clean API design for data access
CSRF Protection: Enhanced security measures
Support Ticket System: Built-in user support functionality

## Architecture
Backend (Django)

Framework: Django 4.2+ with Python 3.8+
Database: MySQL (dual database setup for Django + WordPress)
Authentication: Django Allauth with custom adapters
API: Django REST Framework
Analytics: Custom analytics engine with Matomo integration

Frontend (React)

Framework: React 18.0+ with modern hooks
Styling: SCSS with CSS variables for theming
Charts: Recharts for data visualization
UI Components: Bootstrap + custom components
State Management: React Context API
