# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS frontend-build
WORKDIR /workspace/bootui

RUN npm install -g pnpm@11.1.2

COPY bootui/package.json bootui/pnpm-lock.yaml bootui/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY bootui/ ./
RUN pnpm build

FROM eclipse-temurin:25-jdk AS backend-build
WORKDIR /workspace

COPY mvnw pom.xml ./
COPY .mvn/ .mvn/
RUN chmod +x ./mvnw && ./mvnw -B -ntp dependency:go-offline

COPY src/ src/
COPY --from=frontend-build /workspace/bootui/dist/ src/main/resources/static/
RUN ./mvnw -B -ntp -DskipTests package

FROM eclipse-temurin:25-jre AS layers-extract
WORKDIR /builder

COPY --from=backend-build /workspace/target/*.jar application.jar
RUN java -Djarmode=tools -jar application.jar extract --layers --destination extracted

FROM eclipse-temurin:25-jre AS runtime
WORKDIR /application

RUN useradd --system --create-home --shell /usr/sbin/nologin bootifull

COPY --from=layers-extract /builder/extracted/dependencies/ ./
COPY --from=layers-extract /builder/extracted/spring-boot-loader/ ./
COPY --from=layers-extract /builder/extracted/snapshot-dependencies/ ./
COPY --from=layers-extract /builder/extracted/application/ ./

USER bootifull
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "application.jar"]
