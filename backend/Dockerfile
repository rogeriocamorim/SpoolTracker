# syntax=docker/dockerfile:1.4

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml first for dependency resolution
COPY pom.xml .

# Download dependencies with cache mount
# id=maven-cache ensures the cache persists between builds
# sharing=locked prevents race conditions
RUN --mount=type=cache,id=maven-cache,target=/root/.m2/repository,sharing=locked \
    mvn dependency:resolve dependency:resolve-plugins -B

# Copy source code
COPY src ./src

# Build with cache mount - dependencies won't be re-downloaded
RUN --mount=type=cache,id=maven-cache,target=/root/.m2/repository,sharing=locked \
    mvn package -DskipTests -Dquarkus.package.jar.type=uber-jar

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
