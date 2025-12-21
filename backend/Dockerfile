# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# First, copy only pom.xml and download dependencies (cached layer)
COPY pom.xml .
# Use resolve instead of go-offline for better Quarkus compatibility
RUN mvn dependency:resolve dependency:resolve-plugins -B

# Now copy source code and build (this layer changes with code)
COPY src ./src
# Don't use offline mode - Quarkus may need additional artifacts during code generation
# Use quarkus.package.jar.type instead of deprecated quarkus.package.type
RUN mvn package -DskipTests -Dquarkus.package.jar.type=uber-jar

# Stage 2: Run
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=build /app/target/*-runner.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
