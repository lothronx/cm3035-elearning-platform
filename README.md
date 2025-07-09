# 🎓 eLearning Platform

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/Django_REST-ff1709?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![WebSocket](https://img.shields.io/badge/WebSocket-4E9A06?style=for-the-badge&logo=websocket&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> A full-stack e-learning platform with real-time chat and notifications, role-based access control, and a responsive, modern UI.


## 🎬 Live Demo
  
<div align="center">

[![Watch Demo](https://img.shields.io/badge/Watch-Demo-red?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=rUQ9CwhClLI&ab_channel=WuYue)

[![Watch Demo](https://img.youtube.com/vi/rUQ9CwhClLI/maxresdefault.jpg)](https://www.youtube.com/watch?v=rUQ9CwhClLI&ab_channel=WuYue)

_Experience the platform's real-time features, role-based interfaces, and seamless user interactions_

</div>

## 🚀 Key Features

### 🔐 **Authentication & Security**
- JWT-based authentication with refresh token support
- Role-based access control (Teachers & Students)
- Fine-grained permissions for resource ownership
- Secure logout with token blacklisting

### 👥 **User Management**
- Comprehensive user profiles with status updates
- Member directory and search functionality
- Role-specific dashboards and interfaces
- Profile photo management

### 📖 **Course Management**
- Create, update, and manage courses (Teachers)
- Course enrollment system for students
- File-based course materials with organized storage
- Progress tracking and completion status
- Course activation/deactivation functionality

### 💬 **Real-time Communication**
- WebSocket-powered chat system with file attachments
- Instant notifications for course activities
- Hybrid API-WebSocket model for reliable message delivery
- Real-time enrollment and material update notifications

### 🔍 **Advanced Features**
- Global search functionality for courses and members
- Course feedback and rating system
- Read/unread status tracking for messages and notifications
- Responsive design with modern UI components

## 🏗️ Architecture

### **Backend Architecture**
- **Modular Design**: Five distinct modules (Accounts, Courses, Notifications, Chat, API)
- **Database Patterns**: Normalized relationships, soft deletion, metadata tracking
- **API Structure**: Hierarchical routing with nested resources
- **Real-time Features**: Django Channels with Redis for WebSocket support

### **Frontend Architecture**
- **Component-Based**: Organized by feature with reusable UI components
- **State Management**: Context-based global state with AuthContext and UserContext
- **Type Safety**: Full TypeScript implementation
- **Modern UI**: Shadcn UI components with Tailwind CSS styling

### **Security Implementation**
- Custom permission classes for fine-grained access control
- JWT authentication for both HTTP and WebSocket connections
- Resource ownership verification
- Input validation and error handling

## 🛠️ Technical Stack

### **Frontend**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: React Context API
- **Authentication**: JWT with automatic refresh

### **Backend**
- **Framework**: Django + Django REST Framework
- **Real-time**: Django Channels + Redis
- **Database**: SQLite (Development)
- **Authentication**: JWT with SimpleJWT
- **Testing**: Django Test Framework + Factory Boy

### **DevOps & Tools**
- **API Testing**: Comprehensive test suite with 90% coverage
- **Version Control**: Git
- **Development**: VS Code with modern tooling

## 📊 Database Design

![Database ERD](ERD.jpg)

The platform implements **5 core modules** with normalized relationships:

| Module               | Purpose                 | Key Models                                           |
| -------------------- | ----------------------- | ---------------------------------------------------- |
| 👤 **Accounts**      | User management & roles | `CustomUser`                                         |
| 📚 **Courses**       | Course lifecycle        | `Course`, `CourseMaterial`, `Enrollment`, `Feedback` |
| 🔔 **Notifications** | System alerts           | `Notification`                                       |
| 💬 **Chat**          | Real-time messaging     | `ChatMessage`                                        |
| 🔌 **API**           | Centralized endpoints   | Router configuration                                 |

**Key Design Patterns:**

- ✅ **User Model Extension** - Extends Django's `AbstractUser`
- 🔗 **Normalized Relationships** - Junction tables with descriptive names
- 📁 **Organized File Management** - Separated upload directories
- 🗂️ **Soft Delete** - `is_active` flags preserve data
- 📊 **Metadata Tracking** - Automatic timestamps
- ⚡ **Performance Optimization** - Strategic database indexing

## 🔐 Authentication & Security

### 🛡️ JWT-Based Authentication

- 🔑 **Token Management** - Secure JWT with refresh capabilities
- 🚪 **Session Control** - Multi-tab support with consistent state
- 🔒 **Secure Logout** - Token blacklisting prevents reuse

### 👥 Role-Based Access Control

| Permission Class          | Purpose               | Access Level                              |
| ------------------------- | --------------------- | ----------------------------------------- |
| 🎓 **IsTeacher**          | Teacher-only features | Create courses, manage content            |
| 👨‍🎓 **IsStudent**          | Student-only features | Enroll in courses, submit feedback        |
| 🏫 **IsCourseTeacher**    | Course ownership      | Modify owned courses only                 |
| 📚 **IsEnrolledStudent**  | Enrollment-based      | Access enrolled course materials          |
| 🔄 **Hybrid Permissions** | Combined access       | Read-only for students, full for teachers |

### 🔐 Security Features

- ✅ **Object-level permissions** for fine-grained access control
- ✅ **Automatic redirects** for unauthenticated users
- ✅ **Role-adaptive UI** shows only relevant features
- ✅ **Secure file uploads** with organized directory structure

## 💻 Frontend Design

Built with **React + Next.js** and **TypeScript** for type safety and modern development practices.

### 🏗️ Project Structure

```
client/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── contexts/           # Global state management
├── lib/               # Core utilities & auth helpers
├── types/             # TypeScript definitions
└── utils/             # Feature-specific utilities
```

### 📱 Key Pages & Features

<table>
<tr>
<td width="50%">

**🏠 Core Pages**

- 👋 **Welcome Page** - Login/Register toggle
- 📊 **Dashboard** - Personal hub with profile management
- 📚 **Courses** - Course catalog with enrollment
- 📖 **Course Details** - Materials, enrollments, feedback
- 👥 **Members** - User directory (teachers only)
- 👤 **Member Profile** - Individual user details

</td>
<td width="50%">

**⚡ Interactive Components**

- 🔍 **Smart Search** - Role-based course/member search
- 🔔 **Live Notifications** - Real-time updates
- 💬 **Chat System** - Instant messaging with files
- 🎯 **Progress Tracking** - Course completion status
- 🎨 **Dynamic UI** - Role-adaptive interface

</td>
</tr>
</table>

### 🎨 Design Highlights

- 🎭 **Role-Based UI** - Different interfaces for teachers vs students
- ⚡ **Optimistic Updates** - Immediate UI feedback
- 🍞 **Toast Notifications** - User-friendly feedback system
- 📱 **Responsive Design** - Tailwind CSS components
- 🎯 **Context Management** - Clean state handling without prop drilling

## 🌐 REST API

Comprehensive RESTful API built with **Django REST Framework** featuring hierarchical routing and role-based permissions.

### 🔗 API Endpoints Overview

<details>
<summary><b>🔐 Authentication Endpoints</b></summary>

```http
POST /api/auth/login/          # JWT token acquisition
POST /api/auth/register/       # User registration
POST /api/auth/refresh/        # JWT token refresh
POST /api/auth/verify/         # JWT token verification
POST /api/auth/logout/         # Secure logout with token blacklisting
```

</details>

<details>
<summary><b>👤 User Management</b></summary>

```http
# Dashboard
GET    /api/dashboard/                    # Current user dashboard
PATCH  /api/dashboard/patch-status/       # Update user status
PATCH  /api/dashboard/patch-photo/        # Update profile photo

# Members (Teachers only)
GET    /api/members/                      # List all users
GET    /api/members/{id}/                 # User details
GET    /api/members/search/               # Search users by name
```

</details>

<details>
<summary><b>📚 Course Management</b></summary>

```http
GET    /api/courses/                      # List active courses
POST   /api/courses/                      # Create course (teachers)
GET    /api/courses/{id}/                 # Course metadata
PATCH  /api/courses/{id}/                 # Update course (owner)
PATCH  /api/courses/{id}/toggle_activation/  # Activate/deactivate
GET    /api/courses/search/               # Search courses
```

</details>

<details>
<summary><b>📖 Course Resources (Nested)</b></summary>

```http
# Materials
GET    /api/courses/{course_id}/materials/           # List materials
POST   /api/courses/{course_id}/materials/           # Add material (teacher)
DELETE /api/courses/{course_id}/materials/{id}/      # Delete material

# Feedback
GET    /api/courses/{course_id}/feedback/            # List feedback
POST   /api/courses/{course_id}/feedback/            # Add feedback (students)
DELETE /api/courses/{course_id}/feedback/{id}/       # Delete feedback

# Enrollments
GET    /api/courses/{course_id}/enrollments/         # List enrollments
POST   /api/courses/{course_id}/student-enrollment/  # Enroll (students)
DELETE /api/courses/{course_id}/student-enrollment/  # Leave course
```

</details>

<details>
<summary><b>💬 Communication</b></summary>

```http
# Chat
GET    /api/chat/                    # List chat sessions
POST   /api/chat/                    # Send message
GET    /api/chat/{id}/               # Chat session details
POST   /api/chat/mark_chat_read/     # Mark as read
POST   /api/chat/initialize/         # Initialize chat

# Notifications
GET    /api/notifications/           # List notifications
PATCH  /api/notifications/{id}/      # Mark as read
POST   /api/notifications/mark_all_read/  # Mark all read
```

</details>

### 🏗️ API Architecture Patterns

**🎯 Dynamic Permissions**

```python
def get_permissions(self):
    if self.action == "create":
        self.permission_classes = [IsAuthenticated, IsTeacher]
    elif self.action in ["update", "partial_update"]:
        self.permission_classes = [IsAuthenticated, IsCourseTeacher]
    return super().get_permissions()
```

**📊 Context-Aware Serialization**

- **List View**: Lightweight serializer for performance
- **Detail View**: Complete data with relationships
- **Create/Update**: Validation-focused serializers

**🔧 Custom Actions**

- Course activation/deactivation
- Bulk operations for enrollments
- Progress tracking and completion

## ⚡ WebSockets

Real-time communication powered by **Django Channels** and **Redis** for instant notifications and chat functionality.

### 🏗️ Architecture Overview

<div align="center">

```mermaid
graph TD
    A[Frontend] -->|HTTP API| B[Django REST API]
    A -->|WebSocket| C[Django Channels]
    B -->|Notify| D[Redis Channel Layer]
    C -->|Subscribe| D
    D -->|Broadcast| C
    C -->|Real-time| A

    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#fff3e0
    style D fill:#ffebee
```

</div>

### 🔄 Dual Communication Model

**🔔 Notifications**: Direct WebSocket Model

```
Backend Event → WebSocket → Frontend Display
```

- System notifications sent instantly
- Course enrollment alerts
- Material update notifications
- Efficient for simple content

**💬 Chat**: API-WebSocket Hybrid Model

```
Frontend → HTTP API → Database → WebSocket Notification → Frontend Update
```

- Messages with file attachments via HTTP
- Reliable persistence before notification
- Consistent state management
- Supports complex content types

### 🔐 Security & Authentication

**🔑 JWT WebSocket Authentication**

```javascript
// Token passed as query parameter
const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${jwt_token}`);
```

**👥 User-Specific Channels**

- Each user has dedicated channel groups
- Prevents cross-user message leakage
- Supports concurrent connections

### 📡 Consumer Implementation

**NotificationConsumer**

- Handles system-generated alerts
- Direct WebSocket message delivery
- Lightweight for instant updates

**ChatConsumer**

- Manages real-time chat sessions
- Integrates with HTTP API for file uploads
- Maintains chat history and read status

## 🧪 Testing

Comprehensive test suite ensuring **90% code coverage** across the entire platform.

<div align="center">

![Test Results](test-results.png)
_Automated test results showing 90% coverage_

</div>

### 🎯 Testing Strategy

**🏗️ Test Organization**

- **Modular Testing**: Each app has dedicated test files
- **Factory-Based Fixtures**: Consistent test data with Factory Boy
- **Isolated Tests**: Clean database state for each test
- **Edge Case Coverage**: Both happy paths and error conditions

**🔍 Test Categories**

| Test Type              | Coverage                     | Purpose                      |
| ---------------------- | ---------------------------- | ---------------------------- |
| 🔐 **Authentication**  | API endpoints, JWT tokens    | Verify secure access control |
| 🏛️ **Database Models** | Model methods, relationships | Ensure data integrity        |
| 🌐 **API Endpoints**   | All REST endpoints           | Validate request/response    |
| 🔒 **Permissions**     | Role-based access            | Test authorization rules     |
| ⚡ **WebSockets**      | Real-time features           | Chat and notifications       |

### 🛠️ Testing Tools

```python
# Factory Boy for test data
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
```

**📊 Key Metrics**

- ✅ **90% Code Coverage** - Comprehensive test coverage
- ✅ **Automated Testing** - Django test framework integration
- ✅ **API Testing** - DRF test utilities for endpoint validation
- ✅ **Permission Testing** - Role-based access verification
- ✅ **WebSocket Testing** - Real-time feature validation

## 🚀 Quick Start

### 📋 Prerequisites

- **Python 3.12.9**
- **Node.js 18+**
- **Redis 7.2.7**
- **macOS/Linux** (Windows with WSL)

### ⚡ One-Command Setup

<details>
<summary><b>🔧 Backend Setup</b></summary>

1. **Start Redis Server**

   ```bash
   redis-server
   ```

2. **Setup Django Backend** _(in new terminal)_

   ```bash
   cd server
   conda create --name elearning-project python=3.12.9
   conda activate elearning-project
   pip install -r requirements.txt
   daphne -b 0.0.0.0 -p 8000 elearning.asgi:application
   ```

3. **Access Admin Panel**
   - URL: http://127.0.0.1:8000/admin/
   - Username: `admin`
   - Password: `admin`

</details>

<details>
<summary><b>🎨 Frontend Setup</b></summary>

_(in new terminal)_

```bash
cd client
npm install
npm run dev
```

**🌐 Access Application**: http://192.168.0.101:3000/

> 💡 **Note**: Update `NEXT_PUBLIC_API_URL` in `client/.env` if backend URL differs

</details>

### 👥 Demo Accounts

<div align="center">

|      Role       |              Username              |  Password   |                   Capabilities                   |
| :-------------: | :--------------------------------: | :---------: | :----------------------------------------------: |
| 🎓 **Teachers** | `teacher1`, `teacher2`, `teacher3` | `elearning` | Create courses, manage content, view all members |
| 👨‍🎓 **Students** |      `student1` - `student10`      | `elearning` |     Enroll in courses, submit feedback, chat     |
|  👨‍💼 **Admin**   |              `admin`               |   `admin`   |    Full system access via Django admin panel     |

💡 **Tip**: Try different accounts to experience role-based interfaces!

</div>

### 🧪 Run Tests

```bash
cd server
coverage run manage.py test
coverage report
```

## 📊 Evaluation

### ✅ Strengths

<table>
<tr>
<td width="50%">

**🏗️ Architecture Excellence**

- ⚛️ Modern React + Next.js frontend
- 🐍 Modular Django backend design
- 🔄 Hybrid API-WebSocket communication
- 🔐 Comprehensive JWT authentication

</td>
<td width="50%">

**🎯 Implementation Quality**

- 🧪 **90% test coverage** ensures reliability
- 🛡️ Fine-grained permission system
- ⚡ Real-time features enhance engagement
- 📊 Optimized database queries

</td>
</tr>
</table>

### 🔄 Areas for Improvement

| Category          | Current State          | Improvement Opportunity               |
| ----------------- | ---------------------- | ------------------------------------- |
| 🏗️ **API Design** | Django REST Framework  | Consider Django-Ninja for modern APIs |
| 🗃️ **Database**   | SQLite (development)   | PostgreSQL for production             |
| 📱 **Mobile**     | Limited responsiveness | Enhanced mobile experience            |
| 🚀 **Deployment** | Local development      | Production deployment setup           |
| 🔒 **Security**   | Basic validation       | Advanced rate limiting & validation   |

## 🎓 What I Learned

This project provided invaluable learning experiences across multiple domains:

### **Technical Skills**
- **Full-Stack Development**: Gained deep understanding of modern web application architecture from database design to user interface implementation
- **Real-time Technologies**: Mastered WebSocket implementation and hybrid communication models for responsive user experiences
- **Authentication Systems**: Implemented robust JWT-based authentication with role-based permissions and security best practices
- **API Design**: Developed RESTful APIs following industry standards with proper documentation and error handling

### **Development Practices**
- **Modular Architecture**: Learned the importance of separation of concerns and modular design for maintainable codebases
- **Test-Driven Development**: Understood the value of comprehensive testing and the impact of test coverage on code quality
- **Database Design**: Applied normalization principles and performance optimization techniques in real-world scenarios
- **Modern Frontend Patterns**: Implemented context-based state management and component composition in React

### **Project Management Insights**
- **Planning Importance**: Realized the critical value of thorough project planning and requirements documentation before implementation
- **Iterative Development**: Experienced the challenges of feature modification post-implementation and the cascading effects on dependencies
- **Code Quality**: Learned that writing clean, maintainable code from the start saves significant debugging and refactoring time

### **Problem-Solving Skills**
- **Complex System Integration**: Successfully integrated multiple technologies (REST APIs, WebSockets, authentication) into a cohesive platform
- **Performance Optimization**: Implemented strategies for efficient database queries and optimized API responses
- **User Experience Focus**: Balanced technical requirements with user-friendly interface design and responsive functionality

## 📄 License

This project is available for educational and personal use. Please respect academic integrity guidelines when referencing this work.

---

## 📬 Connect With Me

Built with ❤️ by **Yue Wu**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/yuewuxd/)

*This project demonstrates advanced web development skills and modern software engineering practices. If you found it interesting or have questions about the implementation, feel free to connect!*




