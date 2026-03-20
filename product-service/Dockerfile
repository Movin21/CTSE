# Build stage
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Production stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
COPY --from=builder /app/target/*.jar app.jar
USER appuser
EXPOSE 8082
ENTRYPOINT ["/bin/sh", "-c", "export SPRING_DATASOURCE_URL=$(echo $DATABASE_URL | awk '{print $1}' | sed 's|^postgres://|jdbc:postgresql://|; s|^postgresql://|jdbc:postgresql://|; s|/([^/?]*)(\\?.*)?$|/product_db\\2|') && echo \"Fixing URL: $SPRING_DATASOURCE_URL\" && java -jar app.jar"]
