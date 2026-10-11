# SkillSync Backend

Spring Boot REST API for the SkillSync platform.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Language | Java 17 |
| Framework | Spring Boot 3.3.2 |
| Build | Maven |
| Database | MySQL 8+ |
| ORM | Spring Data JPA / Hibernate |
| Validation | Spring Boot Validation |

---

## Prerequisites
- **Java 17+** – `java -version`
- **Maven 3.8+** – `mvn -version`
- **MySQL 8+** – running locally or via Docker

---

## Database Setup

Connect to MySQL and run:

```sql
CREATE DATABASE skillsync
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Then update `src/main/resources/application.properties` with your credentials:

```properties
spring.datasource.username=<your-mysql-username>
spring.datasource.password=<your-mysql-password>
```

---

## Running the Application

```bash
# From the backend/ directory
mvn spring-boot:run
```

The server starts on **http://localhost:8080**.

---

## Test the API

```bash
curl http://localhost:8080/api/test
# → SkillSync Backend is running
```

Or open in a browser: [http://localhost:8080/api/test](http://localhost:8080/api/test)

---

## Project Structure

```
backend/
├── pom.xml                          # Maven dependencies & build config
└── src/
    ├── main/
    │   ├── java/com/skillsync/
    │   │   ├── SkillSyncApplication.java   # Entry point
    │   │   └── controller/
    │   │       └── TestController.java     # GET /api/test
    │   └── resources/
    │       └── application.properties     # DB & server config
    └── test/
        └── java/com/skillsync/
            └── SkillSyncApplicationTests.java
```

---

## Planned Feature Packages (to be added later)

```
com.skillsync/
├── config/       # Security, CORS, beans
├── controller/   # REST controllers per feature
├── service/      # Business logic
├── repository/   # Spring Data JPA repositories
├── model/        # JPA entities
├── dto/          # Request / Response DTOs
└── exception/    # Global exception handling
```
